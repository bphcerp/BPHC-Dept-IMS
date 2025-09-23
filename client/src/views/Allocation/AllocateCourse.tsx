import AddSectionDialog from "@/components/allocation/AddSectionDialog";
import AddSectionCard from "@/components/allocation/AllocationSectionCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/lib/axios-instance";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  AllocationType,
  Course,
  CourseAllocateType,
  SectionClient,
} from "node_modules/lib/src/types/allocation";
import { PreferredFaculty } from "node_modules/lib/src/types/allocationFormBuilder";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

const AllocateCourse = () => {
  const { id: code } = useParams();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [lecturePrefs, setLecturePrefs] = useState<PreferredFaculty[]>([]);
  const [tutorialPrefs, setTutorialPrefs] = useState<PreferredFaculty[]>([]);
  const [practicalPrefs, setPracticalPrefs] = useState<PreferredFaculty[]>([]);
  const [sections, setSections] = useState<SectionClient[]>(() => {
    const lsections = localStorage.getItem(`sections-${code}`);
    return lsections ? (JSON.parse(lsections) as SectionClient[]) : [];
  });
  const [IC, setIC] = useState<string>(() => {
    return localStorage.getItem(`ic-${code}`) ?? "";
  });

  const [lecturesSections, setLectureSections] = useState<SectionClient[]>([]);
  const [tutorialSections, setTutorialSections] = useState<SectionClient[]>([]);
  const [practicalSections, setPracticalSections] = useState<SectionClient[]>(
    []
  );
  const queryClient = useQueryClient();
  const { data: allocationData, isLoading: isLoadingAllocation } = useQuery({
    queryKey: [`allocation ${code}`],
    queryFn: async () => {
      try {
        const res = await api.get<AllocationType>(
          `/allocation/allocation/get?code=${code}`
        );
        return res.data;
      } catch (error) {
        toast.error("Failed to fetch courses");
        throw error;
      }
    },
  });

  const { data: courseData, isLoading: isLoadingCourse } = useQuery({
    queryKey: [`course code ${code}`],
    queryFn: async () => {
      try {
        const res = await api.get<Course>(
          `/allocation/course/getCourseByCode/${code}`
        );
        return res.data;
      } catch (error) {
        toast.error("Failed to fetch courses");
        throw error;
      }
    },
  });

  const { data: preferredFaculties, isLoading: isLoadingFaculty } = useQuery({
    queryKey: [`preferred faculty ${code}`],
    queryFn: async () => {
      try {
        const res = await api.get<PreferredFaculty[]>(
          `/allocation/allocation/getPreferredFaculty?code=${code}`
        );
        return res.data;
      } catch (error) {
        toast.error(
          ((error as AxiosError).response?.data as string) ??
            "Failed to get faculty with preference"
        );
        throw error;
      }
    },
  });

  const allocationMutation = useMutation({
    mutationFn: async (data: CourseAllocateType) => {
      await api.post("/allocation/allocation/create", data);
    },
    onSuccess: () => {
      toast.success("Course allocated Successfully");
      localStorage.removeItem(`sections-${code}`);
      localStorage.removeItem(`ic-${code}`);
      void queryClient.invalidateQueries([`allocation ${code}`]);
      setSections([]);
    },
    onError: (error) => {
      toast.error(
        ((error as AxiosError).response?.data as string) ?? "An error occurred"
      );
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!IC) {
      toast.warning("IC not selected");
      return;
    }

    const lectures = lecturesSections.map((el, i) => {
      return {
        type: el.type,
        number: i + 1,
        instructors: el.instructors.map((ins) => ins[0]),
      };
    });
    const practicals = practicalSections.map((el, i) => {
      return {
        type: el.type,
        number: i + 1,
        instructors: el.instructors.map((ins) => ins[0]),
      };
    });
    const tutorials = tutorialSections.map((el, i) => {
      return {
        type: el.type,
        number: i + 1,
        instructors: el.instructors.map((ins) => ins[0]),
      };
    });

    const data = {
      courseCode: code ?? "",
      ic: IC,
      sections: [...lectures, ...practicals, ...tutorials],
    };
    allocationMutation.mutate(data);
  };

  const mp = useMemo(() => {
    const map = new Map<string, string>();
    if (!preferredFaculties) return map;
    for (const instructors of preferredFaculties) {
      map.set(
        instructors.submittedBy.email,
        instructors.submittedBy.name ?? ""
      );
    }
    return map;
  }, [preferredFaculties]);

  useEffect(() => {
    if (!preferredFaculties) return;
    setLecturePrefs(
      preferredFaculties.filter(
        (el) => el.templateField.preferenceType === "LECTURE"
      )
    );
    setTutorialPrefs(
      preferredFaculties.filter(
        (el) => el.templateField.preferenceType === "TUTORIAL"
      )
    );
    setPracticalPrefs(
      preferredFaculties.filter(
        (el) => el.templateField.preferenceType === "PRACTICAL"
      )
    );
  }, [preferredFaculties]);

  useEffect(() => {
    setLectureSections(sections.filter((el) => el.type == "LECTURE"));
    setPracticalSections(sections.filter((el) => el.type == "PRACTICAL"));
    setTutorialSections(sections.filter((el) => el.type == "TUTORIAL"));
  }, [sections]);

  useEffect(() => {
    localStorage.setItem(`sections-${code}`, JSON.stringify(sections));
  }, [sections, code]);

  useEffect(() => {
    if (IC.length > 0) localStorage.setItem(`ic-${code}`, IC);
  }, [IC, code]);

  const handleAddClick = () => {
    setIsDialogOpen(true);
  };

  if (isLoadingCourse || isLoadingFaculty || isLoadingAllocation)
    return (
      <div className="mx-auto flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  return (
    <div className="container mx-auto flex flex-col px-6 py-10">
      <div className="mx-auto pb-8 text-2xl font-bold">{courseData?.name}</div>
      <div className="flex items-center justify-evenly">
        <div>
          <span className="font-semibold">Course Code:</span> {courseData?.code}
        </div>
        <div className="rouded-xl bordered-black flex space-x-4 rounded-xl border px-4 py-2">
          <div> L - {courseData?.lectureUnits}</div>
          <div> P - {courseData?.practicalUnits}</div>
          <div>
            T -{" "}
            {(courseData?.totalUnits ?? 0) -
              (courseData?.practicalUnits ?? 0) -
              (courseData?.lectureUnits ?? 0)}
          </div>
        </div>
        <div>
          <span className="font-semibold">Offered As: </span>
          {courseData?.offeredAs}
        </div>
      </div>
      {allocationData ? (
        <div className="flex flex-col gap-2 pt-4">
          <div className="mx-auto flex items-center gap-4">
            <Label className="text-md font-semibold">
              Instructor Incharge :
            </Label>
            <div>{allocationData.ic.name}</div>
          </div>
          {allocationData.sections.length > 0 && (
            <div className="divide grid grid-cols-3 gap-4 divide-x-2">
              <div className="px-2">
                <h2 className="text-lg font-semibold">Lecture Sections</h2>
                {allocationData.sections
                  .filter((section) => section.type === "LECTURE")
                  .map((section, i) => (
                    <Card className="pt-4" key={i}>
                      <CardContent className="flex flex-col gap-2">
                        <CardTitle>
                          {section.type + " " + section.number}
                        </CardTitle>
                        <div className="flex flex-col">
                          <ol className="list-decimal px-6">
                            {section.instructors.map((el, ind) => (
                              <li key={ind} className="text-base">
                                {el.instructor?.name}
                              </li>
                            ))}
                          </ol>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
              <div className="px-2">
                <h2 className="text-lg font-semibold">Tutorial Sections</h2>
                {allocationData.sections
                  .filter((section) => section.type === "TUTORIAL")
                  .map((section, i) => (
                    <Card className="pt-4" key={i}>
                      <CardContent className="flex flex-col gap-2">
                        <CardTitle>
                          {section.type + " " + section.number}
                        </CardTitle>
                        <div className="flex flex-col">
                          <ol className="list-decimal px-6">
                            {section.instructors.map((el, ind) => (
                              <li key={ind} className="text-base">
                                {el.instructor?.name}
                              </li>
                            ))}
                          </ol>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
              <div className="px-2">
                <h2 className="text-lg font-semibold">Practical Sections</h2>
                {allocationData.sections
                  .filter((section) => section.type === "PRACTICAL")
                  .map((section, i) => (
                    <Card className="pt-4" key={i}>
                      <CardContent className="flex flex-col gap-2">
                        <CardTitle>
                          {section.type + " " + section.number}
                        </CardTitle>
                        <div className="flex flex-col">
                          <ol className="list-decimal px-6">
                            {section.instructors.map((el, ind) => (
                              <li key={ind} className="text-base">
                                {el.instructor?.name}
                              </li>
                            ))}
                          </ol>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-2 pt-4">
          <div className="mx-auto flex items-center gap-4">
            <Label className="text-md pt-2 font-semibold">
              Instructor Incharge
            </Label>
            <div className="flex gap-2">
              <Select onValueChange={setIC} value={IC}>
                <SelectTrigger>
                  <SelectValue placeholder="Select IC..." />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(mp.entries()).map(([email, name], i) => (
                    <SelectItem key={i} value={email}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="divide grid grid-cols-3 gap-4 divide-x-2">
            <div className="px-2">
              <h2 className="text-lg font-semibold">Lecture Sections</h2>
              {lecturesSections.map((el, i) => (
                <AddSectionCard section={el} number={i + 1} key={i} />
              ))}
            </div>
            <div className="px-2">
              <h2 className="text-lg font-semibold">Tutorial Sections</h2>
              {tutorialSections.map((el, i) => (
                <AddSectionCard section={el} number={i + 1} key={i} />
              ))}
            </div>
            <div className="px-2">
              <h2 className="text-lg font-semibold">Practical Sections</h2>
              {practicalSections.map((el, i) => (
                <AddSectionCard section={el} number={i + 1} key={i} />
              ))}
            </div>
          </div>
          <div className="mx-auto mt-2 flex gap-2">
            <Button type="button" onClick={handleAddClick}>
              Add Section
            </Button>
            <Button type="submit">Finish Allocation</Button>
          </div>
        </form>
      )}

      <AddSectionDialog
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        setSections={setSections}
        lecturePrefs={lecturePrefs}
        tutorialPrefs={tutorialPrefs}
        practicalPrefs={practicalPrefs}
      />
    </div>
  );
};

export default AllocateCourse;
