import React, { ChangeEvent, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { Input } from "../ui/input";
import { Upload, FileText, X, CheckCircle, Trash2 } from "lucide-react";

interface UploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
  id: string;
  refetch: () => Promise<void>;
  mode?: "mid" | "compre" | "both";
}

type UploadField = "midSemQpFile" | "midSemSolFile" | "compreQpFile" | "compreSolFile";

export const UploadDialogBox: React.FC<UploadDialogProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  id,
  refetch,
  mode = "both",
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<{
    midSemQpFile: File | null;
    midSemSolFile: File | null;
    compreQpFile: File | null;
    compreSolFile: File | null;
  }>({
    midSemQpFile: null,
    midSemSolFile: null,
    compreQpFile: null,
    compreSolFile: null,
  });

  // Track successfully uploaded files
  const [successfullyUploaded, setSuccessfullyUploaded] = useState<Set<UploadField>>(new Set());

  const fileInputRefs = {
    midSemQpFile: useRef<HTMLInputElement>(null),
    midSemSolFile: useRef<HTMLInputElement>(null),
    compreQpFile: useRef<HTMLInputElement>(null),
    compreSolFile: useRef<HTMLInputElement>(null),
  };

  const [activeUploadField, setActiveUploadField] = useState<UploadField | null>(null);
  const queryClient = useQueryClient();

  const fieldLabels: Record<UploadField, string> = {
    midSemQpFile: "Mid Semester Question Paper",
    midSemSolFile: "Mid Semester Solution",
    compreQpFile: "Comprehensive Question Paper",
    compreSolFile: "Comprehensive Solution",
  };

  // Get required fields based on mode
  const getRequiredFields = (): UploadField[] => {
    switch (mode) {
      case "mid":
        return ["midSemQpFile", "midSemSolFile"];
      case "compre":
        return ["compreQpFile", "compreSolFile"];
      case "both":
        return ["midSemQpFile", "midSemSolFile", "compreQpFile", "compreSolFile"];
      default:
        return ["midSemQpFile", "midSemSolFile", "compreQpFile", "compreSolFile"];
    }
  };

  const uploadMutation = useMutation({
    mutationFn: async ({ field, file }: { field: UploadField; file: File }) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await api.post(
        `/qp/uploadDocuments?id=${id}&field=${field}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data;
    },
    onSuccess: async (_, variables) => {
      const { field } = variables;
      toast.success(`${fieldLabels[field]} uploaded successfully`);
      
      // Mark this field as successfully uploaded
      setSuccessfullyUploaded(prev => new Set([...prev, field]));
      
      await queryClient.invalidateQueries([""]);
      await refetch();
      
      const requiredFields = getRequiredFields();
      const newSuccessfulCount = successfullyUploaded.size + 1;
      
      // Only close dialog if all required files are uploaded
      if (newSuccessfulCount >= requiredFields.length) {
        onUploadSuccess();
      }
      
      setActiveUploadField(null);
    },
    onError: (error, variables) => {
      const { field } = variables;
      if (isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        toast.error(`${fieldLabels[field]} upload failed: ${message}`);
      } else {
        toast.error(`An unexpected error occurred during ${fieldLabels[field]} upload`);
      }
    },
  });

  // Enhanced PDF validation function
  const isPdf = (file: File): boolean => {
    if (file.type === "application/pdf") {
      return true;
    }
    
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith('.pdf')) {
      return true;
    }
    
    return false;
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, field: UploadField) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    if (!isPdf(file)) {
      toast.error("Only PDF files are allowed");
      e.target.value = "";
      return;
    }
    
    setUploadedFiles((prev) => ({ ...prev, [field]: file }));
    setActiveUploadField(field);
  };

  const triggerFileInput = (field: UploadField) => {
    setActiveUploadField(field);
    fileInputRefs[field].current?.click();
  };

  const removeFile = (field: UploadField) => {
    setUploadedFiles((prev) => ({ ...prev, [field]: null }));
    if (activeUploadField === field) {
      setActiveUploadField(null);
    }
    if (fileInputRefs[field].current) {
      fileInputRefs[field].current.value = "";
    }
  };

  // New function to handle re-upload (delete uploaded state and allow new file selection)
  const handleReUpload = (field: UploadField) => {
    // Remove from successfully uploaded set
    setSuccessfullyUploaded(prev => {
      const newSet = new Set(prev);
      newSet.delete(field);
      return newSet;
    });
    
    // Clear the file
    setUploadedFiles((prev) => ({ ...prev, [field]: null }));
    
    // Clear file input
    if (fileInputRefs[field].current) {
      fileInputRefs[field].current.value = "";
    }
    
    toast.info(`Ready to upload new ${fieldLabels[field]}`);
  };

  const renderSingleFieldRow = (field: UploadField) => {
    const file = uploadedFiles[field];
    const isUploaded = successfullyUploaded.has(field);
    
    return (
      <div key={field} className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            {fieldLabels[field]}
            {isUploaded && (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
          </h4>
          {file && !isUploaded && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeFile(field)}
              className="h-8 px-3 text-sm text-red-500 hover:bg-red-50"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {isUploaded ? (
          // Show success state for uploaded files with re-upload option
          <div className="flex items-center justify-between p-3 border rounded-md bg-green-50 border-green-200">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm text-green-700 font-medium">Successfully Uploaded</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                ✓ Complete
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleReUpload(field)}
                className="h-8 px-2 text-sm text-orange-600 hover:bg-orange-50"
                title="Delete and upload again"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : file ? (
          // Show file ready to upload
          <div className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-gray-500" />
              <span className="text-sm">{file.name}</span>
            </div>
            <Button
              type="button"
              onClick={() => uploadMutation.mutate({ field, file })}
              disabled={uploadMutation.isLoading && activeUploadField === field}
              className="h-8 px-4 text-sm bg-blue-600 hover:bg-blue-700 text-white"
            >
              {uploadMutation.isLoading && activeUploadField === field ? "Uploading..." : "Upload"}
            </Button>
          </div>
        ) : (
          // Show file selection button
          <div className="flex flex-col gap-2">
            <Input
              id={`${field}-upload`}
              type="file"
              accept="application/pdf,.pdf"
              onChange={(e) => handleFileChange(e, field)}
              className="hidden"
              ref={fileInputRefs[field]}
            />
            <Button
              type="button"
              variant="outline"
              className="gap-2 w-full"
              onClick={() => triggerFileInput(field)}
            >
              <Upload className="h-4 w-4" />
              Select PDF File
            </Button>
          </div>
        )}
      </div>
    );
  };

  // Calculate progress
  const requiredFields = getRequiredFields();
  const uploadProgress = `${successfullyUploaded.size}/${requiredFields.length}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md border border-gray-300 bg-white text-black rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            Upload Documents
          </DialogTitle>
          {requiredFields.length > 1 && (
            <p className="text-sm text-gray-600 text-center">
              Progress: {uploadProgress} files uploaded
            </p>
          )}
        </DialogHeader>

        <div className="space-y-6 py-4">
          {mode === "mid" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800">Mid Semester</h3>
              {renderSingleFieldRow("midSemQpFile")}
              {renderSingleFieldRow("midSemSolFile")}
            </div>
          )}

          {mode === "compre" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800">Comprehensive</h3>
              {renderSingleFieldRow("compreQpFile")}
              {renderSingleFieldRow("compreSolFile")}
            </div>
          )}

          {mode === "both" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800">Upload All Required Documents</h3>
              <div className="grid grid-cols-1 gap-4">
                {renderSingleFieldRow("midSemQpFile")}
                {renderSingleFieldRow("midSemSolFile")}
                {renderSingleFieldRow("compreQpFile")}
                {renderSingleFieldRow("compreSolFile")}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="px-6">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
