import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/axios-instance";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AllocationSummaryType,
  SemesterMinimal,
  semesterTypeMap,
} from "../../../../lib/src/types/allocation";
import { toast } from "sonner";
import { getFormattedAY } from "./AllocationOverview";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { sectionTypes } from "node_modules/lib/src/schemas/Allocation";
import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/Auth";
import AssignInstructorDialog from "@/components/Allocation/AssignInstructorDialog";
import NotFoundPage from "@/layouts/404";

const getSectionNumber = (
  courseAllocation: AllocationSummaryType[number],
  sectionId: string,
  sectionType: (typeof sectionTypes)[number],
) =>
  courseAllocation.sections
    .filter((section) => section.type === sectionType)
    .findIndex((section) => section.id === sectionId) + 1;

export const AllocationSummary = () => {
  const [showTeachingLoad, setShowTeachingLoad] = useState(false);
  const [isAssignInstructorDialogOpen, setIsAssignInstructorDialogOpen] =
    useState(false);
  const [selectedInstructorEmail, setSelectedInstructorEmail] = useState<
    string | null
  >(null);
  const [viewMode, setViewMode] = useState<"course" | "faculty">("course");

  const [searchParams] = useSearchParams();
  const semesterId = searchParams.get("semesterId");

  const { checkAccess } = useAuth();

  const queryClient = useQueryClient();

  const toggleSummaryAccessMutation = useMutation({
    mutationFn: () =>
      api
        .post(
          `/allocation/semester/toggleSummary${semesterId ? `?semesterId=${semesterId}` : ""}`,
        )
        .then(() => {
          toast.success("Successful");
          queryClient.invalidateQueries(["semester", "latest"]);
        })
        .catch((e) => {
          console.error("Error while toggling summary access", e);
          toast.error("Something went wrong");
        }),
  });

  const { data: latestSemester } = useQuery({
    queryKey: ["semester", "latest"],
    queryFn: () =>
      api
        .get<SemesterMinimal>("/allocation/semester/getLatest?minimal=true")
        .then(({ data }) => data),
  });

  if (latestSemester?.summaryHidden && !checkAccess("allocation:write"))
    return <NotFoundPage />;

  const { data: allocationData, isLoading: isLoadingAllocation } = useQuery({
    queryKey: [`allocation`, "summary", semesterId ?? "latest"],
    queryFn: async () => {
      try {
        const query = semesterId
          ? `?semesterId=${encodeURIComponent(semesterId)}`
          : "";
        const res = await api.get<AllocationSummaryType>(
          `/allocation/allocation/getAll${query}`,
        );

        return res.data;
      } catch (error) {
        toast.error("Failed to fetch courses");
        throw error;
      }
    },
  });

  const computedCreditLoadMap = useMemo(() => {
    if (!showTeachingLoad || !allocationData)
      return {} as Record<string, number>;
    const creditLoadMapTemp: Record<string, number> = {};
    allocationData.forEach((alloc) => {
      alloc.sections.forEach((section) => {
        section.instructors.forEach((instr) => {
          if (!creditLoadMapTemp[instr.email])
            creditLoadMapTemp[instr.email] = 0;
          creditLoadMapTemp[instr.email] +=
            (section.type === "LECTURE"
              ? alloc.course.lectureUnits
              : section.type === "PRACTICAL"
                ? alloc.course.practicalUnits
                : 1) /
            section.instructors.filter((instr) => instr.type === "faculty")
              .length;
        });
      });
    });
    return creditLoadMapTemp;
  }, [showTeachingLoad, allocationData]);

  const computedFacultyData = useMemo(() => {
    if (viewMode !== "faculty" || !allocationData) return [];
    const facultyMap: Record<
      string,
      {
        faculty: { name: string; email: string };
        allocations: {
          courseCode: string;
          courseName: string | null;
          sectionType: (typeof sectionTypes)[number];
          sectionId: string;
          sectionNumber: number;
        }[];
      }
    > = {};

    allocationData.forEach((courseAllocation) => {
      courseAllocation.sections.forEach((section) => {
        section.instructors.forEach((instructor) => {
          if (instructor.type !== "faculty") return;

          if (!facultyMap[instructor.email]) {
            facultyMap[instructor.email] = {
              faculty: {
                name: instructor.name ?? `Unnamed - ${instructor.email}`,
                email: instructor.email,
              },
              allocations: [],
            };
          }

          facultyMap[instructor.email].allocations.push({
            courseCode: courseAllocation.courseCode,
            courseName: courseAllocation.course.name,
            sectionType: section.type,
            sectionId: section.id,
            sectionNumber: getSectionNumber(
              courseAllocation,
              section.id,
              section.type,
            ),
          });
        });
      });
    });

    return Object.values(facultyMap).sort((a, b) =>
      a.faculty.name.localeCompare(b.faculty.name),
    );
  }, [viewMode, allocationData]);

  return isLoadingAllocation || !latestSemester || !allocationData ? (
    <Skeleton className="m-10 h-[80vh] w-full" />
  ) : (
    <div className="allocationSummary gap-y-2 px-2 py-5">
      <AssignInstructorDialog
        isOpen={isAssignInstructorDialogOpen}
        onOpenChange={(open) => {
          setIsAssignInstructorDialogOpen(open);
          if (!open) setSelectedInstructorEmail(null);
        }}
        courseCode={null}
        selectedSectionId=""
        allocationData={null}
        onAssignInstructor={async () => {}}
        isAssigning={false}
        userTypeViewMode="faculty"
        viewModeInstructorEmail={selectedInstructorEmail}
      />
      <div className="sticky left-0 top-0 z-10 flex flex-col items-center bg-background py-2">
        <h1 className="text-3xl font-bold text-primary">Allocation Summary</h1>
        {checkAccess("allocation:write") && (
          <Button
            variant="link"
            onClick={() => toggleSummaryAccessMutation.mutate()}
          >
            {latestSemester.summaryHidden ? "Allow" : "Revoke"} Access To All
          </Button>
        )}
        <div className="flex w-full justify-between px-20 text-lg">
          <div>
            <span>Semester:</span>{" "}
            <span>{semesterTypeMap[latestSemester.semesterType]}</span>
          </div>
          <div>
            <span>Academic Year:</span>{" "}
            <span>{getFormattedAY(latestSemester.year)}</span>
          </div>
        </div>
        {checkAccess("allocation:write") && (
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showTeachingLoad}
                onChange={(e) => setShowTeachingLoad(e.target.checked)}
                className="h-4 w-4"
              />
              <span>Show Teaching Load</span>
            </label>
            <div className="flex items-center gap-2 text-sm">
              <Button
                variant={viewMode === "course" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("course")}
              >
                Course View
              </Button>
              <Button
                variant={viewMode === "faculty" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("faculty")}
              >
                Faculty View
              </Button>
            </div>
          </div>
        )}
      </div>
      <div>
        {viewMode === "course" &&
          allocationData.map((data) => (
            <Card key={data.id} className="w-full overflow-hidden rounded-none">
              <CardContent className="p-0">
                <div className="grid grid-cols-[500px_1fr] border-b">
                  <div className="row-span-full flex items-center border-r p-4">
                    <div className="w-full">
                      <Link
                        to={`/allocation/allocate?course=${data.courseCode.replace(" ", "+")}`}
                        className="block w-full"
                      >
                        <Button
                          variant="link"
                          className="block w-full text-lg font-semibold"
                        >
                          <span className="block w-full truncate">
                            {data.courseCode} -{" "}
                            {data.course.name ?? "Unnamed Course"}
                          </span>
                        </Button>
                      </Link>
                    </div>
                  </div>

                  <div className="divide-y">
                    {data.sections.map((section) => (
                      <div
                        key={section.id}
                        className="grid grid-cols-[120px_1fr]"
                      >
                        <div className="row-span-full flex items-center justify-center border-b border-r p-2">
                          <p className="text-sm font-medium">
                            {section.type.charAt(0)}
                            {getSectionNumber(data, section.id, section.type)}
                            {section.type === "PRACTICAL" &&
                              section.timetableRoomId &&
                              ` - ${section.timetableRoomId}`}
                          </p>
                        </div>

                        <div className="flex flex-col">
                          {section.instructors.length ? (
                            section.instructors.map((inst, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between border-b px-3 py-2 text-sm"
                              >
                                <span
                                  className={
                                    data.ic?.email === inst.email
                                      ? "font-semibold text-secondary"
                                      : ""
                                  }
                                >
                                  {inst.name &&
                                  inst.type === "faculty" &&
                                  checkAccess("allocation:write") ? (
                                    <Button
                                      onClick={() => {
                                        setSelectedInstructorEmail(inst.email);
                                        setIsAssignInstructorDialogOpen(true);
                                      }}
                                      variant="link"
                                      className={`m-0 h-fit p-0 ${
                                        data.ic?.email === inst.email
                                          ? "font-semibold text-primary"
                                          : ""
                                      }`}
                                    >
                                      {inst.name}
                                    </Button>
                                  ) : (
                                    inst.name ??
                                    `Unnamed Instructor - ${inst.email}`
                                  )}
                                  {showTeachingLoad && (
                                    <span>
                                      {" "}
                                      -{" "}
                                      {computedCreditLoadMap[inst.email] ?? 0}{" "}
                                      Credits
                                    </span>
                                  )}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="flex items-center justify-between border-b px-3 py-2 text-sm">
                              <span className="font-bold">TBA</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

        {viewMode === "faculty" &&
          computedFacultyData.map((facultyAllocation) => (
            <Card
              key={facultyAllocation.faculty.email}
              className="w-full overflow-hidden rounded-none"
            >
              <CardContent className="p-0">
                <div className="grid grid-cols-[500px_1fr] border-b">
                  <div className="row-span-full flex items-center border-r p-4">
                    <div className="w-full">
                      <Button
                        variant="link"
                        className="block w-full text-lg font-semibold"
                        onClick={() => {
                          setSelectedInstructorEmail(
                            facultyAllocation.faculty.email,
                          );
                          setIsAssignInstructorDialogOpen(true);
                        }}
                      >
                        <span className="block w-full truncate">
                          {facultyAllocation.faculty.name}
                        </span>
                      </Button>
                      {showTeachingLoad && (
                        <p className="text-center text-sm text-muted-foreground">
                          Total Load:{" "}
                          {computedCreditLoadMap[
                            facultyAllocation.faculty.email
                          ] ?? 0}{" "}
                          Credits
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="divide-y">
                    {facultyAllocation.allocations.length > 0 ? (
                      facultyAllocation.allocations.map((alloc, idx) => (
                        <div
                          key={`${alloc.sectionId}-${idx}`}
                          className="flex items-center px-3 py-2"
                        >
                          <Link
                            to={`/allocation/allocate?course=${alloc.courseCode.replace(" ", "+")}`}
                            className="block w-full"
                          >
                            <Button
                              variant="link"
                              className="m-0 block h-fit w-full justify-start p-0 text-left text-sm"
                            >
                              <span className="block w-full truncate">
                                {alloc.courseCode} -{" "}
                                {alloc.courseName ?? "Unnamed Course"} -{" "}
                                {alloc.sectionType.charAt(0)}
                                {alloc.sectionNumber}
                              </span>
                            </Button>
                          </Link>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center px-3 py-2 text-sm">
                        <span>No allocations found.</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
};