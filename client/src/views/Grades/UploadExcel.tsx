"use client";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileSpreadsheet, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axios-instance";

interface ColumnHeader {
    name: string;
    type: 'text' | 'number' | 'grade' | 'select' | 'serial';
    options?: string[];
}

interface StudentData {
    [key: string]: unknown;
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

interface ExcelData {
    fileName: string;
    sheets: SheetData[];
}

export default function UploadExcel() {
    const [isUploading, setIsUploading] = useState(false);
    const navigate = useNavigate();

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: {
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
            "application/vnd.ms-excel": [".xls"],
        },
        maxFiles: 1,
        onDrop: (acceptedFiles) => {
            if (acceptedFiles.length === 0) return;
            const file = acceptedFiles[0];
            void handleFileUpload(file);
        },
    });

    const handleFileUpload = async (file: File) => {
        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append("excel", file);

            const response = await api.post<{ success: boolean; data: ExcelData; gradeOptions: string[]; instructorColumnInfo: InstructorColumnInfo[] }>("/grades/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            if (response.data.success) {
                const data: ExcelData = response.data.data;
                const gradeOptions: string[] = response.data.gradeOptions;
                const instructorColumnInfo: InstructorColumnInfo[] = response.data.instructorColumnInfo;

                try {
                    localStorage.setItem("grades:lastExcelData", JSON.stringify(data));
                    localStorage.setItem("grades:lastGradeOptions", JSON.stringify(gradeOptions));
                    localStorage.setItem("grades:instructorColumnInfo", JSON.stringify(instructorColumnInfo));
                } catch (e) {
                    if (process.env.NODE_ENV !== "production") console.warn("Failed to persist last excel data", e);
                }

                toast.success("Excel file processed successfully!");

                navigate("/grades/manage", {
                    state: {
                        excelData: data,
                        gradeOptions,
                        instructorColumnInfo,
                    },
                });
            }
        } catch (error: unknown) {
            const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to upload Excel file";
            console.error("Process error:", error);
            toast.error(message);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Upload Excel Grade Sheet</h1>
                <p className="text-muted-foreground mt-2">
                    Upload an Excel file with multiple sheets containing student grade data
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5" />
                        Excel File Upload
                    </CardTitle>
                    <CardDescription>
                        Upload an Excel file (.xlsx or .xls) with student grade sheets. The system will automatically detect table structures and allow you to input grades.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive
                            ? "border-primary bg-primary/5"
                            : "border-muted-foreground/25 hover:border-primary hover:bg-primary/5"
                            } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
                    >
                        <input {...getInputProps()} />

                        {isUploading ? (
                            <div className="flex flex-col items-center gap-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                <p className="text-muted-foreground">Processing Excel file...</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4">
                                <Upload className="h-12 w-12 text-muted-foreground" />
                                <div>
                                    <p className="text-lg font-medium">
                                        {isDragActive ? "Drop the Excel file here" : "Drag & drop Excel file here"}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        or click to browse files
                                    </p>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Supports .xlsx and .xls files up to 5MB
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                        <h3 className="font-medium mb-2 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            Expected Format
                        </h3>
                        <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Excel file should contain multiple sheets (one per class/course)</li>
                            <li>• Each sheet should have columns: S.No, ERP ID, Campus ID, Name, Mid Sem Marks, Grade, End Sem Marks, Grade</li>
                            <li>• The system will automatically detect table structure and preserve any content above the table</li>
                            <li>• You can input marks and grades for each student after upload</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
