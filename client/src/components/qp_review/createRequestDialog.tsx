"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import * as XLSX from "xlsx";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload, FileSpreadsheet, X } from "lucide-react";
import { toast } from "sonner";

// Define the schema - now only requestType is required from user
const createRequestSchema = z.object({
  requestType: z.enum(["Mid Sem", "Comprehensive", "Both"], {
    required_error: "Request type is required",
  }),
  file: z.any().refine((file) => file !== null, {
    message: "Excel file is required",
  }),
});

type CreateRequestFormData = z.infer<typeof createRequestSchema>;

// Interface for parsed Excel data
interface ExcelRowData {
  icEmail: string;
  courseName: string;
  courseCode: string;
  category: "HD" | "FD";
}

interface CreateRequestDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSubmit: (data: ExcelRowData[], requestType: string) => void;
  isLoading?: boolean;
}

const REQUEST_TYPES = ["Mid Sem", "Comprehensive", "Both"] as const;

export const CreateRequestDialog: React.FC<CreateRequestDialogProps> = ({
  isOpen,
  setIsOpen,
  onSubmit,
  isLoading = false,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ExcelRowData[]>([]);
  const [previewData, setPreviewData] = useState<ExcelRowData[]>([]);

  const form = useForm<CreateRequestFormData>({
    resolver: zodResolver(createRequestSchema),
    defaultValues: {
      requestType: undefined as unknown as (typeof REQUEST_TYPES)[number],
      file: null,
    },
  });

  // Handle file selection and parsing
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) {
      return;
    }

    // Validate file type
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a valid Excel file (.xlsx or .xls)");
      return;
    }

    setSelectedFile(file);
    form.setValue("file", file);

    // Parse Excel file
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });

        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(
          worksheet,
          {
            defval: "",
          }
        );

        // Validate and map data
        const validatedData: ExcelRowData[] = [];
        const errors: string[] = [];

        jsonData.forEach((row, index) => {
          const rowNumber = index + 2; // +2 because Excel is 1-indexed and has header

          // Check required fields (case-insensitive column names)
          const icEmail = 
            row.icEmail || 
            row.IcEmail || 
            row.ICEmail || 
            row["IC Email"] || 
            row["ic email"] || 
            "";
          
          const courseName = 
            row.courseName || 
            row.CourseName || 
            row["Course Name"] || 
            row["course name"] || 
            "";
          
          const courseCode = 
            row.courseCode || 
            row.CourseCode || 
            row["Course Code"] || 
            row["course code"] || 
            "";
          
          const category = 
            (row.category || row.Category || "").toUpperCase();

          // Validate data
          if (!icEmail || !courseName || !courseCode || !category) {
            errors.push(
              `Row ${rowNumber}: Missing required fields (icEmail, courseName, courseCode, category)`
            );
            return;
          }

          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(icEmail)) {
            errors.push(`Row ${rowNumber}: Invalid email format for ${icEmail}`);
            return;
          }

          // Validate category
          if (category !== "HD" && category !== "FD") {
            errors.push(
              `Row ${rowNumber}: Category must be either 'HD' or 'FD', got '${category}'`
            );
            return;
          }

          validatedData.push({
            icEmail: icEmail.trim(),
            courseName: courseName.trim(),
            courseCode: courseCode.trim(),
            category: category as "HD" | "FD",
          });
        });

        if (errors.length > 0) {
          toast.error(
            <div>
              <p className="font-semibold">Excel validation errors:</p>
              <ul className="list-disc pl-4 text-xs">
                {errors.slice(0, 5).map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
                {errors.length > 5 && (
                  <li>...and {errors.length - 5} more errors</li>
                )}
              </ul>
            </div>,
            { duration: 6000 }
          );
          setSelectedFile(null);
          setParsedData([]);
          setPreviewData([]);
          form.setValue("file", null);
          return;
        }

        if (validatedData.length === 0) {
          toast.error("No valid data found in Excel file");
          return;
        }

        setParsedData(validatedData);
        setPreviewData(validatedData.slice(0, 5)); // Show first 5 rows as preview
        toast.success(
          `Successfully loaded ${validatedData.length} course(s) from Excel file`
        );
      } catch (error) {
        console.error("Error parsing Excel file:", error);
        toast.error("Failed to parse Excel file. Please check the format.");
        setSelectedFile(null);
        setParsedData([]);
        setPreviewData([]);
        form.setValue("file", null);
      }
    };

    reader.onerror = () => {
      toast.error("Failed to read file");
      setSelectedFile(null);
      form.setValue("file", null);
    };

    reader.readAsBinaryString(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setParsedData([]);
    setPreviewData([]);
    form.setValue("file", null);
    
    // Reset file input
    const fileInput = document.getElementById("excel-file-input") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleSubmit = (data: CreateRequestFormData) => {
    if (parsedData.length === 0) {
      toast.error("Please upload a valid Excel file with course data");
      return;
    }

    // Pass array of courses and request type to parent
    onSubmit(parsedData, data.requestType);
    handleCancel();
  };

  const handleCancel = () => {
    form.reset();
    setSelectedFile(null);
    setParsedData([]);
    setPreviewData([]);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Request(s) from Excel</DialogTitle>
          <DialogDescription>
            Upload an Excel file containing course data and select the request type.
            <br />
            <span className="text-xs text-muted-foreground">
              Required columns: icEmail, courseName, courseCode, category (HD/FD)
            </span>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void form.handleSubmit(handleSubmit)(e);
            }}
            className="space-y-4"
          >
            {/* File Upload Section */}
            <FormField
              control={form.control}
              name="file"
              render={() => (
                <FormItem>
                  <FormLabel>Excel File</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      {!selectedFile ? (
                        <label
                          htmlFor="excel-file-input"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-10 h-10 mb-2 text-gray-400" />
                            <p className="mb-2 text-sm text-gray-500">
                              <span className="font-semibold">Click to upload</span> or
                              drag and drop
                            </p>
                            <p className="text-xs text-gray-500">
                              Excel files only (.xlsx, .xls)
                            </p>
                          </div>
                          <Input
                            id="excel-file-input"
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                      ) : (
                        <div className="flex items-center justify-between p-4 border-2 border-green-300 bg-green-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileSpreadsheet className="w-8 h-8 text-green-600" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {selectedFile.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {parsedData.length} course(s) loaded
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveFile}
                            className="text-red-600 hover:text-red-700 hover:bg-red-100"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Data Preview */}
            {previewData.length > 0 && (
              <div className="space-y-2">
                <FormLabel>Data Preview (First 5 rows)</FormLabel>
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">
                            Course Code
                          </th>
                          <th className="px-3 py-2 text-left font-medium">
                            Course Name
                          </th>
                          <th className="px-3 py-2 text-left font-medium">
                            IC Email
                          </th>
                          <th className="px-3 py-2 text-left font-medium">
                            Category
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {previewData.map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-3 py-2">{row.courseCode}</td>
                            <td className="px-3 py-2">{row.courseName}</td>
                            <td className="px-3 py-2 text-xs">{row.icEmail}</td>
                            <td className="px-3 py-2">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  row.category === "HD"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-purple-100 text-purple-800"
                                }`}
                              >
                                {row.category}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsedData.length > 5 && (
                    <div className="px-3 py-2 bg-gray-50 text-xs text-gray-600 text-center">
                      ...and {parsedData.length - 5} more row(s)
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Request Type Selection */}
            <FormField
              control={form.control}
              name="requestType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Request Type (applies to all courses)</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="space-y-2"
                    >
                      {REQUEST_TYPES.map((type) => (
                        <div key={type} className="flex items-center space-x-3">
                          <RadioGroupItem id={type} value={type} />
                          <FormLabel htmlFor={type} className="font-normal cursor-pointer">
                            {type}
                          </FormLabel>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !selectedFile || parsedData.length === 0}
                className="bg-primary text-white"
              >
                {isLoading
                  ? "Creating..."
                  : `Create ${parsedData.length} Request(s)`}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
