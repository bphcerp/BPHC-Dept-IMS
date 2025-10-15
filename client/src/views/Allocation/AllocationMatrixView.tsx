import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import {
  AllocationSummaryType,
  SemesterMinimal,
  semesterTypeMap,
} from "../../../../lib/src/types/allocation";
import { allocationSchemas } from "lib";
import { Skeleton } from "@/components/ui/skeleton";
import { getFormattedAY } from "./AllocationOverview";
import { useSearchParams } from "react-router-dom";
import { useMemo } from "react";

// Helper to get all unique instructors
function getUniqueInstructors(allocationData: AllocationSummaryType) {
  const instructorMap: Record<string, { email: string; name: string | null }> =
    {};
  allocationData.forEach((alloc) => {
    alloc.sections.forEach((section) => {
      section.instructors
        .filter((inst) => inst.type === "faculty")
        .forEach((inst) => {
          instructorMap[inst.email] = { email: inst.email, name: inst.name };
        });
    });
  });
  return Object.values(instructorMap);
}

// Helper to get all unique course-section types
function getCourseSectionRows(allocationData: AllocationSummaryType) {
  const rows: {
    key: string;
    courseCode: string;
    courseName: string;
    sectionType: string;
  }[] = [];
  allocationData.forEach((alloc) => {
    allocationSchemas.sectionTypes.forEach((stype) => {
      if (alloc.sections.some((s) => s.type === stype)) {
        rows.push({
          key: `${alloc.courseCode}-${stype}`,
          courseCode: alloc.courseCode,
          courseName: alloc.course.name ?? "Unnamed Course",
          sectionType: stype,
        });
      }
    });
  });
  return rows;
}

// Helper to compute credit load for instructor for a course-section type
function getCreditLoadForInstructor(
  alloc: AllocationSummaryType[number],
  sectionType: string,
  instructorEmail: string
) {
  const sections = alloc.sections.filter((s) => s.type === sectionType);
  let total = 0;
  sections.forEach((section) => {
    if (section.instructors.some((inst) => inst.email === instructorEmail)) {
      // Divide units by number of instructors for fairness
      const units =
        sectionType === "LECTURE"
          ? alloc.course.lectureUnits
          : sectionType === "PRACTICAL"
            ? alloc.course.practicalUnits
            : 1;
      total += units / section.instructors.filter((instr) => instr.type === 'faculty').length;
    }
  });
  return total > 0 ? total : null;
}

export const AllocationMatrixView = () => {
  const [searchParams] = useSearchParams();
  const semesterId = searchParams.get("semesterId");

  const { data: allocationData, isLoading: isLoadingAllocation } = useQuery({
    queryKey: ["allocation", "summary", semesterId ?? "latest"],
    queryFn: async () => {
      const query = semesterId
        ? `?semesterId=${encodeURIComponent(semesterId)}`
        : "";
      const res = await api.get<AllocationSummaryType>(
        `/allocation/allocation/getAll${query}`
      );
      return res.data;
    },
  });

  const { data: latestSemester } = useQuery({
    queryKey: ["allocation", "semester", "latest"],
    queryFn: () =>
      api
        .get<SemesterMinimal>("/allocation/semester/getLatest?minimal=true")
        .then(({ data }) => data),
  });

  // Memoize matrix data
  const matrix = useMemo(() => {
    if (!allocationData) return null;
    const instructors = getUniqueInstructors(allocationData);
    const rows = getCourseSectionRows(allocationData);
    // Build matrix: rows x columns
    const dataRows = rows.map((row) => {
      const alloc = allocationData.find((a) => a.courseCode === row.courseCode);
      return {
        ...row,
        values: instructors.map((inst) => {
          const val = alloc
            ? getCreditLoadForInstructor(alloc, row.sectionType, inst.email)
            : null;
          return val !== null ? val : "NA";
        }),
      };
    });
    // Totals row
    const totals = instructors.map((inst) => {
      let sum = 0;
      allocationData.forEach((alloc) => {
        allocationSchemas.sectionTypes.forEach((stype) => {
          const val = getCreditLoadForInstructor(alloc, stype, inst.email);
          if (val) sum += val;
        });
      });
      return sum > 0 ? sum : "NA";
    });
    return { instructors, dataRows, totals };
  }, [allocationData]);

  if (isLoadingAllocation || !latestSemester || !allocationData || !matrix) {
    return <Skeleton className="m-10 h-[80vh] w-full" />;
  }

  return (
    <div className="allocationMatrixView px-2 py-5">
      <div className="flex flex-col items-center bg-background">
        <h1 className="text-3xl font-bold text-primary">
          Allocation Matrix View
        </h1>
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
      </div>
      <table className="min-w-full border text-sm">
        <thead className="sticky -top-1 left-0 z-10">
          <tr className="bg-muted">
            <th className="border px-4 py-2 font-bold">Course-Section</th>
            {matrix.instructors.map((inst) => (
              <th key={inst.email} className="border px-4 py-2 font-bold">
                {inst.name ?? inst.email}
              </th>
            ))}
          </tr>
          <tr className="bg-secondary font-bold">
            <td className="border px-4 py-2">Total</td>
            {matrix.totals.map((total, idx) => (
              <td key={idx} className="border px-4 py-2 text-center">
                {total}
              </td>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.dataRows.map((row) => (
            <tr key={row.key}>
              <td className="border px-4 py-2 font-semibold">
                {row.courseCode} - {row.courseName} -{" "}
                {row.sectionType.charAt(0)}
              </td>
              {row.values.map((val, idx) => (
                <td
                  key={idx}
                  className={`border px-4 py-2 text-center ${val === "NA" ? "text-muted" : "font-semibold"}`}
                >
                  {val}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
