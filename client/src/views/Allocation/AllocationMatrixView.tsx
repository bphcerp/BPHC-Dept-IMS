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
import { Link, useSearchParams } from "react-router-dom";
import { useMemo, useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Faculty } from "node_modules/lib/src/types/inventory";

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

function getCreditLoadForInstructor(
  alloc: AllocationSummaryType[number],
  sectionType: string,
  instructorEmail: string
) {
  const sections = alloc.sections.filter((s) => s.type === sectionType);
  let total = 0;
  sections.forEach((section) => {
    if (section.instructors.some((inst) => inst.email === instructorEmail)) {
      const units =
        sectionType === "LECTURE"
          ? alloc.course.lectureUnits
          : sectionType === "PRACTICAL"
            ? alloc.course.practicalUnits
            : 1;
      total +=
        units /
        section.instructors.filter((instr) => instr.type === "faculty").length;
    }
  });
  return total > 0 ? total : null;
}

function getSectionCounts(
  alloc: AllocationSummaryType[number],
  sectionType: string
) {
  const sections = alloc.sections.filter((s) => s.type === sectionType);
  let allocated = 0;
  let pending = 0;
  sections.forEach((s) => {
    if (s.instructors.length && ( s.type === 'PRACTICAL' ? !!s.timetableRoomId : true )) allocated++;
    else pending++;
  });
  return { allocated, pending, total: allocated + pending };
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

  const { data: instructors } = useQuery({
    queryKey: ["faculty"],
    queryFn: async () => {
      const res = await api.get<Faculty[]>("/admin/member/getAllFaculty");
      return res.data.sort((a, b) =>
        a.psrn && b.psrn ? a.psrn.localeCompare(b.psrn) : 0
      );
    },
  });

  const { data: latestSemester } = useQuery({
    queryKey: ["semester", "latest"],
    queryFn: () =>
      api
        .get<SemesterMinimal>("/allocation/semester/getLatest?minimal=true")
        .then(({ data }) => data),
  });

  const matrix = useMemo(() => {
    if (!allocationData || !instructors) return null;
    const rows = getCourseSectionRows(allocationData);
    const dataRows = rows.map((row) => {
      const alloc = allocationData.find((a) => a.courseCode === row.courseCode);
      const counts = alloc
        ? getSectionCounts(alloc, row.sectionType)
        : { allocated: 0, pending: 0, total: 0 };
      return {
        ...row,
        counts,
        values: instructors.map((inst) => {
          const val = alloc
            ? getCreditLoadForInstructor(alloc, row.sectionType, inst.email)
            : null;
          return val !== null ? val : "NA";
        }),
      };
    });
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
  }, [allocationData, instructors]);

  const [highlightedRow, setHighlightedRow] = useState<string | null>(null);
  const [highlightedInstructor, setHighlightedInstructor] = useState<
    string | null
  >(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setHighlightedRow(null);
        setHighlightedInstructor(null);
      }
    }
    document.addEventListener("click", handleDocClick);
    return () => document.removeEventListener("click", handleDocClick);
  }, []);

  if (isLoadingAllocation || !latestSemester || !allocationData || !matrix) {
    return <Skeleton className="m-10 h-[80vh] w-full" />;
  }

  const visibleInstructors = highlightedRow
    ? matrix.instructors.filter((_, idx) => {
        const row = matrix.dataRows.find((r) => r.key === highlightedRow);
        if (!row) return true;
        return row.values[idx] !== "NA";
      })
    : matrix.instructors;

  const visibleRows = highlightedInstructor
    ? matrix.dataRows.filter((r) => {
        const instIdx = matrix.instructors.findIndex(
          (i) => i.email === highlightedInstructor
        );
        if (instIdx === -1) return true;
        return r.values[instIdx] !== "NA";
      })
    : matrix.dataRows;

  const visibleInstructorEmails = highlightedRow
    ? visibleInstructors.map((i) => i.email)
    : highlightedInstructor
      ? matrix.instructors
          .filter((i) => i.email === highlightedInstructor)
          .map((i) => i.email)
      : matrix.instructors.map((i) => i.email);

  function onCourseCellClick(key: string) {
    setHighlightedInstructor(null);
    setHighlightedRow((prev) => (prev === key ? null : key));
  }

  function onInstructorHeaderClick(email: string) {
    setHighlightedRow(null);
    setHighlightedInstructor((prev) => (prev === email ? null : email));
  }

  function resetHighlights() {
    setHighlightedRow(null);
    setHighlightedInstructor(null);
  }

  return (
    <div ref={containerRef} className="allocationMatrixView px-2 py-5">
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
        {(highlightedRow || highlightedInstructor) && (
          <div className="mt-3">
            <Button onClick={resetHighlights}>Reset Highlighting</Button>
          </div>
        )}
      </div>

      <div className="mt-4">
        <table
          className="min-w-full border text-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <thead className="sticky left-0 top-0 z-10">
            <tr className="bg-muted">
              <th className="border px-4 py-2 font-bold">Course-Section</th>
              <th className="border bg-red-100 px-4 py-2 font-bold text-red-700">
                Pending
              </th>
              <th className="border bg-green-100 px-4 py-2 font-bold text-green-700">
                Allocated
              </th>
              <th className="border bg-blue-100 px-4 py-2 font-bold text-blue-700">
                Total
              </th>
              {matrix.instructors
                .filter((inst) => {
                  if (highlightedRow) {
                    const row = matrix.dataRows.find(
                      (r) => r.key === highlightedRow
                    );
                    if (!row) return true;
                    return (
                      row.values[matrix.instructors.indexOf(inst)] !== "NA"
                    );
                  }
                  return highlightedInstructor
                    ? inst.email === highlightedInstructor
                    : true;
                })
                .map((inst) => {
                  const isActive = highlightedInstructor === inst.email;
                  return (
                    <th
                      key={inst.email}
                      onClick={() => onInstructorHeaderClick(inst.email)}
                      className={`cursor-pointer select-none border px-4 py-2 font-bold ${
                        isActive ? "bg-amber-100 text-amber-800" : ""
                      }`}
                    >
                      <div className="whitespace-nowrap">
                        {inst.name ?? inst.email}
                      </div>
                    </th>
                  );
                })}
            </tr>

            <tr className="bg-secondary font-bold">
              <td className="border px-4 py-2">Total</td>
              <td className="border bg-red-100 px-4 py-2 text-center text-red-700">
                —
              </td>
              <td className="border bg-green-100 px-4 py-2 text-center text-green-700">
                —
              </td>
              <td className="border bg-blue-100 px-4 py-2 text-center text-blue-700">
                —
              </td>
              {matrix.totals
                .map((total, idx) => ({
                  total,
                  email: matrix.instructors[idx].email,
                }))
                .filter((t) => visibleInstructorEmails.includes(t.email))
                .map((t, idx) => (
                  <td key={idx} className="border px-4 py-2 text-center">
                    {t.total}
                  </td>
                ))}
            </tr>
          </thead>

          <tbody>
            {visibleRows.map((row) => {
              const rowActive = highlightedRow === row.key;
              return (
                <tr key={row.key} className={rowActive ? "bg-amber-50" : ""}>
                  <td
                    onClick={() => onCourseCellClick(row.key)}
                    className="cursor-pointer border px-4 py-2 font-semibold"
                  >
                    <div className="p-1">
                      <span className="text-wrap">
                        {row.courseCode} - {row.courseName} -{" "}
                        {row.sectionType.charAt(0)}
                      </span>
                      {" - "}
                      <Button variant="link" className="m-0 h-fit p-0">
                        <Link
                          to={`/allocation/allocate?course=${encodeURIComponent(
                            row.courseCode
                          )}`}
                          onClick={(e) => e.stopPropagation()}
                          className="block py-1"
                        >
                          View
                        </Link>
                      </Button>
                    </div>
                  </td>

                  <td className="border bg-red-50 px-4 py-2 text-center font-semibold text-red-700">
                    {row.counts.pending}
                  </td>
                  <td className="border bg-green-50 px-4 py-2 text-center font-semibold text-green-700">
                    {row.counts.allocated}
                  </td>
                  <td className="border bg-blue-50 px-4 py-2 text-center font-semibold text-blue-700">
                    {row.counts.total}
                  </td>

                  {matrix.instructors
                    .map((inst) => inst.email)
                    .filter((email) => visibleInstructorEmails.includes(email))
                    .map((email) => {
                      const instIdx = matrix.instructors.findIndex(
                        (i) => i.email === email
                      );
                      const val = row.values[instIdx];
                      const colActive = highlightedInstructor === email;
                      const showVal = val === "NA" ? "NA" : val;
                      return (
                        <td
                          key={email}
                          className={`border px-4 py-2 text-center ${
                            showVal === "NA" ? "text-muted" : "font-semibold"
                          } ${rowActive || colActive ? "bg-amber-50" : ""}`}
                        >
                          {showVal}
                        </td>
                      );
                    })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
