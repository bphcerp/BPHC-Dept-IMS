"use client";

import { useEffect, useMemo, useReducer, useState, useCallback } from "react";
import api from "@/lib/axios-instance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { BASE_API_URL } from "@/lib/constants";
import type { AxiosError } from "axios";

function getErrorMessage(err: unknown): string | undefined {
  const e = err as Partial<AxiosError<{ message?: string }>> | undefined;
  return e?.response?.data?.message || e?.message || undefined;
}

interface StudentRow {
  email: string;
  name: string | null;
  erpId: string | null;
  idNumber: string | null;
  campusId?: string | null;
}

interface GradeRow {
  id: number;
  studentErpId: string;
  campusId?: string | null;
  studentName?: string | null;
  instructorSupervisorEmail: string;
  courseName: string;
  role: "instructor" | "supervisor";
  phase?: "draft" | "midsem" | "endsem";
  midsemGrade?: string | null;
  compreGrade?: string | null;
  midsemMarks?: number | null;
  endsemMarks?: number | null;
  topic?: string | null;
  midsemDocFileId?: number | null;
  endsemDocFileId?: number | null;
}

interface InstructorAssignment {
  studentErpId: string;
  courseName: string;
  instructorEmail: string;
  instructorName: string;
  phase?: string;
}

interface ColumnHeader {
  name: string;
  type: "text" | "number" | "grade" | "select" | "serial";
}
type ExcelSheetInfo = {
  sheetName: string;
  erpHeader: string | null;
  erpIds: string[];
  columnHeaders: ColumnHeader[];
  erpToRow: Record<string, Record<string, unknown>>;
  gradeOptionsByHeader: Record<string, string[]>;
};

const DEFAULT_GRADE_TABS = [
  "phd seminar",
  "phd thesis",
  "practice lecture series 1",
];
const DEFAULT_GRADE_OPTIONS = [
  "A+",
  "A",
  "A-",
  "B+",
  "B",
  "B-",
  "C",
  "D",
  "E",
  "F",
  "I",
];

const isPlaceholderHeader = (name: string): boolean => {
  const n = String(name || "").trim();
  if (!n) return true;
  if (/^unnamed[:_\-\s]*\d*$/i.test(n)) return true;
  if (/^(?:col(?:umn)?)\s*[_ ]?\d+$/i.test(n)) return true;
  return false;
};

const isSpuriousGradeOptionHeader = (name: string): boolean => {
  const n = String(name || "")
    .trim()
    .toLowerCase();
  if (!n) return false;
  const options = [
    "good",
    "poor",
    "satisfactory",
    "unsatisfactory",
    "above average",
    "average",
    "below average",
  ];
  return options.includes(n);
};

export default function AssignGradesView() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [grades, setGrades] = useState<Record<string, GradeRow>>({});
  const [sheets, setSheets] = useState<ExcelSheetInfo[]>([]);
  const [activeCourse, setActiveCourse] = useState<string>(
    DEFAULT_GRADE_TABS[0]
  );
  const [isSaving, setIsSaving] = useState(false);
  const [, setGlobalGradeOptions] = useState<string[]>(DEFAULT_GRADE_OPTIONS);
  const [, forceRerender] = useReducer((x: number) => x + 1, 0);

  const [userRoles, setUserRoles] = useState<{
    instructor: boolean;
    supervisor: boolean;
  }>({ instructor: false, supervisor: false });
  const [instructorAssignments, setInstructorAssignments] = useState<
    InstructorAssignment[]
  >([]);
  const coursePhase = useMemo<"draft" | "midsem" | "endsem">(() => {
    if (!activeCourse) return "draft";
    const gradeForCourse = Object.values(grades).find(
      (g) => g.courseName === activeCourse && g.role === "instructor"
    );
    return gradeForCourse?.phase ?? "draft";
  }, [activeCourse, grades]);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      try {
        const allStudents: StudentRow[] = [];
        const allGrades: Record<string, GradeRow> = {};
        const allCourses: string[] = [];
        let hasInstructorRole = false;
        let hasSupervisorRole = false;

        // Load Excel data for supervisor courses
        try {
          const saved = localStorage.getItem("grades:lastExcelData");
          const savedOpts = localStorage.getItem("grades:lastGradeOptions");
          if (savedOpts) {
            try {
              const parsedOpts = JSON.parse(savedOpts) as unknown as string[];
              if (Array.isArray(parsedOpts) && parsedOpts.length > 0) {
                setGlobalGradeOptions(parsedOpts);
              }
            } catch (e) {
              console.warn("Failed parsing saved grade options", e);
            }
          }
          if (saved) {
            const parsed = JSON.parse(saved) as {
              sheets: {
                sheetName: string;
                columnHeaders: ColumnHeader[];
                studentData: Array<Record<string, unknown>>;
              }[];
            };
            const candidates = [
              "ERP ID",
              "ERP",
              "EMPLID",
              "Campus ID",
              "ID",
              "Reg No",
              "Registration",
            ];
            const excelSheets: ExcelSheetInfo[] = parsed.sheets.map((sheet) => {
              const headerIndex = sheet.columnHeaders.findIndex((h) =>
                candidates.some((c) =>
                  h.name.toLowerCase().includes(c.toLowerCase())
                )
              );
              const erpHeader =
                headerIndex >= 0 ? sheet.columnHeaders[headerIndex].name : null;
              const ids = new Set<string>();
              const erpToRow: Record<string, Record<string, unknown>> = {};
              if (erpHeader) {
                sheet.studentData.forEach((row) => {
                  const v = row[erpHeader];
                  const idStr =
                    typeof v === "string" || typeof v === "number"
                      ? String(v).trim()
                      : "";
                  if (idStr !== "") {
                    ids.add(idStr);
                    erpToRow[idStr] = row;
                  }
                });
              }
              const filteredHeaders = sheet.columnHeaders.filter(
                (h) =>
                  !isPlaceholderHeader(h.name) &&
                  !isSpuriousGradeOptionHeader(h.name)
              );

              const gradeOptionsByHeader: Record<string, string[]> = {};
              filteredHeaders
                .filter((h) => h.type === "grade")
                .forEach((h) => {
                  const opts = new Set<string>();
                  sheet.studentData.forEach((row) => {
                    const val = row[h.name];
                    if (
                      val !== undefined &&
                      val !== null &&
                      (typeof val === "string" || typeof val === "number")
                    ) {
                      const s = String(val).trim();
                      if (
                        s &&
                        s.length <= 10 &&
                        !/grade|marks|name|serial|id|s\.no|emplid|campus/i.test(
                          s
                        )
                      ) {
                        opts.add(s);
                      }
                    }
                  });
                  const derived = Array.from(opts).sort((a, b) =>
                    a.localeCompare(b)
                  );
                  gradeOptionsByHeader[h.name] =
                    derived.length > 0 ? derived : [];
                });
              return {
                sheetName: sheet.sheetName,
                erpHeader,
                erpIds: Array.from(ids),
                columnHeaders: filteredHeaders,
                erpToRow,
                gradeOptionsByHeader,
              };
            });
            if (isMounted && excelSheets.length > 0) {
              setSheets(excelSheets);
              try {
                const updatedData = {
                  ...parsed,
                  sheets: parsed.sheets.map((sheet) => ({
                    ...sheet,
                    columnHeaders: sheet.columnHeaders.filter(
                      (h) =>
                        !isPlaceholderHeader(h.name) &&
                        !isSpuriousGradeOptionHeader(h.name)
                    ),
                  })),
                };
                localStorage.setItem(
                  "grades:lastExcelData",
                  JSON.stringify(updatedData)
                );
              } catch (e) {
                console.warn("Failed to persist filtered excel data", e);
              }
            }
          }
        } catch (e) {
          console.warn("Failed to load local excel data", e);
        }

        // Load unified data (both supervisor and instructor students)
        const res = await api.get<{
          data: {
            students: StudentRow[];
            grades: GradeRow[];
            targetCourses: string[];
            courses: string[];
            instructorAssignments: InstructorAssignment[];
          };
        }>(`/grades/supervisor`);
        const data = res.data.data;

        // Add all students and grades
        allStudents.push(...data.students);
        data.grades.forEach((g) => {
          allGrades[`${g.studentErpId}::${g.courseName}`] = g;
        });

        if (data.courses?.length) {
          allCourses.push(...data.courses);
        }

        // Determine user roles based on data
        hasSupervisorRole = data.students.some((s) => s.email); // If we have supervisor students
        hasInstructorRole = data.instructorAssignments?.length > 0; // If we have instructor assignments

        // Set all data
        if (!isMounted) return;

        setStudents(allStudents);
        setGrades(allGrades);
        setUserRoles({
          instructor: hasInstructorRole,
          supervisor: hasSupervisorRole,
        });
        setInstructorAssignments(data.instructorAssignments || []);

        // Determine courses to show - combine Excel courses and instructor-assigned courses
        const instructorCourses = [
          ...new Set(
            (data.instructorAssignments || []).map(
              (ia: InstructorAssignment) => ia.courseName
            )
          ),
        ];
        const allAvailableCourses = [
          ...new Set([...allCourses, ...instructorCourses]),
        ];

        if (allAvailableCourses.length > 0) {
          setActiveCourse(allAvailableCourses[0]);
        }
      } catch (e: unknown) {
        const msg = getErrorMessage(e);
        toast.error(msg || "Failed to load students");
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (sheets.length && !sheets.find((s) => s.sheetName === activeCourse)) {
      setActiveCourse(sheets[0].sheetName);
    }
  }, [sheets, activeCourse]);

  const rows = useMemo<
    Array<{
      email: string;
      name: string | null;
      erpId: string | null;
      campusId: string | null;
      excelRow: Record<string, unknown>;
      midsemGrade: string;
      compreGrade: string;
      midsemMarks: number | null;
      endsemMarks: number | null;
      topic: string | null;
      midsemDocFileId: number | null;
      endsemDocFileId: number | null;
      role: "instructor" | "supervisor";
    }>
  >(() => {
    const activeSheet = sheets.find((s) => s.sheetName === activeCourse);
    const allowedErp = activeSheet?.erpIds ?? null;

    const filteredStudents = students.filter((s) => {
      // Check if this student is assigned as instructor for the current course
      const isInstructorAssigned = instructorAssignments.some(
        (ia: InstructorAssignment) =>
          ia.studentErpId === s.erpId && ia.courseName === activeCourse
      );

      // Check if this student is assigned as instructor for ANY course
      const isInstructorAssignedAnywhere = instructorAssignments.some(
        (ia: InstructorAssignment) => ia.studentErpId === s.erpId
      );

      // If student is instructor-assigned for THIS course, show them
      if (isInstructorAssigned) {
        return true;
      }

      // If student is instructor-assigned ANYWHERE, don't show them in supervisor courses
      if (isInstructorAssignedAnywhere) {
        return false;
      }

      // For supervisor students, filter by Excel sheet ERP IDs
      if (allowedErp && allowedErp.length > 0) {
        const isInSheet = s.erpId && allowedErp.includes(String(s.erpId));
        return isInSheet;
      }

      // If no Excel sheet restrictions, show all students (for supervisor role)
      return true;
    });

    return filteredStudents
      .map((s) => {
        const gradeKey = `${s.erpId}::${activeCourse}`;
        const g = grades[gradeKey];
        const excelRow: Record<string, unknown> =
          s.erpId && activeSheet?.erpToRow[s.erpId]
            ? activeSheet.erpToRow[s.erpId]
            : {};

        // Determine role based on the grade record
        let role: "instructor" | "supervisor" = "supervisor";

        if (g) {
          role = g.role;
        } else {
          // If no grade record exists, check if this student is assigned as instructor
          const instructorAssignment = instructorAssignments.find(
            (ia: InstructorAssignment) =>
              ia.studentErpId === s.erpId && ia.courseName === activeCourse
          );
          if (instructorAssignment) {
            role = "instructor";
          }
        }

        return {
          ...s,
          campusId: s.campusId || null,
          excelRow,
          midsemGrade: g?.midsemGrade ?? "",
          compreGrade: g?.compreGrade ?? "",
          midsemMarks: g?.midsemMarks ?? null,
          endsemMarks: g?.endsemMarks ?? null,
          topic: g?.topic ?? null,
          midsemDocFileId: g?.midsemDocFileId ?? null,
          endsemDocFileId: g?.endsemDocFileId ?? null,
          role,
        };
      })
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
  }, [students, grades, activeCourse, sheets, instructorAssignments]);

  const getFixedGradeOptionsForSheet = (sheetName: string): string[] | null => {
    const n = sheetName.toLowerCase();
    const hasAll = (words: string[]) => words.every((w) => n.includes(w));
    if (hasAll(["independent", "thesis"])) return ["Good"];
    if (hasAll(["phd"]) && n.includes("thesis"))
      return ["Satisfactory", "Unsatisfactory"];
    if (hasAll(["phd"]) && n.includes("seminar")) return ["Poor", "Good"];
    if (
      hasAll(["teaching"]) &&
      n.includes("practice") &&
      (n.includes(" i") ||
        n.endsWith("i") ||
        n.includes(" 1") ||
        n.endsWith("1"))
    ) {
      return ["Above average", "Average", "Below Average"];
    }
    if (
      n.includes("practice") &&
      (n.includes("lect") || n.includes("lecture")) &&
      n.includes("series") &&
      (n.includes(" i") ||
        n.endsWith("i") ||
        n.includes(" 1") ||
        n.endsWith("1"))
    ) {
      return ["Above average", "Average", "Below Average"];
    }
    return null;
  };

  const getGradeColumnRole = useCallback(
    (sheetName: string, headerIndex: number): "midsem" | "endsem" | null => {
      const sheet = sheets.find((s) => s.sheetName === sheetName);
      if (!sheet) return null;
      if (headerIndex <= 0) return null;
      const prev = sheet.columnHeaders[headerIndex - 1];
      if (!prev) return null;
      const lname = prev.name.toLowerCase();
      if (prev.type === "number" && lname.includes("mid")) return "midsem";
      if (
        prev.type === "number" &&
        (lname.includes("end") || lname.includes("comp"))
      )
        return "endsem";
      return null;
    },
    [sheets]
  );

  const saveRow = async (
    studentErpId: string,
    role: "instructor" | "supervisor"
  ) => {
    setIsSaving(true);
    try {
      const key = `${studentErpId}::${activeCourse}`;
      const row = grades[key];
      const endpoint =
        role === "instructor"
          ? "/grades/submit-grades"
          : "/grades/supervisor/save";
      await api.post(endpoint, {
        studentErpId,
        courseName: activeCourse,
        midsemGrade: row?.midsemGrade || undefined,
        compreGrade: row?.compreGrade || undefined,
        midsemMarks: row?.midsemMarks || undefined,
        endsemMarks: row?.endsemMarks || undefined,
        topic: row?.topic || undefined,
      });

      // Update local state immediately
      setGrades((prev) => {
        const key = `${studentErpId}::${activeCourse}`;
        const updated = { ...prev };
        if (!updated[key]) {
          updated[key] = { studentErpId, courseName: activeCourse } as GradeRow;
        }
        updated[key] = {
          ...updated[key],
          midsemGrade: row?.midsemGrade || undefined,
          compreGrade: row?.compreGrade || undefined,
          midsemMarks: row?.midsemMarks || undefined,
          endsemMarks: row?.endsemMarks || undefined,
          topic: row?.topic || undefined,
        };
        return updated;
      });

      toast.success("Saved");
    } catch (e: unknown) {
      const msg = getErrorMessage(e);
      console.error("[DEBUG] AssignGrades saveRow error:", e);
      toast.error(msg || "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const uploadDoc = async (
    studentErpId: string,
    file: File,
    type: "mid" | "end",
    erpId?: string | null,
    name?: string | null
  ) => {
    const form = new FormData();
    form.append("file", file);
    form.append("studentErpId", studentErpId);
    form.append("courseName", activeCourse);
    form.append("type", type);
    if (erpId) form.append("erpId", erpId);
    if (name) form.append("name", name);
    try {
      const res = await api.post<{ fileId?: number }>(
        "/grades/supervisor/uploadDoc",
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      const fileId = res.data?.fileId;
      if (fileId) {
        setGrades((prev) => {
          const key = `${studentErpId}::${activeCourse}`;
          const existing: Partial<GradeRow> =
            prev[key] ||
            ({ studentErpId, courseName: activeCourse } as Partial<GradeRow>);
          const updated: Partial<GradeRow> = { ...existing };
          if (type === "mid") updated.midsemDocFileId = fileId;
          if (type === "end") updated.endsemDocFileId = fileId;
          return { ...prev, [key]: updated as GradeRow };
        });
        try {
          localStorage.setItem("grades:syncUpdatedAt", String(Date.now()));
        } catch (e) {
          console.warn("syncUpdatedAt persist failed", e);
        }
      }
      toast.success("Document uploaded");
    } catch (e: unknown) {
      const msg = getErrorMessage(e);
      toast.error(msg || "Upload failed");
    }
  };

  const getCompletionForSheet = (sheetName: string) => {
    const sheet = sheets.find((s) => s.sheetName === sheetName);
    if (!sheet) return { completed: 0, total: 0 };

    const allowedErp = sheet.erpIds ?? null;

    // Use the same filtering logic as the main rows calculation
    const filteredStudents = students.filter((s) => {
      // Check if this student is assigned as instructor for the current course
      const isInstructorAssigned = instructorAssignments.some(
        (ia: InstructorAssignment) =>
          ia.studentErpId === s.erpId && ia.courseName === sheetName
      );

      // Check if this student is assigned as instructor for ANY course
      const isInstructorAssignedAnywhere = instructorAssignments.some(
        (ia: InstructorAssignment) => ia.studentErpId === s.erpId
      );

      // If student is instructor-assigned for THIS course, show them
      if (isInstructorAssigned) {
        return true;
      }

      // If student is instructor-assigned ANYWHERE, don't show them in supervisor courses
      if (isInstructorAssignedAnywhere) {
        return false;
      }

      // For supervisor students, filter by Excel sheet ERP IDs
      if (allowedErp && allowedErp.length > 0) {
        return s.erpId && allowedErp.includes(String(s.erpId));
      }

      // If no Excel sheet restrictions, show all students (for supervisor role)
      return true;
    });

    const gradeHeaders = sheet.columnHeaders.filter((h) => h.type === "grade");
    const completed = filteredStudents.filter((s) => {
      const r = s.erpId ? sheet.erpToRow[s.erpId] : undefined;
      if (!r) return false;
      return gradeHeaders.every((h) => {
        const v = r[h.name];
        return (
          (typeof v === "string" && v.trim() !== "") ||
          (typeof v === "number" && !Number.isNaN(v))
        );
      });
    }).length;

    return { completed, total: filteredStudents.length };
  };

  const getRoleBadge = (role: "instructor" | "supervisor") => {
    return role === "instructor" ? (
      <Badge variant="secondary" className="text-xs">
        Instructor
      </Badge>
    ) : (
      <Badge variant="outline" className="text-xs">
        Supervisor
      </Badge>
    );
  };

  return (
    <div className="container mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Assign Grades</h1>
        <p className="mt-2 text-muted-foreground">
          {userRoles.instructor && userRoles.supervisor
            ? "Assign grades for students you instruct and supervise. Data persists so you can return later."
            : userRoles.instructor
              ? "Assign grades for students assigned to you as instructor. Data persists so you can return later."
              : "Assign grades for students you supervise and upload midsem documents. Data persists so you can return later."}
        </p>
        <div className="mt-2 flex gap-2">
          {userRoles.instructor && (
            <Badge variant="secondary">Instructor</Badge>
          )}
          {userRoles.supervisor && <Badge variant="outline">Supervisor</Badge>}
          <Badge variant="default">Phase: {coursePhase}</Badge>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeCourse} onValueChange={setActiveCourse}>
            <TabsList className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 inline-flex h-auto w-full items-center justify-start overflow-x-auto rounded-md bg-muted p-1 text-muted-foreground">
              {(() => {
                // Get all available courses (Excel + instructor-assigned)
                const instructorCourses = [
                  ...new Set(
                    instructorAssignments.map(
                      (ia: InstructorAssignment) => ia.courseName
                    )
                  ),
                ];
                const excelCourses = sheets.length
                  ? sheets.map((s) => s.sheetName)
                  : [];
                const allCourses = [
                  ...new Set([...excelCourses, ...instructorCourses]),
                ];

                // If no courses from Excel or instructor assignments, use defaults only for supervisors
                if (
                  allCourses.length === 0 &&
                  userRoles.supervisor &&
                  !userRoles.instructor
                ) {
                  allCourses.push(...DEFAULT_GRADE_TABS);
                }

                return allCourses.map((c: string) => {
                  const stats = getCompletionForSheet(c);
                  return (
                    <TabsTrigger
                      key={c}
                      value={c}
                      className="min-w-fit capitalize"
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{c}</span>
                        <span className="text-xs text-muted-foreground">
                          {stats.completed}/{stats.total} completed
                        </span>
                      </div>
                    </TabsTrigger>
                  );
                });
              })()}
            </TabsList>
            {(() => {
              // Get all available courses (Excel + instructor-assigned)
              const instructorCourses = [
                ...new Set(
                  instructorAssignments.map(
                    (ia: InstructorAssignment) => ia.courseName
                  )
                ),
              ];
              const excelCourses = sheets.length
                ? sheets.map((s) => s.sheetName)
                : [];
              const allCourses = [
                ...new Set([...excelCourses, ...instructorCourses]),
              ];

              // If no courses from Excel or instructor assignments, use defaults only for supervisors
              if (
                allCourses.length === 0 &&
                userRoles.supervisor &&
                !userRoles.instructor
              ) {
                allCourses.push(...DEFAULT_GRADE_TABS);
              }

              return allCourses.map((c: string) => (
                <TabsContent key={c} value={c}>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {(
                            sheets.find((s) => s.sheetName === c)
                              ?.columnHeaders || []
                          ).map((header, headerIndex) => (
                            <TableHead
                              key={headerIndex}
                              className="min-w-[120px]"
                            >
                              {header.name}
                            </TableHead>
                          ))}
                          {/* If no Excel data for this course, show basic columns */}
                          {!sheets.find((s) => s.sheetName === c) && (
                            <>
                              <TableHead className="min-w-[120px]">
                                ERP ID
                              </TableHead>
                              <TableHead className="min-w-[120px]">
                                Campus ID
                              </TableHead>
                              <TableHead className="min-w-[120px]">
                                Name
                              </TableHead>
                              <TableHead className="min-w-[100px]">
                                Midsem Marks
                              </TableHead>
                              <TableHead className="min-w-[120px]">
                                Midsem Grade
                              </TableHead>
                              <TableHead className="min-w-[100px]">
                                Endsem Marks
                              </TableHead>
                              <TableHead className="min-w-[120px]">
                                Endsem Grade
                              </TableHead>
                              <TableHead className="min-w-[120px]">
                                Topic
                              </TableHead>
                            </>
                          )}
                          <TableHead className="min-w-[100px]">Role</TableHead>
                          <TableHead className="min-w-[140px]">
                            Midsem Report
                          </TableHead>
                          <TableHead className="min-w-[140px]">
                            Endsem Report
                          </TableHead>
                          <TableHead className="min-w-[100px]">
                            Action
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((r) => (
                          <TableRow key={r.email}>
                            {(
                              sheets.find((s) => s.sheetName === c)
                                ?.columnHeaders || []
                            ).map((header, headerIndex) => {
                              const sheet = sheets.find(
                                (s) => s.sheetName === c
                              );
                              const valueRaw = r.excelRow[header.name];
                              const value =
                                typeof valueRaw === "string" ||
                                typeof valueRaw === "number"
                                  ? valueRaw
                                  : "";

                              // Check if this is an instructor column
                              const isInstructorColumn =
                                header.name
                                  .toLowerCase()
                                  .includes("instructor") ||
                                header.name.toLowerCase().includes("teacher") ||
                                header.name.toLowerCase().includes("faculty");

                              if (isInstructorColumn) {
                                // Show assigned instructor name instead of Excel data
                                const assignedInstructor =
                                  instructorAssignments.find(
                                    (ia: InstructorAssignment) =>
                                      ia.studentErpId === r.erpId &&
                                      ia.courseName === c
                                  );
                                const instructorName =
                                  assignedInstructor?.instructorName ||
                                  "Not assigned";

                                return (
                                  <TableCell key={header.name}>
                                    <div className="text-sm font-medium">
                                      {instructorName}
                                    </div>
                                  </TableCell>
                                );
                              }

                              if (header.type === "number") {
                                return (
                                  <TableCell key={header.name}>
                                    <Input
                                      type="number"
                                      value={(() => {
                                        const vv = r.excelRow[header.name];
                                        return String(
                                          typeof vv === "string" ||
                                            typeof vv === "number"
                                            ? vv
                                            : ""
                                        );
                                      })()}
                                      onChange={(e) => {
                                        const v = e.target.value;
                                        r.excelRow[header.name] = v;

                                        // Also update grades state for saving
                                        const gradeKey = `${r.erpId}::${c}`;
                                        const gradeRole = getGradeColumnRole(
                                          c,
                                          headerIndex + 1
                                        );
                                        if (gradeRole === "midsem") {
                                          grades[gradeKey] = {
                                            ...grades[gradeKey],
                                            midsemMarks:
                                              v === "" ? undefined : Number(v),
                                          } as GradeRow;
                                        } else if (gradeRole === "endsem") {
                                          grades[gradeKey] = {
                                            ...grades[gradeKey],
                                            endsemMarks:
                                              v === "" ? undefined : Number(v),
                                          } as GradeRow;
                                        }

                                        forceRerender();
                                      }}
                                      className="w-28"
                                      placeholder="Marks"
                                      readOnly={
                                        coursePhase === "draft" ||
                                        (coursePhase === "midsem" &&
                                          getGradeColumnRole(
                                            c,
                                            headerIndex + 1
                                          ) === "endsem") ||
                                        (coursePhase === "endsem" &&
                                          getGradeColumnRole(
                                            c,
                                            headerIndex + 1
                                          ) === "midsem")
                                      }
                                    />
                                  </TableCell>
                                );
                              }
                              if (header.type === "grade") {
                                const fixedOptions =
                                  getFixedGradeOptionsForSheet(c);
                                const sheetOptions =
                                  sheet?.gradeOptionsByHeader[header.name];
                                // Only use dropdown if there are explicitly defined options
                                // Don't fallback to globalGradeOptions - use text input instead
                                const options =
                                  fixedOptions ??
                                  (sheetOptions && sheetOptions.length > 0
                                    ? sheetOptions
                                    : null);

                                const overrideKey = `${r.erpId}::${c}::${header.name}`;

                                const savedGrade = (() => {
                                  const g = grades[`${r.erpId}::${c}`];
                                  if (!g) return undefined;
                                  const gradeRole = getGradeColumnRole(
                                    c,
                                    headerIndex
                                  );
                                  if (gradeRole === "midsem")
                                    return g.midsemGrade || undefined;
                                  if (gradeRole === "endsem")
                                    return g.compreGrade || undefined;
                                  const lname = header.name.toLowerCase();
                                  if (
                                    lname.includes("mid") ||
                                    lname.includes("midsem")
                                  )
                                    return g.midsemGrade || undefined;
                                  if (
                                    lname.includes("comp") ||
                                    lname.includes("end")
                                  )
                                    return g.compreGrade || undefined;
                                  return undefined;
                                })();
                                const candidate =
                                  savedGrade ?? r.excelRow[header.name] ?? "";
                                const current = String(
                                  typeof candidate === "string" ||
                                    typeof candidate === "number"
                                    ? candidate
                                    : ""
                                );
                                if (options && options.length > 0) {
                                  return (
                                    <TableCell key={header.name}>
                                      <Select
                                        value={String(current)}
                                        onValueChange={(v) => {
                                          r.excelRow[header.name] = v;

                                          // Also update grades state for saving
                                          const gradeKey = `${r.erpId}::${c}`;
                                          const gradeRole = getGradeColumnRole(
                                            c,
                                            headerIndex
                                          );
                                          if (gradeRole === "midsem") {
                                            grades[gradeKey] = {
                                              ...grades[gradeKey],
                                              midsemGrade: v,
                                            } as GradeRow;
                                          } else if (gradeRole === "endsem") {
                                            grades[gradeKey] = {
                                              ...grades[gradeKey],
                                              compreGrade: v,
                                            } as GradeRow;
                                          }

                                          forceRerender();
                                        }}
                                        disabled={
                                          coursePhase === "draft" ||
                                          (coursePhase === "midsem" &&
                                            getGradeColumnRole(
                                              c,
                                              headerIndex
                                            ) === "endsem") ||
                                          (coursePhase === "endsem" &&
                                            getGradeColumnRole(
                                              c,
                                              headerIndex
                                            ) === "midsem")
                                        }
                                      >
                                        <SelectTrigger className="w-40">
                                          <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {options.map((g) => (
                                            <SelectItem
                                              key={`${overrideKey}:${g}`}
                                              value={g}
                                            >
                                              {g}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </TableCell>
                                  );
                                }
                                return (
                                  <TableCell key={header.name}>
                                    <Input
                                      value={String(current)}
                                      onChange={(e) => {
                                        r.excelRow[header.name] =
                                          e.target.value;

                                        // Also update grades state for saving
                                        const gradeKey = `${r.erpId}::${c}`;
                                        const gradeRole = getGradeColumnRole(
                                          c,
                                          headerIndex
                                        );
                                        if (gradeRole === "midsem") {
                                          grades[gradeKey] = {
                                            ...grades[gradeKey],
                                            midsemGrade: e.target.value,
                                          } as GradeRow;
                                        } else if (gradeRole === "endsem") {
                                          grades[gradeKey] = {
                                            ...grades[gradeKey],
                                            compreGrade: e.target.value,
                                          } as GradeRow;
                                        }

                                        forceRerender();
                                      }}
                                      placeholder="Enter grade"
                                      className="w-40"
                                      readOnly={
                                        coursePhase === "draft" ||
                                        (coursePhase === "midsem" &&
                                          getGradeColumnRole(c, headerIndex) ===
                                            "endsem") ||
                                        (coursePhase === "endsem" &&
                                          getGradeColumnRole(c, headerIndex) ===
                                            "midsem")
                                      }
                                    />
                                  </TableCell>
                                );
                              }
                              return (
                                <TableCell key={header.name}>
                                  <div className="font-medium">
                                    {String(value || "")}
                                  </div>
                                </TableCell>
                              );
                            })}

                            {/* Basic columns for instructor-assigned courses without Excel data */}
                            {!sheets.find((s) => s.sheetName === c) && (
                              <>
                                <TableCell>
                                  <div className="font-medium">{r.erpId}</div>
                                </TableCell>
                                <TableCell>
                                  <div className="font-medium">
                                    {r.campusId || "—"}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="font-medium">{r.name}</div>
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    value={r.midsemMarks ?? ""}
                                    onChange={(e) => {
                                      setGrades((prev) => {
                                        const key = `${r.erpId}::${c}`;
                                        const updated = { ...prev };
                                        updated[key] = {
                                          ...updated[key],
                                          midsemMarks:
                                            e.target.value === ""
                                              ? undefined
                                              : Number(e.target.value),
                                        } as GradeRow;
                                        return updated;
                                      });
                                    }}
                                    placeholder="Marks"
                                    className="w-28"
                                    readOnly={
                                      coursePhase === "draft" ||
                                      coursePhase === "endsem"
                                    }
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={r.midsemGrade}
                                    onChange={(e) => {
                                      setGrades((prev) => {
                                        const key = `${r.erpId}::${c}`;
                                        const updated = { ...prev };
                                        updated[key] = {
                                          ...updated[key],
                                          midsemGrade: e.target.value,
                                        } as GradeRow;
                                        return updated;
                                      });
                                    }}
                                    placeholder="Grade"
                                    className="w-40"
                                    readOnly={
                                      coursePhase === "draft" ||
                                      coursePhase === "endsem"
                                    }
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    value={r.endsemMarks ?? ""}
                                    onChange={(e) => {
                                      setGrades((prev) => {
                                        const key = `${r.erpId}::${c}`;
                                        const updated = { ...prev };
                                        updated[key] = {
                                          ...updated[key],
                                          endsemMarks:
                                            e.target.value === ""
                                              ? undefined
                                              : Number(e.target.value),
                                        } as GradeRow;
                                        return updated;
                                      });
                                    }}
                                    placeholder="Marks"
                                    className="w-28"
                                    readOnly={
                                      coursePhase === "draft" ||
                                      coursePhase === "midsem"
                                    }
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={r.compreGrade}
                                    onChange={(e) => {
                                      setGrades((prev) => {
                                        const key = `${r.erpId}::${c}`;
                                        const updated = { ...prev };
                                        updated[key] = {
                                          ...updated[key],
                                          compreGrade: e.target.value,
                                        } as GradeRow;
                                        return updated;
                                      });
                                    }}
                                    placeholder="Grade"
                                    className="w-40"
                                    readOnly={
                                      coursePhase === "draft" ||
                                      coursePhase === "midsem"
                                    }
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={r.topic || ""}
                                    onChange={(e) => {
                                      setGrades((prev) => {
                                        const key = `${r.erpId}::${c}`;
                                        const updated = { ...prev };
                                        updated[key] = {
                                          ...updated[key],
                                          topic: e.target.value,
                                        } as GradeRow;
                                        return updated;
                                      });
                                    }}
                                    placeholder="Topic"
                                    className="w-40"
                                    readOnly={coursePhase === "draft"}
                                  />
                                </TableCell>
                              </>
                            )}

                            <TableCell>{getRoleBadge(r.role)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="file"
                                  accept="application/pdf"
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f)
                                      void uploadDoc(
                                        r.erpId || "",
                                        f,
                                        "mid",
                                        r.erpId,
                                        r.name
                                      );
                                  }}
                                  disabled={
                                    coursePhase === "draft" ||
                                    coursePhase === "endsem"
                                  }
                                />
                                {r.midsemDocFileId ? (
                                  <a
                                    className="text-primary underline"
                                    href={`${BASE_API_URL}f/${r.midsemDocFileId}`}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    View
                                  </a>
                                ) : (
                                  <span className="text-muted-foreground">
                                    —
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="file"
                                  accept="application/pdf"
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f)
                                      void uploadDoc(
                                        r.erpId || "",
                                        f,
                                        "end",
                                        r.erpId,
                                        r.name
                                      );
                                  }}
                                  disabled={
                                    coursePhase === "draft" ||
                                    coursePhase === "midsem"
                                  }
                                />
                                {r.endsemDocFileId ? (
                                  <a
                                    className="text-primary underline"
                                    href={`${BASE_API_URL}f/${r.endsemDocFileId}`}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    View
                                  </a>
                                ) : (
                                  <span className="text-muted-foreground">
                                    —
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                onClick={() => {
                                  void saveRow(r.erpId || "", r.role);
                                }}
                                disabled={isSaving || coursePhase === "draft"}
                              >
                                Save
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              ));
            })()}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
