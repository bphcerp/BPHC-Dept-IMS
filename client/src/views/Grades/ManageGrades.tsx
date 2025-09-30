"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Download, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios-instance";
import { BASE_API_URL } from "@/lib/constants";

interface ColumnHeader {
    name: string;
    type: 'text' | 'number' | 'grade' | 'select' | 'serial';
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

    useEffect(() => {
        const navState = location.state as unknown as { excelData?: ExcelData } | null;
        if (navState?.excelData) {
            const nextData = navState.excelData;
            setExcelData(nextData);
            setModifiedData(nextData);
            try {
                localStorage.setItem("grades:lastExcelData", JSON.stringify(nextData));
            } catch (e) { console.warn("Failed to persist lastExcelData", e); }
            try { applyStoredLinks(); } catch (e) { console.warn("Error", e); }
            void mergeSupervisorGrades(nextData);
            return;
        }

        try {
            const savedData = localStorage.getItem("grades:lastExcelData");
            if (savedData) {
                const parsedData = JSON.parse(savedData) as ExcelData;
                setExcelData(parsedData);
                setModifiedData(parsedData);
                try { applyStoredLinks(); } catch (e) { console.warn("Error", e); }
                void mergeSupervisorGrades(parsedData);
                return;
            }
        } catch (e) { console.warn("Error", e); }

        navigate("/grades/upload");
    }, [location.state, navigate]);

    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === "grades:syncUpdatedAt") {
                const savedData = localStorage.getItem("grades:lastExcelData");
                if (savedData) {
                    try { void mergeSupervisorGrades(JSON.parse(savedData) as ExcelData); } catch (e) { console.warn("Error", e); }
                }
            }
        };
        const onVisibility = () => {
            if (document.visibilityState === "visible") {
                const savedData = localStorage.getItem("grades:lastExcelData");
                if (savedData) {
                    try { void mergeSupervisorGrades(JSON.parse(savedData) as ExcelData); } catch (e) { console.warn("Error", e); }
                }
            }
        };
        window.addEventListener("storage", onStorage);
        document.addEventListener("visibilitychange", onVisibility);
        return () => {
            window.removeEventListener("storage", onStorage);
            document.removeEventListener("visibilitychange", onVisibility);
        };
    }, []);

    type GradePayload = { studentEmail: string; courseName: string; midsemGrade?: string | null; compreGrade?: string | null; midsemMarks?: number | null; endsemMarks?: number | null; midsemDocFileId?: number | null; endsemDocFileId?: number | null };

    const mergeSupervisorGrades = useCallback(async (data: ExcelData) => {
        try {
            const candidates = ["ERP ID", "ERP", "EMPLID", "Campus ID", "ID", "Reg No", "Registration"];
            const erpIds = new Set<string>();
            data.sheets.forEach((sheet) => {
                const idx = sheet.columnHeaders.findIndex(h => candidates.some(c => h.name.toLowerCase().includes(c.toLowerCase())));
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
            const res = await api.get<{ data: { students: { email: string; erpId: string }[]; grades: GradePayload[] } }>(`/grades/public/lookupByErp?${params.toString()}`);
            const payload = res.data.data;
            const emailByErp: Record<string, string> = {};
            payload.students.forEach(s => { if (s.erpId) emailByErp[String(s.erpId)] = s.email; });
            const map: Record<string, GradePayload> = {};
            payload.grades.forEach((g) => {
                map[`${g.studentEmail}::${g.courseName}`] = {
                    midsemGrade: g.midsemGrade ?? null,
                    compreGrade: g.compreGrade ?? null,
                    midsemMarks: g.midsemMarks ?? null,
                    endsemMarks: g.endsemMarks ?? null,
                    midsemDocFileId: g.midsemDocFileId ?? null,
                    endsemDocFileId: g.endsemDocFileId ?? null,
                    studentEmail: g.studentEmail,
                    courseName: g.courseName,
                };
            });
            setModifiedData((prev) => {
                if (!prev) return prev;
                const cloned = { ...prev, sheets: prev.sheets.map(s => ({ ...s, studentData: s.studentData.map(r => ({ ...r })) })) };
                cloned.sheets.forEach((sheet) => {
                    const idx = sheet.columnHeaders.findIndex(h => candidates.some(c => h.name.toLowerCase().includes(c.toLowerCase())));
                    const erpHeader = idx >= 0 ? sheet.columnHeaders[idx].name : null;
                    if (!erpHeader) return;
                    sheet.studentData.forEach((row) => {
                        const erp = row[erpHeader];
                        const email = (typeof erp === 'string' || typeof erp === 'number') ? emailByErp[String(erp)] : undefined;
                        if (!email) return;
                        const key = `${email}::${sheet.sheetName}`;
                        const g = map[key];
                        if (!g) return;
                        sheet.columnHeaders.forEach((h, hIndex) => {
                            if (h.type === 'grade') {
                                let role: 'midsem' | 'endsem' | null = null;
                                if (hIndex > 0) {
                                    const prevHeader = sheet.columnHeaders[hIndex - 1];
                                    const pl = prevHeader.name.toLowerCase();
                                    if (prevHeader.type === 'number' && pl.includes('mid')) role = 'midsem';
                                    if (prevHeader.type === 'number' && (pl.includes('end') || pl.includes('comp'))) role = 'endsem';
                                }
                                if (!role) {
                                    const lname = h.name.toLowerCase();
                                    if (lname.includes('mid') || lname.includes('midsem')) role = 'midsem';
                                    if (lname.includes('comp') || lname.includes('end')) role = 'endsem';
                                }
                                if (role === 'midsem' && g.midsemGrade) row[h.name] = g.midsemGrade;
                                if (role === 'endsem' && g.compreGrade) row[h.name] = g.compreGrade;
                            }
                            if (h.type === 'number') {
                                let role: 'midsem' | 'endsem' | null = null;
                                if (hIndex + 1 < sheet.columnHeaders.length) {
                                    const nextHeader = sheet.columnHeaders[hIndex + 1];
                                    const nl = nextHeader.name.toLowerCase();
                                    if (nextHeader.type === 'grade' && (nl.includes('mid') || nl.includes('midsem'))) role = 'midsem';
                                    if (nextHeader.type === 'grade' && (nl.includes('end') || nl.includes('comp'))) role = 'endsem';
                                }
                                if (!role) {
                                    const lname = h.name.toLowerCase();
                                    if (lname.includes('mid')) role = 'midsem';
                                    if (lname.includes('end') || lname.includes('comp')) role = 'endsem';
                                }
                                if (role === 'midsem' && g.midsemMarks != null) row[h.name] = g.midsemMarks;
                                if (role === 'endsem' && g.endsemMarks != null) row[h.name] = g.endsemMarks;
                            }
                        });
                        if (g.midsemDocFileId) (row as Record<string, unknown>)["_midsemDocFileId"] = g.midsemDocFileId;
                        if (g.endsemDocFileId) (row as Record<string, unknown>)["_endsemDocFileId"] = g.endsemDocFileId;
                    });
                });
                try { localStorage.setItem("grades:lastExcelData", JSON.stringify(cloned)); } catch (e) { console.warn("persist lastExcelData failed", e); }
                return cloned;
            });
        } catch (e) {
            console.error(e);
        }
    }, []);

    const applyStoredLinks = useCallback((): void => {
        const saved = localStorage.getItem("grades:lastExcelData");
        if (!saved) return;
        try {
            const stored = JSON.parse(saved) as ExcelData;
            const candidates = ["ERP ID", "ERP", "EMPLID", "Campus ID", "ID", "Reg No", "Registration"];
            const bySheet: Record<string, { erpHeader: string | null; rows: StudentData[]; headers: ColumnHeader[] }> = {};
            stored.sheets.forEach((s) => {
                const idx = s.columnHeaders.findIndex(h => candidates.some(c => h.name.toLowerCase().includes(c.toLowerCase())));
                const erpHeader = idx >= 0 ? s.columnHeaders[idx].name : null;
                bySheet[s.sheetName] = { erpHeader, rows: s.studentData, headers: s.columnHeaders };
            });

            setModifiedData((prev) => {
                if (!prev) return prev;
                const cloned = { ...prev, sheets: prev.sheets.map(s => ({ ...s, studentData: s.studentData.map(r => ({ ...r })) })) };
                cloned.sheets.forEach((sheet) => {
                    const ref = bySheet[sheet.sheetName];
                    if (!ref || !ref.erpHeader) return;
                    const erpHeader = ref.erpHeader;
                    const linkByErp: Record<string, { mid?: number; end?: number }> = {};
                    ref.rows.forEach((row) => {
                        if (typeof erpHeader !== 'string') return;
                        const erp = (row as Record<string, CellValue>)[erpHeader];
                        if (!erp) return;
                        const mid = (row as Record<string, unknown>)["_midsemDocFileId"] as number | undefined;
                        const end = (row as Record<string, unknown>)["_endsemDocFileId"] as number | undefined;
                        if (mid || end) {
                            if (typeof erp === 'string' || typeof erp === 'number') linkByErp[String(erp)] = { mid, end };
                        }
                    });
                    sheet.studentData.forEach((row) => {
                        if (typeof erpHeader !== 'string') return;
                        const erp = (row as Record<string, CellValue>)[erpHeader];
                        if ((typeof erp === 'string' || typeof erp === 'number') && linkByErp[String(erp)]) {
                            const links = linkByErp[String(erp)];
                            if (links.mid) (row as Record<string, unknown>)["_midsemDocFileId"] = links.mid;
                            if (links.end) (row as Record<string, unknown>)["_endsemDocFileId"] = links.end;
                        }
                    });
                });
                try { localStorage.setItem("grades:lastExcelData", JSON.stringify(cloned)); } catch (e) { console.warn("persist lastExcelData failed", e); }
                return cloned;
            });
        } catch (e) { console.warn("applyStoredLinks outer failed", e); }
    }, []);

    const getFixedOptionsForSheet = (sheetName: string): string[] | null => {
        const n = sheetName.toLowerCase();
        const hasAll = (words: string[]) => words.every(w => n.includes(w));
        if (hasAll(["independent", "thesis"])) return ["Good"];
        if (hasAll(["phd"]) && n.includes("thesis")) return ["Satisfactory", "Unsatisfactory"];
        if (hasAll(["phd"]) && n.includes("seminar")) return ["Poor", "Good"];
        if (hasAll(["teaching"]) && n.includes("practice") && (n.includes(" i") || n.endsWith("i") || n.includes(" 1") || n.endsWith("1"))) return ["Above average", "Average", "Below Average"];
        if (n.includes("practice") && (n.includes("lect") || n.includes("lecture")) && n.includes("series") && (n.includes(" i") || n.endsWith("i") || n.includes(" 1") || n.endsWith("1"))) return ["Above average", "Average", "Below Average"];
        return null;
    };

    const handleStudentDataChange = (
        sheetIndex: number,
        studentIndex: number,
        field: keyof StudentData,
        value: string | number
    ) => {
        if (!modifiedData) return;

        const updatedData = { ...modifiedData };
        const updatedSheets = [...updatedData.sheets];
        const updatedSheet = { ...updatedSheets[sheetIndex] };
        const updatedStudents = [...updatedSheet.studentData];
        const updatedStudent = { ...updatedStudents[studentIndex] };

        updatedStudent[field] = value as CellValue;
        updatedStudents[studentIndex] = updatedStudent;
        updatedSheet.studentData = updatedStudents;
        updatedSheets[sheetIndex] = updatedSheet;
        updatedData.sheets = updatedSheets;

        setModifiedData(updatedData);
        try {
            localStorage.setItem("grades:lastExcelData", JSON.stringify(updatedData));
        } catch (e) { console.warn("Failed to persist incremental edits", e); }
    };

    const handleExport = async () => {
        if (!modifiedData) return;

        setIsExporting(true);
        try {
            const response = await api.post("/grades/export", modifiedData, {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', modifiedData.fileName.replace(/\.[^/.]+$/, '_graded.xlsx'));
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success("Excel file exported successfully!");
        } catch (error: unknown) {
            const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to export Excel file";
            console.error("Export error:", error);
            toast.error(message);
        } finally {
            setIsExporting(false);
        }
    };

    const getCompletionStatus = (sheet: SheetData) => {
        const validStudents = sheet.studentData.filter(student => {
            const firstColumn = sheet.columnHeaders?.[0];
            if (!firstColumn) return false;
            const value = student?.[firstColumn.name];

            if (typeof value === 'string') {
                const lowerValue = value.toLowerCase();
                if (lowerValue.includes('s.no') ||
                    lowerValue.includes('serial') ||
                    lowerValue.includes('id') ||
                    lowerValue.includes('name') ||
                    lowerValue.includes('marks') ||
                    lowerValue.includes('grade') ||
                    lowerValue === 's.no' ||
                    lowerValue === 'id' ||
                    lowerValue === 'name') {
                    return false;
                }
            }

            return value !== undefined && value !== null && value !== '';
        });

        const totalStudents = validStudents.length;

        const completedStudents = validStudents.filter(student => {
            const gradeColumns = sheet.columnHeaders?.filter(header => header.type === 'grade') || [];
            return gradeColumns.every(header => {
                const value = student?.[header.name];
                return value !== undefined && value !== null && value !== '';
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
        <div className="container mx-auto p-6 max-w-7xl">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Manage Grades</h1>
                    <p className="text-muted-foreground mt-2">
                        Input marks and grades for students in each sheet
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => navigate("/grades/upload")}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Upload
                    </Button>
                    <Button
                        onClick={() => { void handleExport(); }}
                        disabled={isExporting}
                    >
                        <Download className="h-4 w-4 mr-2" />
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
                                {excelData.sheets.length} Sheet{excelData.sheets.length !== 1 ? 's' : ''}
                            </Badge>
                            <Badge variant="outline">
                                {completionStatus.completed}/{completionStatus.total} Students Completed
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs value={activeSheetIndex.toString()} onValueChange={(value) => setActiveSheetIndex(parseInt(value))}>
                <div className="relative">
                    <TabsList className="inline-flex h-auto items-center justify-start rounded-md bg-muted p-1 text-muted-foreground overflow-x-auto w-full scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                        {modifiedData.sheets.map((sheet, index) => {
                            const status = getCompletionStatus(sheet);
                            return (
                                <TabsTrigger key={sheet.sheetName} value={index.toString()} className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm min-w-fit flex-shrink-0">
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
                                    Input marks and grades for each student. Use the dropdown menus for grade selection.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                {(sheet.columnHeaders?.filter((h) => {
                                                    const n = String(h.name || "").trim();
                                                    if (!n) return false;
                                                    if (/^unnamed[:_\-\s]*\d*$/i.test(n)) return false;
                                                    if (/^(?:col(?:umn)?)\s*[_ ]?\d+$/i.test(n)) return false;
                                                    const lower = n.toLowerCase();
                                                    if (["good", "poor", "satisfactory", "unsatisfactory", "above average", "average", "below average"].includes(lower)) return false;
                                                    return true;
                                                }) || []).map((header) => (
                                                    <TableHead key={header.name} className="min-w-[120px]">
                                                        {header.name}
                                                    </TableHead>
                                                ))}
                                                <TableHead className="min-w-[140px]">Midsem Report</TableHead>
                                                <TableHead className="min-w-[140px]">Endsem Report</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {sheet.studentData
                                                .filter((student) => {
                                                    const firstColumn = sheet.columnHeaders?.[0];
                                                    if (!firstColumn) return false;
                                                    const value = student?.[firstColumn.name];

                                                    if (typeof value === 'string') {
                                                        const lowerValue = value.toLowerCase();
                                                        if (lowerValue.includes('s.no') ||
                                                            lowerValue.includes('serial') ||
                                                            lowerValue.includes('id') ||
                                                            lowerValue.includes('name') ||
                                                            lowerValue.includes('marks') ||
                                                            lowerValue.includes('grade') ||
                                                            lowerValue === 's.no' ||
                                                            lowerValue === 'id' ||
                                                            lowerValue === 'name') {
                                                            return false;
                                                        }
                                                    }

                                                    return value !== undefined && value !== null && value !== '';
                                                })
                                                .map((student, studentIndex) => {
                                                    const firstColName = sheet.columnHeaders?.[0]?.name ?? "";
                                                    const keyVal = student?.[firstColName];
                                                    const rowKey = (typeof keyVal === 'string' || typeof keyVal === 'number') ? String(keyVal) : String(studentIndex);
                                                    return (
                                                        <TableRow key={rowKey}>
                                                            {(sheet.columnHeaders?.filter((h) => {
                                                                const n = String(h.name || "").trim();
                                                                if (!n) return false;
                                                                if (/^unnamed[:_\-\s]*\d*$/i.test(n)) return false;
                                                                if (/^(?:col(?:umn)?)\s*[_ ]?\d+$/i.test(n)) return false;
                                                                const lower = n.toLowerCase();
                                                                if (["good", "poor", "satisfactory", "unsatisfactory", "above average", "average", "below average"].includes(lower)) return false;
                                                                return true;
                                                            }) || []).map((header) => (
                                                                <TableCell key={header.name}>
                                                                    {header.type === 'serial' ? (
                                                                        <div className="font-medium text-center">
                                                                            {student?.[header.name] || ""}
                                                                        </div>
                                                                    ) : header.type === 'number' ? (
                                                                        <Input
                                                                            type="number"
                                                                            value={String(student?.[header.name] ?? "")}
                                                                            onChange={(e) =>
                                                                                handleStudentDataChange(
                                                                                    sheetIndex,
                                                                                    studentIndex,
                                                                                    header.name,
                                                                                    e.target.value === "" ? "" : Number(e.target.value)
                                                                                )
                                                                            }
                                                                            placeholder="Enter value"
                                                                            className="w-full"
                                                                        />
                                                                    ) : header.type === 'grade' ? (
                                                                        (() => {
                                                                            const fixed = getFixedOptionsForSheet(sheet.sheetName);
                                                                            if (fixed && fixed.length > 0) {
                                                                                return (
                                                                                    <Select
                                                                                        value={String(student?.[header.name] ?? "")}
                                                                                        onValueChange={(value) => handleStudentDataChange(sheetIndex, studentIndex, header.name, String(value))}
                                                                                    >
                                                                                        <SelectTrigger className="w-full">
                                                                                            <SelectValue placeholder="Select grade" />
                                                                                        </SelectTrigger>
                                                                                        <SelectContent>
                                                                                            {fixed.map((g) => (
                                                                                                <SelectItem key={`${sheet.sheetName}:${rowKey}:${header.name}:${g}`} value={g}>{g}</SelectItem>
                                                                                            ))}
                                                                                        </SelectContent>
                                                                                    </Select>
                                                                                );
                                                                            }
                                                                            return (
                                                                                <Input value={String(student?.[header.name] ?? "")} onChange={(e) => handleStudentDataChange(sheetIndex, studentIndex, header.name, e.target.value)} placeholder="Enter grade" className="w-full" />
                                                                            );
                                                                        })()
                                                                    ) : (
                                                                        <div className="font-medium">
                                                                            {student?.[header.name] || ""}
                                                                        </div>
                                                                    )}
                                                                </TableCell>
                                                            ))}
                                                            <TableCell>
                                                                {(student as Record<string, unknown>)["_midsemDocFileId"] ? (
                                                                    <a className="text-primary underline" href={`${BASE_API_URL}f/${String((student as Record<string, unknown>)["_midsemDocFileId"])}`} target="_blank" rel="noreferrer">View</a>
                                                                ) : (
                                                                    <span className="text-muted-foreground">—</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                {(student as Record<string, unknown>)["_endsemDocFileId"] ? (
                                                                    <a className="text-primary underline" href={`${BASE_API_URL}f/${String((student as Record<string, unknown>)["_endsemDocFileId"])}`} target="_blank" rel="noreferrer">View</a>
                                                                ) : (
                                                                    <span className="text-muted-foreground">—</span>
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
