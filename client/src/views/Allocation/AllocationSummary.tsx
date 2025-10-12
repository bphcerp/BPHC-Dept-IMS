import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/axios-instance";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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

export const AllocationSummary = () => {

  const [showTeachingLoad, setShowTeachingLoad] = useState(false)

  const [searchParams] = useSearchParams();
  const semesterId = searchParams.get("semesterId");

  const { checkAccess } = useAuth();

  const { data: allocationData, isLoading: isLoadingAllocation } = useQuery({
    queryKey: [`allocation`, "summary", semesterId ?? "latest"],
    queryFn: async () => {
      try {
        const query = semesterId ? `?semesterId=${encodeURIComponent(semesterId)}` : "";
        const res = await api.get<AllocationSummaryType>(
          `/allocation/allocation/getAll${query}`
        );

        return res.data;
      } catch (error) {
        toast.error("Failed to fetch courses");
        throw error;
      }
    },
  });

  const { data: latestSemester } = useQuery({
    queryKey: ["allocation", "semester", "latest"],
    queryFn: () =>
      api
        .get<SemesterMinimal>("/allocation/semester/getLatest?minimal=true")
        .then(({ data }) => data),
  });

  const getSectionNumber = (
    courseAllocation: AllocationSummaryType[number],
    sectionId: string,
    sectionType: (typeof sectionTypes)[number]
  ) =>
    courseAllocation.sections
      .filter((section) => section.type === sectionType)
      .findIndex((section) => section.id === sectionId) + 1;

  const computedCreditLoadMap = useMemo(() => {
    if (!showTeachingLoad || !allocationData) return {} as Record<string, number>;
    const creditLoadMapTemp: Record<string, number> = {};
    allocationData.forEach((alloc) => {
      alloc.sections.forEach((section) => {
        section.instructors.forEach((instr) => {
          if (!creditLoadMapTemp[instr.email]) creditLoadMapTemp[instr.email] = 0;
          creditLoadMapTemp[instr.email] +=
            (section.type === "LECTURE"
              ? alloc.course.lectureUnits
              : section.type === "PRACTICAL"
              ? alloc.course.practicalUnits
              : 1) / section.instructors.length;
        });
      });
    });
    return creditLoadMapTemp;
  }, [showTeachingLoad, allocationData]);

  return isLoadingAllocation || !latestSemester || !allocationData ? (
    <Skeleton className="m-10 h-[80vh] w-full" />
  ) : (
    <div className="allocationSummary gap-y-2 py-5 px-2">
      <div className="flex flex-col items-center sticky top-0 left-0 py-2 z-10 bg-background">
        <h1 className="text-3xl font-bold text-primary">Allocation Summary</h1>
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
          <div className="mt-4">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showTeachingLoad}
                onChange={(e) => setShowTeachingLoad(e.target.checked)}
                className="h-4 w-4"
              />
              <span>Show Teaching Load</span>
            </label>
          </div>
        )}
      </div>
      <div>
        {allocationData.map((data) => (
          <Card className="w-full overflow-hidden rounded-none">
            <CardContent className="p-0">
              <div className="grid grid-cols-[500px_1fr] border-b">
                {/* Left Side (Course Info) */}
                <div className="row-span-full flex items-center justify-center border-r p-4">
                  <div className="text-center">
                    <Link
                      to={`/allocation/allocate?course=${data.courseCode.replace(" ", "+")}`}
                    >
                      <Button variant="link" className="text-lg font-semibold">
                        {data.course.name ?? "Unnamed Course"}
                      </Button>
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {data.courseCode}
                    </p>
                  </div>
                </div>

                {/* Right Side (Sections & Instructors) */}
                <div className="divide-y">
                  {data.sections.map((section) => (
                    <div key={section.id} className="grid grid-cols-[40px_1fr]">
                      {/* Section Name (like L1, T1, etc.) */}
                      <div className="row-span-full flex items-center justify-center border-b border-r p-2">
                        <p className="text-sm font-medium">
                          {section.type.charAt(0)}
                          {getSectionNumber(data, section.id, section.type)}
                        </p>
                      </div>

                      {/* Instructors List */}
                      <div className="flex flex-col">
                        {section.instructors.length ? (
                          section.instructors.map((inst, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between border-b px-3 py-2 text-sm"
                            >
                              <span>
                                {inst.name ?? "Unnamed Instructor"}
                                {showTeachingLoad && (
                                  <span> - {computedCreditLoadMap[inst.email] ?? 0} Credits</span>
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
      </div>
    </div>
  );
};
