import AddSectionDialog from "@/components/allocation/AddSectionDialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/lib/axios-instance";
import { useQuery } from "@tanstack/react-query";
import { Course } from "node_modules/lib/src/types/allocation";
import { PreferredFaculty } from "node_modules/lib/src/types/allocationFormBuilder";
import { useEffect, useMemo, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

const AllocateCourse = () => {
  const { id: code } = useParams();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sections, setSections] = useState([]);
  const [lecturePrefs, setLecturePrefs] = useState<PreferredFaculty[]>([]);
  const [tutorialPrefs, setTutorialPrefs] = useState<PreferredFaculty[]>([]);
  const [practicalPrefs, setPracticalPrefs] = useState<PreferredFaculty[]>([]);
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
        toast.error("Failed to faculty with preference");
        throw error;
      }
    },
  });
  const form = useForm({
    defaultValues: {
      ic: "",
    },
  });
  const onSubmit: SubmitHandler<any> = (data) => {
    console.log(data);
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

  const handleAddClick = () => {
    setIsDialogOpen(true);
  };
  if (isLoadingCourse || isLoadingFaculty)
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
        <div className="rouded-xl bordered-black flex space-x-4 rounded-xl border-2 border-black px-4 py-2">
          <div> L - {courseData?.lectureUnits}</div>
          <div> P - {courseData?.practicalUnits}</div>
          <div>
            {" "}
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
      <Form {...form}>
        <form
          onSubmit={(e) => {
            void form.handleSubmit(onSubmit)(e);
          }}
          className="flex flex-col gap-2 pt-4"
        >
          <FormField
            control={form.control}
            name="ic"
            render={({ field }) => (
              <FormItem className="mx-auto flex items-center gap-4">
                <FormLabel className="text-md pt-2 font-semibold">
                  Instructor Incharge
                </FormLabel>
                <div className="flex gap-2">
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select IC..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Array.from(mp.entries()).map(([email, name], i) => (
                        <SelectItem key={i} value={email}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </FormItem>
            )}
          />
          <Button className="mx-auto mt-4" onClick={handleAddClick}>
            {" "}
            Add Section
          </Button>
        </form>
      </Form>
      <AddSectionDialog
        isDialogOpen={isDialogOpen}
        sections={sections}
        courseCode={code}
        lecturePrefs={lecturePrefs}
        tutorialPrefs={tutorialPrefs}
        practicalPrefs={practicalPrefs}
      />
    </div>
  );
};

export default AllocateCourse;
