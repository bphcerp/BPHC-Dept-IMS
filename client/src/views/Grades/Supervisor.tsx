"use client";

import { useEffect, useMemo, useReducer, useState } from "react";
import api from "@/lib/axios-instance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
}

interface GradeRow {
    id: number;
    studentEmail: string;
    supervisorEmail: string;
    courseName: string;
    midsemGrade?: string | null;
    compreGrade?: string | null;
    midsemDocFileId?: number | null;
    endsemDocFileId?: number | null;
}

interface ColumnHeader { name: string; type: 'text' | 'number' | 'grade' | 'select' | 'serial' }
type ExcelSheetInfo = {
    sheetName: string;
    erpHeader: string | null;
    erpIds: string[];
    columnHeaders: ColumnHeader[];
    erpToRow: Record<string, Record<string, unknown>>;
    gradeOptionsByHeader: Record<string, string[]>;
};
const DEFAULT_GRADE_TABS = ["phd seminar", "phd thesis", "practice lecture series 1"];
const DEFAULT_GRADE_OPTIONS = ["A+", "A", "A-", "B+", "B", "B-", "C", "D", "E", "F", "I"];

const isPlaceholderHeader = (name: string): boolean => {
    const n = String(name || "").trim();
    if (!n) return true;
    if (/^unnamed[:_\-\s]*\d*$/i.test(n)) return true; 
    if (/^(?:col(?:umn)?)\s*[_ ]?\d+$/i.test(n)) return true;
    return false;
};

const isSpuriousGradeOptionHeader = (name: string): boolean => {
    const n = String(name || "").trim().toLowerCase();
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

export default function SupervisorGradesView() {
    const [students, setStudents] = useState<StudentRow[]>([]);
    const [grades, setGrades] = useState<Record<string, GradeRow>>({});
    const [sheets, setSheets] = useState<ExcelSheetInfo[]>([]);
    const [activeCourse, setActiveCourse] = useState<string>(DEFAULT_GRADE_TABS[0]);
    const [isSaving, setIsSaving] = useState(false);
    const [globalGradeOptions, setGlobalGradeOptions] = useState<string[]>(DEFAULT_GRADE_OPTIONS);
    const [, forceRerender] = useReducer((x: number) => x + 1, 0);

    useEffect(() => {
        void (async () => {
            try {
                try {
                    const saved = localStorage.getItem("grades:lastExcelData");
                    const savedOpts = localStorage.getItem("grades:lastGradeOptions");
                    if (savedOpts) {
                        try {
                            const parsedOpts = JSON.parse(savedOpts) as unknown as string[];
                            if (Array.isArray(parsedOpts) && parsedOpts.length > 0) {
                                setGlobalGradeOptions(parsedOpts);
                            }
                        } catch (e) { console.warn("Failed parsing saved grade options", e); }
                    }
                    if (saved) {
                        const parsed = JSON.parse(saved) as { sheets: { sheetName: string; columnHeaders: ColumnHeader[]; studentData: Array<Record<string, unknown>> }[] };
                        const candidates = ["ERP ID", "ERP", "EMPLID", "Campus ID", "ID", "Reg No", "Registration"];
                        const excelSheets: ExcelSheetInfo[] = parsed.sheets.map((sheet) => {
                            const headerIndex = sheet.columnHeaders.findIndex((h) => candidates.some((c) => h.name.toLowerCase().includes(c.toLowerCase())));
                            const erpHeader = headerIndex >= 0 ? sheet.columnHeaders[headerIndex].name : null;
                            const ids = new Set<string>();
                            const erpToRow: Record<string, Record<string, unknown>> = {};
                            if (erpHeader) {
                                sheet.studentData.forEach((row) => {
                                    const v = row[erpHeader];
                                    const idStr = (typeof v === 'string' || typeof v === 'number') ? String(v).trim() : "";
                                    if (idStr !== "") {
                                        ids.add(idStr);
                                        erpToRow[idStr] = row;
                                    }
                                });
                            }
                            const filteredHeaders = sheet.columnHeaders.filter((h) => !isPlaceholderHeader(h.name) && !isSpuriousGradeOptionHeader(h.name));
                       
                            const gradeOptionsByHeader: Record<string, string[]> = {};
                            filteredHeaders.filter(h => h.type === 'grade').forEach((h) => {
                                const opts = new Set<string>();
                                sheet.studentData.forEach((row) => {
                                    const val = row[h.name];
                                    if (val !== undefined && val !== null && (typeof val === 'string' || typeof val === 'number')) {
                                        const s = String(val).trim();
                                        if (s && s.length <= 10 && !/grade|marks|name|serial|id|s\.no|emplid|campus/i.test(s)) {
                                            opts.add(s);
                                        }
                                    }
                                });
                                const derived = Array.from(opts).sort((a, b) => a.localeCompare(b));
                                gradeOptionsByHeader[h.name] = derived.length > 0 ? derived : [];
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
                        if (excelSheets.length > 0) {
                            setSheets(excelSheets);
                            setActiveCourse(excelSheets[0].sheetName);
                            try {
                                const updatedData = {
                                    ...parsed, sheets: parsed.sheets.map(sheet => ({
                                        ...sheet,
                                        columnHeaders: sheet.columnHeaders.filter((h) => !isPlaceholderHeader(h.name) && !isSpuriousGradeOptionHeader(h.name))
                                    }))
                                };
                                localStorage.setItem("grades:lastExcelData", JSON.stringify(updatedData));
                            } catch (e) { console.warn("Failed to persist filtered excel data", e); }
                        }
                    }
                } catch (e) { console.warn("Failed to load local excel data", e); }

                const res = await api.get<{ data: { students: StudentRow[]; grades: GradeRow[]; targetCourses: string[] } }>(`/grades/supervisor`);
                const data = res.data.data;
                setStudents(data.students);
                const map: Record<string, GradeRow> = {};
                data.grades.forEach((g) => {
                    map[`${g.studentEmail}::${g.courseName}`] = g;
                });
                setGrades(map);
                if (!sheets.length && data.targetCourses?.length) {
                    setActiveCourse(data.targetCourses[0]);
                }
            } catch (e: unknown) {
                const msg = getErrorMessage(e);
                toast.error(msg || "Failed to load students");
            }
        })();
    }, [sheets.length]);

    useEffect(() => {
        if (sheets.length && !sheets.find(s => s.sheetName === activeCourse)) {
            setActiveCourse(sheets[0].sheetName);
        }
    }, [sheets, activeCourse]);

    const rows = useMemo<Array<{
        email: string;
        name: string | null;
        erpId: string | null;
        excelRow: Record<string, unknown>;
        midsemGrade: string;
        compreGrade: string;
        midsemDocFileId: number | null;
        endsemDocFileId: number | null;
    }>>(() => {
        const activeSheet = sheets.find((s) => s.sheetName === activeCourse);
        const allowedErp = activeSheet?.erpIds ?? null;
        return students
            .filter((s) => !allowedErp || (s.erpId && allowedErp.includes(String(s.erpId))))
            .map((s) => {
                const key = `${s.email}::${activeCourse}`;
                const g = grades[key];
                const excelRow: Record<string, unknown> = s.erpId && activeSheet?.erpToRow[s.erpId] ? activeSheet.erpToRow[s.erpId] : {};
                return {
                    ...s,
                    excelRow,
                    midsemGrade: g?.midsemGrade ?? "",
                    compreGrade: g?.compreGrade ?? "",
                    midsemDocFileId: g?.midsemDocFileId ?? null,
                    endsemDocFileId: g?.endsemDocFileId ?? null,
                };
            })
            .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
    }, [students, grades, activeCourse, sheets]);

    const getFixedGradeOptionsForSheet = (sheetName: string): string[] | null => {
        const n = sheetName.toLowerCase();
        const hasAll = (words: string[]) => words.every(w => n.includes(w));
        if (hasAll(["independent", "thesis"])) return ["Good"];
        if (hasAll(["phd"]) && n.includes("thesis")) return ["Satisfactory", "Unsatisfactory"];
        if (hasAll(["phd"]) && n.includes("seminar")) return ["Poor", "Good"];
        if (hasAll(["teaching"]) && n.includes("practice") && (n.includes(" i") || n.endsWith("i") || n.includes(" 1") || n.endsWith("1"))) {
            return ["Above average", "Average", "Below Average"];
        }
        if (n.includes("practice") && (n.includes("lect") || n.includes("lecture")) && n.includes("series") && (n.includes(" i") || n.endsWith("i") || n.includes(" 1") || n.endsWith("1"))) {
            return ["Above average", "Average", "Below Average"];
        }
        return null;
    };
    const getGradeColumnRole = (sheetName: string, headerIndex: number): 'midsem' | 'endsem' | null => {
        const sheet = sheets.find(s => s.sheetName === sheetName);
        if (!sheet) return null;
        if (headerIndex <= 0) return null;
        const prev = sheet.columnHeaders[headerIndex - 1];
        if (!prev) return null;
        const lname = prev.name.toLowerCase();
        if (prev.type === 'number' && (lname.includes('mid'))) return 'midsem';
        if (prev.type === 'number' && (lname.includes('end') || lname.includes('comp'))) return 'endsem';
        return null;
    };

    const saveRow = async (studentEmail: string) => {
        setIsSaving(true);
        try {
            const key = `${studentEmail}::${activeCourse}`;
            const row = grades[key];
            await api.post("/grades/supervisor/save", {
                studentEmail,
                courseName: activeCourse,
                midsemGrade: row?.midsemGrade || undefined,
                compreGrade: row?.compreGrade || undefined,
            });
            toast.success("Saved");
        } catch (e: unknown) {
            const msg = getErrorMessage(e);
            toast.error(msg || "Save failed");
        } finally {
            setIsSaving(false);
        }
    };

    const uploadDoc = async (studentEmail: string, file: File, type: 'mid' | 'end', erpId?: string | null, name?: string | null) => {
        const form = new FormData();
        form.append("file", file);
        form.append("studentEmail", studentEmail);
        form.append("courseName", activeCourse);
        form.append("type", type);
        if (erpId) form.append("erpId", erpId);
        if (name) form.append("name", name);
        try {
            const res = await api.post<{ fileId?: number }>("/grades/supervisor/uploadDoc", form, { headers: { "Content-Type": "multipart/form-data" } });
            const fileId = res.data?.fileId;
            if (fileId) {
                setGrades((prev) => {
                    const key = `${studentEmail}::${activeCourse}`;
                    const existing: Partial<GradeRow> = prev[key] || ({ studentEmail, courseName: activeCourse } as Partial<GradeRow>);
                    const updated: Partial<GradeRow> = { ...existing };
                    if (type === 'mid') updated.midsemDocFileId = fileId;
                    if (type === 'end') updated.endsemDocFileId = fileId;
                    return { ...prev, [key]: updated as GradeRow };
                });
                try { localStorage.setItem("grades:syncUpdatedAt", String(Date.now())); } catch (e) { console.warn("syncUpdatedAt persist failed", e); }
            }
            toast.success("Document uploaded");
        } catch (e: unknown) {
            const msg = getErrorMessage(e);
            toast.error(msg || "Upload failed");
        }
    };

    const saveGradeCell = async (studentEmail: string, sheetName: string, headerName: string, headerIndex: number, value: string) => {
        try {
            let role = getGradeColumnRole(sheetName, headerIndex);
            if (!role) {
                const lname = headerName.toLowerCase();
                if (lname.includes('mid')) role = 'midsem';
                if (lname.includes('comp') || lname.includes('end')) role = 'endsem';
            }
            if (!role) return;
            await api.post("/grades/supervisor/save", {
                studentEmail,
                courseName: sheetName,
                midsemGrade: role === 'midsem' ? value : undefined,
                compreGrade: role === 'endsem' ? value : undefined,
            });
            setGrades((prev) => {
                const key = `${studentEmail}::${sheetName}`;
                const existing: Partial<GradeRow> = prev[key] || ({ studentEmail, courseName: sheetName } as Partial<GradeRow>);
                const updated: Partial<GradeRow> = { ...existing };
                if (role === 'midsem') updated.midsemGrade = value;
                if (role === 'endsem') updated.compreGrade = value;
                return { ...prev, [key]: updated as GradeRow };
            });
            try { localStorage.setItem("grades:syncUpdatedAt", String(Date.now())); } catch (e) { console.warn("syncUpdatedAt persist failed", e); }
            toast.success("Saved");
        } catch (e: unknown) {
            const msg = getErrorMessage(e);
            toast.error(msg || "Save failed");
        }
    };

    const getCompletionForSheet = (sheetName: string) => {
        const sheet = sheets.find(s => s.sheetName === sheetName);
        if (!sheet) return { completed: 0, total: 0 };
        const allowedErp = sheet.erpIds;
        const filtered = students.filter(s => !allowedErp.length || (s.erpId && allowedErp.includes(String(s.erpId))));
        const gradeHeaders = sheet.columnHeaders.filter(h => h.type === 'grade');
        const completed = filtered.filter((s) => {
            const r = s.erpId ? sheet.erpToRow[s.erpId] : undefined;
            if (!r) return false;
            return gradeHeaders.every(h => {
                const v = r[h.name];
                return (
                    (typeof v === "string" && v.trim() !== "") ||
                    (typeof v === "number" && !Number.isNaN(v))
                );
            });
        }).length;
        return { completed, total: filtered.length };
    };

    const saveMarksCell = async (studentEmail: string, sheetName: string, headerIndex: number, value: number) => {
        try {
            const role = getGradeColumnRole(sheetName, headerIndex + 1); 
            await api.post("/grades/supervisor/save", {
                studentEmail,
                courseName: sheetName,
                midsemMarks: role === 'midsem' ? value : undefined,
                endsemMarks: role === 'endsem' ? value : undefined,
            });
            try { localStorage.setItem("grades:syncUpdatedAt", String(Date.now())); } catch (e) { console.warn("syncUpdatedAt persist failed", e); }
        } catch (e: unknown) {
            const msg = getErrorMessage(e);
            toast.error(msg || "Save failed");
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Supervisor Grades</h1>
                <p className="text-muted-foreground mt-2">Assign grades for your students and upload midsem documents. Data persists so you can return later.</p>
            </div>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Courses</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeCourse} onValueChange={setActiveCourse}>
                        <TabsList className="inline-flex h-auto items-center justify-start rounded-md bg-muted p-1 text-muted-foreground overflow-x-auto w-full scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                            {(sheets.length ? sheets.map(s => s.sheetName) : DEFAULT_GRADE_TABS).map((c) => {
                                const stats = getCompletionForSheet(c);
                                return (
                                    <TabsTrigger key={c} value={c} className="capitalize min-w-fit">
                                        <div className="flex flex-col items-start">
                                            <span className="font-medium">{c}</span>
                                            <span className="text-xs text-muted-foreground">{stats.completed}/{stats.total} completed</span>
                                        </div>
                                    </TabsTrigger>
                                );
                            })}
                        </TabsList>
                        {(sheets.length ? sheets.map(s => s.sheetName) : DEFAULT_GRADE_TABS).map((c) => (
                            <TabsContent key={c} value={c}>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                {(sheets.find(s => s.sheetName === c)?.columnHeaders || []).map((header, headerIndex) => (
                                                    <TableHead key={headerIndex} className="min-w-[120px]">{header.name}</TableHead>
                                                ))}
                                                <TableHead className="min-w-[140px]">Midsem Report</TableHead>
                                                <TableHead className="min-w-[140px]">Endsem Report</TableHead>
                                                <TableHead className="min-w-[100px]">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {rows.map((r) => (
                                                <TableRow key={r.email}>
                                                    {(sheets.find(s => s.sheetName === c)?.columnHeaders || []).map((header, headerIndex) => {
                                                        const sheet = sheets.find(s => s.sheetName === c);
                                                        const valueRaw = r.excelRow[header.name];
                                                        const value = (typeof valueRaw === 'string' || typeof valueRaw === 'number') ? valueRaw : "";
                                                        if (header.type === 'number') {
                                                            return (
                                                                <TableCell key={header.name}>
                                                                    <Input type="number" value={(() => { const vv = r.excelRow[header.name]; return String((typeof vv === 'string' || typeof vv === 'number') ? vv : ""); })()} onChange={(e) => {
                                                                        const v = e.target.value;
                                                                        r.excelRow[header.name] = v;
                                                                        forceRerender();
                                                                        const num = v === "" ? undefined : Number(v);
                                                                        if (num !== undefined && !Number.isNaN(num)) void saveMarksCell(r.email, c, headerIndex, num);
                                                                    }} className="w-28" placeholder="Marks" />
                                                                </TableCell>
                                                            );
                                                        }
                                                        if (header.type === 'grade') {
                                                            const fixedOptions = getFixedGradeOptionsForSheet(c);
                                                            const sheetOptions = sheet?.gradeOptionsByHeader[header.name];
                                                            const options = fixedOptions ?? ((sheetOptions && sheetOptions.length > 0) ? sheetOptions : globalGradeOptions);
                                                         
                                                            const overrideKey = `${r.email}::${c}::${header.name}`;
                                                            
                                                            const savedGrade = (() => {
                                                                const g = grades[`${r.email}::${c}`];
                                                                if (!g) return undefined;
                                                                const role = getGradeColumnRole(c, headerIndex);
                                                                if (role === 'midsem') return g.midsemGrade || undefined;
                                                                if (role === 'endsem') return g.compreGrade || undefined;
                                                                const lname = header.name.toLowerCase();
                                                                if (lname.includes("mid") || lname.includes("midsem")) return g.midsemGrade || undefined;
                                                                if (lname.includes("comp") || lname.includes("end")) return g.compreGrade || undefined;
                                                                return undefined;
                                                            })();
                                                            const candidate = savedGrade ?? (r.excelRow[header.name]) ?? "";
                                                            const current = String(typeof candidate === 'string' || typeof candidate === 'number' ? candidate : "");
                                                            if (options && options.length > 0) {
                                                                return (
                                                                    <TableCell key={header.name}>
                                                                        <Select value={String(current)} onValueChange={(v) => {
                                                                            r.excelRow[header.name] = v;
                                                                            void saveGradeCell(r.email, c, header.name, headerIndex, v);
                                                                        }}>
                                                                            <SelectTrigger className="w-40">
                                                                                <SelectValue placeholder="Select" />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                {options.map((g) => (
                                                                                    <SelectItem key={`${overrideKey}:${g}`} value={g}>{g}</SelectItem>
                                                                                ))}
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </TableCell>
                                                                );
                                                            }
                                                            return (
                                                                <TableCell key={header.name}>
                                                                    <Input value={String(current)} onChange={(e) => { r.excelRow[header.name] = e.target.value; void saveGradeCell(r.email, c, header.name, headerIndex, e.target.value); }} placeholder="Enter grade" className="w-40" />
                                                                </TableCell>
                                                            );
                                                        }
                                                        return <TableCell key={header.name}><div className="font-medium">{String(value || "")}</div></TableCell>;
                                                    })}
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Input type="file" accept="application/pdf" onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadDoc(r.email, f, 'mid', r.erpId, r.name); }} />
                                                            {r.midsemDocFileId ? (
                                                                <a className="text-primary underline" href={`${BASE_API_URL}f/${r.midsemDocFileId}`} target="_blank" rel="noreferrer">View</a>
                                                            ) : (
                                                                <span className="text-muted-foreground">—</span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Input type="file" accept="application/pdf" onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadDoc(r.email, f, 'end', r.erpId, r.name); }} />
                                                            {r.endsemDocFileId ? (
                                                                <a className="text-primary underline" href={`${BASE_API_URL}f/${r.endsemDocFileId}`} target="_blank" rel="noreferrer">View</a>
                                                            ) : (
                                                                <span className="text-muted-foreground">—</span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button size="sm" onClick={() => { void saveRow(r.email); }} disabled={isSaving}>Save</Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}


