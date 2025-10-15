"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, Download, ArrowLeft } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import api from "@/lib/axios-instance";
import { BASE_API_URL } from "@/lib/constants";

interface ColumnHeader {
  name: string;
  type: "text" | "number" | "grade" | "select" | "serial";
  options?: string[];
}

type CellValue = string | number | null | undefined;
interface StudentData {
  [key: string]: CellValue;
}

interface SheetData {
  sheetName: string;
  headerRows: number;
  columnHeaders: ColumnHeader[];
  studentData: StudentData[];
  extraContent?: unknown[][];
}

interface InstructorColumnInfo {
  sheetName: string;
  hasInstructorColumn: boolean;
  instructorColumnName?: string;
  instructorColumnIndex?: number;
}

interface FacultyMember {
  email: string;
  name: string;
  department: string;
  displayName: string;
}

interface ExcelData {
  fileName: string;
  sheets: SheetData[];
}

export default function ManageGrades() {
  const location = useLocation();
  const navigate = useNavigate();
  const [excelData, setExcelData] = useState<ExcelData | null>(null);
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [modifiedData, setModifiedData] = useState<ExcelData | null>(null);
  const [instructorColumnInfo, setInstructorColumnInfo] = useState<
    InstructorColumnInfo[]
  >([]);
  const [facultyList, setFacultyList] = useState<FacultyMember[]>([]);
  const [selectedInstructors, setSelectedInstructors] = useState<
    Record<string, string>
  >({});
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>(
    {}
  );
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [midsemNotificationSent, setMidsemNotificationSent] = useState(false);
  const [endsemNotificationSent, setEndsemNotificationSent] = useState(false);

  const loadFacultyList = useCallback(async (search = "") => {
    try {
      const response = await api.get<{
        success: boolean;
        data: FacultyMember[];
      }>(`/grades/faculty-list?search=${encodeURIComponent(search)}&limit=100`);
      if (response.data.success) {
        setFacultyList(response.data.data);
      }
    } catch {
      toast.error("Failed to load faculty list");
    }
  }, []);

  const loadExistingInstructorAssignments = useCallback(async () => {
    if (!excelData) return;

    try {
      // Collect all ERP IDs and course names from the current data
      const erpIds = new Set<string>();
      const courseNames = new Set<string>();

      excelData.sheets.forEach((sheet) => {
        courseNames.add(sheet.sheetName);
        const erpCandidates = [
          "ERP ID",
          "ERP",
          "EMPLID",
          "Campus ID",
          "ID",
          "Reg No",
          "Registration",
        ];
        const erpHeader = sheet.columnHeaders?.find((h) =>
          erpCandidates.some((c) =>
            h.name.toLowerCase().includes(c.toLowerCase())
          )
        );
        if (erpHeader) {
          sheet.studentData.forEach((student) => {
            const erpId = student[erpHeader.name];
            if (erpId && String(erpId).trim()) {
              erpIds.add(String(erpId).trim());
            }
          });
        }
      });

      if (erpIds.size === 0 || courseNames.size === 0) return;

      const params = new URLSearchParams();
      params.set("erpIds", Array.from(erpIds).join(","));
      params.set("courseNames", Array.from(courseNames).join(","));

      const response = await api.get<{
        success: boolean;
        data: Array<{
          studentErpId: string;
          courseName: string;
          instructorEmail: string;
          instructorName: string;
          phase?: string;
        }>;
      }>(`/grades/instructor-assignments?${params.toString()}`);

      if (response.data.success) {
        const assignments: Record<string, string> = {};
        let hasMidsemPhase = false;
        let hasEndsemPhase = false;

        response.data.data.forEach((assignment) => {
          const key = `${assignment.studentErpId}::${assignment.courseName}`;
          assignments[key] = assignment.instructorName;

          // Check if any assignments have midsem or endsem phase
          if (assignment.phase === "midsem") hasMidsemPhase = true;
          if (assignment.phase === "endsem") hasEndsemPhase = true;
        });

        setSelectedInstructors(assignments);
        setMidsemNotificationSent(hasMidsemPhase);
        setEndsemNotificationSent(hasEndsemPhase);
      }
    } catch {
      console.error("Failed to load existing instructor assignments");
    }
  }, [excelData]);

  const assignStudentInstructor = async (
    studentErpId: string,
    courseName: string,
    instructorEmail: string,
    campusId?: string,
    studentName?: string
  ) => {
    try {
      const response = await api.post<{ success: boolean; message: string }>(
        "/grades/assign-student-instructor",
        {
          studentErpId,
          courseName,
          instructorEmail,
          campusId,
          studentName,
        }
      );

      if (response.data.success) {
        // Update local state to show selected instructor name
        const instructorKey = `${studentErpId}::${courseName}`;
        const selectedInstructor = facultyList.find(
          (f) => f.email === instructorEmail
        );
        if (selectedInstructor) {
          const instructorName =
            selectedInstructor.name || selectedInstructor.email;
          setSelectedInstructors((prev) => ({
            ...prev,
            [instructorKey]: instructorName,
          }));
        }
        toast.success(response.data.message);
      }
    } catch (error) {
      console.error("Failed to assign instructor:", error);
      toast.error("Failed to assign instructor");
    }
  };

  const sendMidsemNotification = async () => {
    if (!excelData) return;

    setIsSendingNotification(true);
    try {
      // Get all course names from the Excel data
      const courseNames = excelData.sheets.map((sheet) => sheet.sheetName);

      const response = await api.post<{ success: boolean; message: string }>(
        "/grades/notifications/send-midsem",
        {
          courseNames,
          subject: midsemNotificationSent
            ? `Midsem Grades Reminder`
            : `Midsem Grades Due`,
          body: midsemNotificationSent
            ? `Dear Instructor,\n\nThis is a reminder to submit midsem grades, marks, and topics for your assigned students.\n\nYou can access the system at: ${window.location.origin}/grades/assign-grades\n\nBest regards,\nGrade Management System`
            : `Dear Instructor,\n\nPlease submit midsem grades, marks, and topics for your assigned students.\n\nYou can access the system at: ${window.location.origin}/grades/assign-grades\n\nBest regards,\nGrade Management System`,
        }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        setMidsemNotificationSent(true);
      }
    } catch (error) {
      console.error("Failed to send midsem notification:", error);
      toast.error("Failed to send midsem notification");
    } finally {
      setIsSendingNotification(false);
    }
  };

  const sendEndsemNotification = async () => {
    if (!excelData) return;

    setIsSendingNotification(true);
    try {
      // Get all course names from the Excel data
      const courseNames = excelData.sheets.map((sheet) => sheet.sheetName);

      const response = await api.post<{ success: boolean; message: string }>(
        "/grades/notifications/send-endsem",
        {
          courseNames,
          subject: endsemNotificationSent
            ? `Endsem Grades Reminder`
            : `Endsem Grades Due`,
          body: endsemNotificationSent
            ? `Dear Instructor,\n\nThis is a reminder to submit endsem grades and marks for your assigned students.\n\nYou can access the system at: ${window.location.origin}/grades/assign-grades\n\nBest regards,\nGrade Management System`
            : `Dear Instructor,\n\nPlease submit endsem grades and marks for your assigned students.\n\nYou can access the system at: ${window.location.origin}/grades/assign-grades\n\nBest regards,\nGrade Management System`,
        }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        setEndsemNotificationSent(true);
      }
    } catch (error) {
      console.error("Failed to send endsem notification:", error);
      toast.error("Failed to send endsem notification");
    } finally {
      setIsSendingNotification(false);
    }
  };

  const applyStoredLinks = useCallback((): void => {
    const saved = localStorage.getItem("grades:lastExcelData");
    if (!saved) return;
    try {
      const stored = JSON.parse(saved) as ExcelData;
      const candidates = [
        "ERP ID",
        "ERP",
        "EMPLID",
        "Campus ID",
        "ID",
        "Reg No",
        "Registration",
      ];
      const bySheet: Record<
        string,
        {
          erpHeader: string | null;
          rows: StudentData[];
          headers: ColumnHeader[];
        }
      > = {};
      stored.sheets.forEach((s) => {
        const idx = s.columnHeaders.findIndex((h) =>
          candidates.some((c) => h.name.toLowerCase().includes(c.toLowerCase()))
        );
        const erpHeader = idx >= 0 ? s.columnHeaders[idx].name : null;
        bySheet[s.sheetName] = {
          erpHeader,
          rows: s.studentData,
          headers: s.columnHeaders,
        };
      });

      setModifiedData((prev) => {
        if (!prev) return prev;
        const cloned = {
          ...prev,
          sheets: prev.sheets.map((s) => ({
            ...s,
            studentData: s.studentData.map((r) => ({ ...r })),
          })),
        };
        cloned.sheets.forEach((sheet) => {
          const ref = bySheet[sheet.sheetName];
          if (!ref || !ref.erpHeader) return;
          const erpHeader = ref.erpHeader;
          const linkByErp: Record<
            string,
            { mid?: number; end?: number; topic?: string }
          > = {};
          ref.rows.forEach((row) => {
            if (typeof erpHeader !== "string") return;
            const erp = (row as Record<string, CellValue>)[erpHeader];
            if (!erp) return;
            const mid = (row as Record<string, unknown>)["_midsemDocFileId"] as
              | number
              | undefined;
            const end = (row as Record<string, unknown>)["_endsemDocFileId"] as
              | number
              | undefined;
            const topic = (row as Record<string, unknown>)["_topic"] as
              | string
              | undefined;
            if (mid || end || topic) {
              if (typeof erp === "string" || typeof erp === "number")
                linkByErp[String(erp)] = { mid, end, topic };
            }
          });
          sheet.studentData.forEach((row) => {
            if (typeof erpHeader !== "string") return;
            const erp = (row as Record<string, CellValue>)[erpHeader];
            if (
              (typeof erp === "string" || typeof erp === "number") &&
              linkByErp[String(erp)]
            ) {
              const links = linkByErp[String(erp)];
              if (links.mid)
                (row as Record<string, unknown>)["_midsemDocFileId"] =
                  links.mid;
              if (links.end)
                (row as Record<string, unknown>)["_endsemDocFileId"] =
                  links.end;
              if (links.topic)
                (row as Record<string, unknown>)["_topic"] = links.topic;
            }
          });
        });
        try {
          localStorage.setItem("grades:lastExcelData", JSON.stringify(cloned));
        } catch (e) {
          console.warn("persist lastExcelData failed", e);
        }
        return cloned;
      });
    } catch (e) {
      console.warn("applyStoredLinks outer failed", e);
    }
  }, []);

  const mergeSupervisorGrades = useCallback(async (data: ExcelData) => {
    try {
      const candidates = [
        "ERP ID",
        "ERP",
        "EMPLID",
        "Campus ID",
        "ID",
        "Reg No",
        "Registration",
      ];
      const erpIds = new Set<string>();
      const courseNames = new Set<string>();

      data.sheets.forEach((sheet) => {
        courseNames.add(sheet.sheetName);
        const idx = sheet.columnHeaders.findIndex((h) =>
          candidates.some((c) => h.name.toLowerCase().includes(c.toLowerCase()))
        );
        if (idx >= 0) {
          const header = sheet.columnHeaders[idx].name;
          sheet.studentData.forEach((row) => {
            const v = row[header];
            if (v !== undefined && v !== null && String(v).trim() !== "") {
              erpIds.add(String(v).trim());
            }
          });
        }
      });

      if (erpIds.size === 0) return;

      const params = new URLSearchParams();
      params.set("erpIds", Array.from(erpIds).join(","));
      params.set("courseNames", Array.from(courseNames).join(","));

      const res = await api.get<{
        data: {
          gradesMap: Record<
            string,
            {
              midsemGrade?: string;
              compreGrade?: string;
              midsemMarks?: number;
              endsemMarks?: number;
              topic?: string;
              midsemDocFileId?: number;
              endsemDocFileId?: number;
            }
          >;
          totalGrades: number;
        };
      }>(`/grades/public/get-all-saved-grades?${params.toString()}`);
      const payload = res.data.data;

      const gradesMap = payload.gradesMap;
      setModifiedData((prev) => {
        if (!prev) return prev;
        const cloned = {
          ...prev,
          sheets: prev.sheets.map((s) => ({
            ...s,
            studentData: s.studentData.map((r) => ({ ...r })),
          })),
        };
        cloned.sheets.forEach((sheet) => {
          const idx = sheet.columnHeaders.findIndex((h) =>
            candidates.some((c) =>
              h.name.toLowerCase().includes(c.toLowerCase())
            )
          );
          const erpHeader = idx >= 0 ? sheet.columnHeaders[idx].name : null;
          if (!erpHeader) return;
          sheet.studentData.forEach((row) => {
            const erp = row[erpHeader];
            if (!erp) return;
            const key = `${String(erp).trim()}::${sheet.sheetName}`;
            const g = gradesMap[key];
            if (!g) return;
            sheet.columnHeaders.forEach((h, hIndex) => {
              if (h.type === "grade") {
                let role: "midsem" | "endsem" | null = null;
                if (hIndex > 0) {
                  const prevHeader = sheet.columnHeaders[hIndex - 1];
                  const pl = prevHeader.name.toLowerCase();
                  if (prevHeader.type === "number" && pl.includes("mid"))
                    role = "midsem";
                  if (
                    prevHeader.type === "number" &&
                    (pl.includes("end") || pl.includes("comp"))
                  )
                    role = "endsem";
                }
                if (!role) {
                  const lname = h.name.toLowerCase();
                  if (lname.includes("mid") || lname.includes("midsem"))
                    role = "midsem";
                  if (lname.includes("comp") || lname.includes("end"))
                    role = "endsem";
                }
                if (role === "midsem" && g.midsemGrade)
                  row[h.name] = g.midsemGrade;
                if (role === "endsem" && g.compreGrade)
                  row[h.name] = g.compreGrade;
              }
              if (h.type === "number") {
                let role: "midsem" | "endsem" | null = null;
                if (hIndex + 1 < sheet.columnHeaders.length) {
                  const nextHeader = sheet.columnHeaders[hIndex + 1];
                  const nl = nextHeader.name.toLowerCase();
                  if (
                    nextHeader.type === "grade" &&
                    (nl.includes("mid") || nl.includes("midsem"))
                  )
                    role = "midsem";
                  if (
                    nextHeader.type === "grade" &&
                    (nl.includes("end") || nl.includes("comp"))
                  )
                    role = "endsem";
                }
                if (!role) {
                  const lname = h.name.toLowerCase();
                  if (lname.includes("mid")) role = "midsem";
                  if (lname.includes("end") || lname.includes("comp"))
                    role = "endsem";
                }
                if (role === "midsem" && g.midsemMarks != null)
                  row[h.name] = g.midsemMarks;
                if (role === "endsem" && g.endsemMarks != null)
                  row[h.name] = g.endsemMarks;
              }
              // Handle topic column - override Excel data with database data
              if (h.name.toLowerCase().includes("topic")) {
                if (g.topic) {
                  row[h.name] = g.topic;
                } else {
                  row[h.name] = "—";
                }
              }
            });
            if (g.topic) (row as Record<string, unknown>)["_topic"] = g.topic;
            if (g.midsemDocFileId)
              (row as Record<string, unknown>)["_midsemDocFileId"] =
                g.midsemDocFileId;
            if (g.endsemDocFileId)
              (row as Record<string, unknown>)["_endsemDocFileId"] =
                g.endsemDocFileId;
          });
        });
        try {
          localStorage.setItem("grades:lastExcelData", JSON.stringify(cloned));
        } catch (e) {
          console.warn("persist lastExcelData failed", e);
        }
        return cloned;
      });
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    void loadFacultyList();
  }, [loadFacultyList]);

  useEffect(() => {
    if (excelData) {
      void loadExistingInstructorAssignments();
    }
  }, [excelData, loadExistingInstructorAssignments]);

  useEffect(() => {
    const navState = location.state as unknown as {
      excelData?: ExcelData;
      instructorColumnInfo?: InstructorColumnInfo[];
    } | null;
    if (navState?.excelData) {
      const nextData = navState.excelData;
      setExcelData(nextData);
      setModifiedData(nextData);
      if (navState.instructorColumnInfo) {
        setInstructorColumnInfo(navState.instructorColumnInfo);
      }
      try {
        localStorage.setItem("grades:lastExcelData", JSON.stringify(nextData));
        if (navState.instructorColumnInfo) {
          localStorage.setItem(
            "grades:instructorColumnInfo",
            JSON.stringify(navState.instructorColumnInfo)
          );
        }
      } catch (e) {
        console.warn("Failed to persist lastExcelData", e);
      }
      try {
        applyStoredLinks();
      } catch (e) {
        console.warn("Error", e);
      }
      void mergeSupervisorGrades(nextData);
      return;
    }

    try {
      const savedData = localStorage.getItem("grades:lastExcelData");
      const savedColumnInfo = localStorage.getItem(
        "grades:instructorColumnInfo"
      );
      if (savedData) {
        const parsedData = JSON.parse(savedData) as ExcelData;
        setExcelData(parsedData);
        setModifiedData(parsedData);
        if (savedColumnInfo) {
          const parsedColumnInfo = JSON.parse(
            savedColumnInfo
          ) as InstructorColumnInfo[];
          setInstructorColumnInfo(parsedColumnInfo);
        }
        try {
          applyStoredLinks();
        } catch (e) {
          console.warn("Error", e);
        }
        void mergeSupervisorGrades(parsedData);
        return;
      }
    } catch (e) {
      console.warn("Error", e);
    }

    navigate("/grades/upload");
  }, [location.state, navigate, applyStoredLinks, mergeSupervisorGrades]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "grades:syncUpdatedAt") {
        const savedData = localStorage.getItem("grades:lastExcelData");
        if (savedData) {
          try {
            void mergeSupervisorGrades(JSON.parse(savedData) as ExcelData);
          } catch (e) {
            console.warn("Error", e);
          }
        }
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        const savedData = localStorage.getItem("grades:lastExcelData");
        if (savedData) {
          try {
            void mergeSupervisorGrades(JSON.parse(savedData) as ExcelData);
          } catch (e) {
            console.warn("Error", e);
          }
        }
      }
    };
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [mergeSupervisorGrades]);

  const handleExport = async () => {
    if (!modifiedData) return;

    setIsExporting(true);
    try {
      const response = await api.post("/grades/export", modifiedData, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        modifiedData.fileName.replace(/\.[^/.]+$/, "_graded.zip")
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Grade package exported successfully!");
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to export Excel file";
      console.error("Export error:", error);
      toast.error(message);
    } finally {
      setIsExporting(false);
    }
  };

  const getCompletionStatus = (sheet: SheetData) => {
    const validStudents = sheet.studentData.filter((student) => {
      const firstColumn = sheet.columnHeaders?.[0];
      if (!firstColumn) return false;
      const value = student?.[firstColumn.name];

      if (typeof value === "string") {
        const lowerValue = value.toLowerCase();
        if (
          lowerValue.includes("s.no") ||
          lowerValue.includes("serial") ||
          lowerValue.includes("id") ||
          lowerValue.includes("name") ||
          lowerValue.includes("marks") ||
          lowerValue.includes("grade") ||
          lowerValue === "s.no" ||
          lowerValue === "id" ||
          lowerValue === "name"
        ) {
          return false;
        }
      }

      return value !== undefined && value !== null && value !== "";
    });

    const totalStudents = validStudents.length;

    const completedStudents = validStudents.filter((student) => {
      const gradeColumns =
        sheet.columnHeaders?.filter((header) => header.type === "grade") || [];
      return gradeColumns.every((header) => {
        const value = student?.[header.name];
        return value !== undefined && value !== null && value !== "";
      });
    }).length;

    return { completed: completedStudents, total: totalStudents };
  };

  if (!excelData || !modifiedData) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const currentSheet = modifiedData.sheets[activeSheetIndex];
  const completionStatus = getCompletionStatus(currentSheet);

  return (
    <div className="container mx-auto max-w-7xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Grades</h1>
          <p className="mt-2 text-muted-foreground">
            Input marks and grades for students in each sheet
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/grades/upload")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Upload
          </Button>
          <Button
            onClick={() => {
              void handleExport();
            }}
            disabled={isExporting}
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? "Exporting..." : "Export Excel"}
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>File Information</CardTitle>
            <CardDescription>
              Original file: {excelData.fileName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                {excelData.sheets.length} Sheet
                {excelData.sheets.length !== 1 ? "s" : ""}
              </Badge>
              <Badge variant="outline">
                {completionStatus.completed}/{completionStatus.total} Students
                Completed
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Send Notifications</CardTitle>
          <CardDescription>
            Send notifications to instructors for grade submission
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              onClick={() => void sendMidsemNotification()}
              disabled={isSendingNotification}
              variant="outline"
            >
              {midsemNotificationSent
                ? "Send Midsem Reminder"
                : "Send Midsem Notification"}{" "}
              (All Courses)
            </Button>
            <Button
              onClick={() => void sendEndsemNotification()}
              disabled={isSendingNotification}
              variant="outline"
            >
              {endsemNotificationSent
                ? "Send Endsem Reminder"
                : "Send Endsem Notification"}{" "}
              (All Courses)
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs
        value={activeSheetIndex.toString()}
        onValueChange={(value) => setActiveSheetIndex(parseInt(value))}
      >
        <div className="relative">
          <TabsList className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 inline-flex h-auto w-full items-center justify-start overflow-x-auto rounded-md bg-muted p-1 text-muted-foreground">
            {modifiedData.sheets.map((sheet, index) => {
              const status = getCompletionStatus(sheet);
              return (
                <TabsTrigger
                  key={sheet.sheetName}
                  value={index.toString()}
                  className="inline-flex min-w-fit flex-shrink-0 items-center justify-center whitespace-nowrap rounded-sm px-3 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{sheet.sheetName}</span>
                    <span className="text-xs text-muted-foreground">
                      {status.completed}/{status.total} completed
                    </span>
                  </div>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {modifiedData.sheets.map((sheet, sheetIndex) => (
          <TabsContent key={sheet.sheetName} value={sheetIndex.toString()}>
            <Card>
              <CardHeader>
                <CardTitle>{sheet.sheetName}</CardTitle>
                <CardDescription>
                  Input marks and grades for each student. Use the dropdown
                  menus for grade selection.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {(
                          sheet.columnHeaders?.filter((h) => {
                            const n = String(h.name || "").trim();
                            if (!n) return false;
                            if (/^unnamed[:_\-\s]*\d*$/i.test(n)) return false;
                            if (/^(?:col(?:umn)?)\s*[_ ]?\d+$/i.test(n))
                              return false;
                            const lower = n.toLowerCase();
                            if (
                              [
                                "good",
                                "poor",
                                "satisfactory",
                                "unsatisfactory",
                                "above average",
                                "average",
                                "below average",
                              ].includes(lower)
                            )
                              return false;
                            return true;
                          }) || []
                        ).map((header) => (
                          <TableHead
                            key={header.name}
                            className="min-w-[120px]"
                          >
                            {header.name}
                          </TableHead>
                        ))}
                        <TableHead className="min-w-[120px]">Topic</TableHead>
                        <TableHead className="min-w-[140px]">
                          Midsem Report
                        </TableHead>
                        <TableHead className="min-w-[140px]">
                          Endsem Report
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sheet.studentData
                        .filter((student) => {
                          const firstColumn = sheet.columnHeaders?.[0];
                          if (!firstColumn) return false;
                          const value = student?.[firstColumn.name];

                          if (typeof value === "string") {
                            const lowerValue = value.toLowerCase();
                            if (
                              lowerValue.includes("s.no") ||
                              lowerValue.includes("serial") ||
                              lowerValue.includes("id") ||
                              lowerValue.includes("name") ||
                              lowerValue.includes("marks") ||
                              lowerValue.includes("grade") ||
                              lowerValue === "s.no" ||
                              lowerValue === "id" ||
                              lowerValue === "name"
                            ) {
                              return false;
                            }
                          }

                          return (
                            value !== undefined &&
                            value !== null &&
                            value !== ""
                          );
                        })
                        .map((student, studentIndex) => {
                          const firstColName =
                            sheet.columnHeaders?.[0]?.name ?? "";
                          const keyVal = student?.[firstColName];
                          const rowKey =
                            typeof keyVal === "string" ||
                            typeof keyVal === "number"
                              ? String(keyVal)
                              : String(studentIndex);
                          return (
                            <TableRow key={rowKey}>
                              {(
                                sheet.columnHeaders?.filter((h) => {
                                  const n = String(h.name || "").trim();
                                  if (!n) return false;
                                  if (/^unnamed[:_\-\s]*\d*$/i.test(n))
                                    return false;
                                  if (/^(?:col(?:umn)?)\s*[_ ]?\d+$/i.test(n))
                                    return false;
                                  const lower = n.toLowerCase();
                                  if (
                                    [
                                      "good",
                                      "poor",
                                      "satisfactory",
                                      "unsatisfactory",
                                      "above average",
                                      "average",
                                      "below average",
                                    ].includes(lower)
                                  )
                                    return false;
                                  return true;
                                }) || []
                              ).map((header) => (
                                <TableCell key={header.name}>
                                  {(() => {
                                    const sheetInfo = instructorColumnInfo.find(
                                      (info) =>
                                        info.sheetName === sheet.sheetName
                                    );
                                    const isInstructorColumn =
                                      sheetInfo?.hasInstructorColumn &&
                                      sheetInfo.instructorColumnName ===
                                        header.name;

                                    if (isInstructorColumn) {
                                      // Show instructor dropdown for instructor columns
                                      const erpCandidates = [
                                        "ERP ID",
                                        "ERP",
                                        "EMPLID",
                                        "Campus ID",
                                        "ID",
                                        "Reg No",
                                        "Registration",
                                      ];
                                      const erpHeader =
                                        sheet.columnHeaders?.find((h) =>
                                          erpCandidates.some((c) =>
                                            h.name
                                              .toLowerCase()
                                              .includes(c.toLowerCase())
                                          )
                                        );
                                      const studentErpId = erpHeader
                                        ? student?.[erpHeader.name]
                                        : null;
                                      const instructorKey = `${studentErpId}::${sheet.sheetName}`;
                                      const selectedInstructorName =
                                        selectedInstructors[instructorKey];
                                      const isOpen =
                                        openDropdowns[instructorKey] || false;

                                      // Find campus ID and name from Excel columns
                                      const campusIdHeader =
                                        sheet.columnHeaders?.find(
                                          (h) =>
                                            h.name
                                              .toLowerCase()
                                              .includes("campus") &&
                                            h.name.toLowerCase().includes("id")
                                        );
                                      const nameHeader =
                                        sheet.columnHeaders?.find(
                                          (h) =>
                                            h.name.toLowerCase() === "name" ||
                                            h.name
                                              .toLowerCase()
                                              .includes("student name")
                                        );
                                      const campusId = campusIdHeader
                                        ? student?.[campusIdHeader.name]
                                        : null;
                                      const studentName = nameHeader
                                        ? student?.[nameHeader.name]
                                        : null;

                                      // Debug logging
                                      console.log("Assigning instructor for:", {
                                        studentErpId,
                                        campusId,
                                        studentName,
                                        campusIdHeader: campusIdHeader?.name,
                                        nameHeader: nameHeader?.name,
                                        studentData: student,
                                      });

                                      return (
                                        <Popover
                                          open={isOpen}
                                          onOpenChange={(open) =>
                                            setOpenDropdowns((prev) => ({
                                              ...prev,
                                              [instructorKey]: open,
                                            }))
                                          }
                                        >
                                          <PopoverTrigger asChild>
                                            <Button
                                              variant="outline"
                                              role="combobox"
                                              aria-expanded={isOpen}
                                              className="w-full justify-between"
                                            >
                                              {selectedInstructorName ||
                                                "Select instructor..."}
                                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-full p-0">
                                            <Command>
                                              <CommandInput placeholder="Search instructor..." />
                                              <CommandList>
                                                <CommandEmpty>
                                                  No instructor found.
                                                </CommandEmpty>
                                                <CommandGroup>
                                                  {facultyList.map(
                                                    (faculty) => (
                                                      <CommandItem
                                                        key={faculty.email}
                                                        value={
                                                          faculty.displayName
                                                        }
                                                        onSelect={() => {
                                                          void assignStudentInstructor(
                                                            String(
                                                              studentErpId
                                                            ),
                                                            sheet.sheetName,
                                                            faculty.email,
                                                            String(campusId),
                                                            String(studentName)
                                                          );
                                                          setOpenDropdowns(
                                                            (prev) => ({
                                                              ...prev,
                                                              [instructorKey]:
                                                                false,
                                                            })
                                                          );
                                                        }}
                                                      >
                                                        <Check
                                                          className={`mr-2 h-4 w-4 ${
                                                            selectedInstructorName ===
                                                            faculty.name
                                                              ? "opacity-100"
                                                              : "opacity-0"
                                                          }`}
                                                        />
                                                        {faculty.name} (
                                                        {faculty.email})
                                                      </CommandItem>
                                                    )
                                                  )}
                                                </CommandGroup>
                                              </CommandList>
                                            </Command>
                                          </PopoverContent>
                                        </Popover>
                                      );
                                    }

                                    // Regular column rendering - all fields are display-only
                                    if (header.type === "serial") {
                                      return (
                                        <div className="text-center font-medium">
                                          {student?.[header.name] || ""}
                                        </div>
                                      );
                                    } else if (header.type === "number") {
                                      return (
                                        <div className="font-medium">
                                          {student?.[header.name] ?? "—"}
                                        </div>
                                      );
                                    } else if (header.type === "grade") {
                                      return (
                                        <div className="font-medium">
                                          {student?.[header.name] || "—"}
                                        </div>
                                      );
                                    } else {
                                      return (
                                        <div className="font-medium">
                                          {student?.[header.name] || ""}
                                        </div>
                                      );
                                    }
                                  })()}
                                </TableCell>
                              ))}
                              <TableCell>
                                <div className="font-medium">
                                  {(() => {
                                    const topic = (
                                      student as Record<string, unknown>
                                    )["_topic"];
                                    return typeof topic === "string"
                                      ? topic
                                      : "—";
                                  })()}
                                </div>
                              </TableCell>
                              <TableCell>
                                {(student as Record<string, unknown>)[
                                  "_midsemDocFileId"
                                ] ? (
                                  <a
                                    className="text-primary underline"
                                    href={`${BASE_API_URL}f/${String((student as Record<string, unknown>)["_midsemDocFileId"])}`}
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
                              </TableCell>
                              <TableCell>
                                {(student as Record<string, unknown>)[
                                  "_endsemDocFileId"
                                ] ? (
                                  <a
                                    className="text-primary underline"
                                    href={`${BASE_API_URL}f/${String((student as Record<string, unknown>)["_endsemDocFileId"])}`}
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
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
