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
import { Upload, FileText, X } from "lucide-react";

interface UploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
  id: string;
  refetch: () => Promise<void>;
}

type UploadField = "midSemFile" | "midSemSolFile" | "compreFile" | "compreSolFile";

export const UploadDialogBox: React.FC<UploadDialogProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  id,
  refetch,
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<{
    midSemFile: File | null;
    midSemSolFile: File | null;
    compreFile: File | null;
    compreSolFile: File | null;
  }>({
    midSemFile: null,
    midSemSolFile: null,
    compreFile: null,
    compreSolFile: null,
  });

  const fileInputRefs = {
    midSemFile: useRef<HTMLInputElement>(null),
    midSemSolFile: useRef<HTMLInputElement>(null),
    compreFile: useRef<HTMLInputElement>(null),
    compreSolFile: useRef<HTMLInputElement>(null),
  };

  const [activeUploadField, setActiveUploadField] = useState<UploadField | null>("midSemFile");
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async ({ field, file }: { field: UploadField; file: File }) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await api.post(`/qp/uploadDocuments?id=${id}&field=${field}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },
    onSuccess: async (_, variables) => {
      const { field } = variables;
      toast.success(`${fieldLabels[field]} uploaded successfully`);
      await queryClient.invalidateQueries([""]);
      await refetch();
      onUploadSuccess();
      setActiveUploadField(()=> {return null});
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

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, field: UploadField) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type !== "application/pdf") {
        toast.error("Only PDF files are allowed");
        return;
      }
      setUploadedFiles(prev => ({ ...prev, [field]: file }));
      setActiveUploadField(()=> {return field});
    }
  };

  const triggerFileInput = (field: UploadField) => {
    setActiveUploadField(()=>{return field});
    fileInputRefs[field].current?.click();
  };

  const removeFile = (field: UploadField) => {
    setUploadedFiles(prev => ({ ...prev, [field]: null }));
    if (activeUploadField === field) {
      setActiveUploadField(()=>{return null});
    }
  };

  const fieldLabels = {
    midSemFile: "Mid Semester Question Paper",
    midSemSolFile: "Mid Semester Solution",
    compreFile: "Comprehensive Question Paper",
    compreSolFile: "Comprehensive Solution",
  };
  

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md border border-gray-300 bg-white text-black rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">Upload Documents</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {(Object.keys(uploadedFiles) as UploadField[]).map((field) => (
            <div key={field} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-700">{fieldLabels[field]}</h3>
                {uploadedFiles[field] && (
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

              {uploadedFiles[field] ? (
                <div className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-500" />
                    <span className="text-sm">
                      {uploadedFiles[field]?.name}
                    </span>
                  </div>
                  <Button
                    type="button"
                    onClick={() => uploadMutation.mutate({ field, file: uploadedFiles[field]! })}
                    disabled={uploadMutation.isLoading && activeUploadField === field}
                    className="h-8 px-4 text-sm bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {uploadMutation.isLoading && activeUploadField === field ? (
                      "Uploading..."
                    ) : (
                      "Upload"
                    )}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Input
                    id={`${field}-upload`}
                    type="file"
                    accept="application/pdf"
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
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="px-6"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};