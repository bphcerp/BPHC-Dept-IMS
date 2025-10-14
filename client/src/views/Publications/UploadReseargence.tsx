import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FileSpreadsheet,
  FileSpreadsheetIcon,
  Text,
  Upload,
} from "lucide-react";
import api from "@/lib/axios-instance";
import { useAuth } from "@/hooks/Auth";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface UploadResults {
  successful: number;
  matched: number;
  failed: number;
  total: number;
  repeated: number;
  errors: string[];
}

interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
}

export default function UploadReseargence() {
  const queryClient = useQueryClient();

  const { authState, checkAccess } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [feedbackExcel, setFeedback] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const toggleFeedback = () => {
    setFeedback(!feedbackExcel);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await api.post(
        "/publications/researgence-upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          params: {
            return_type: "xlsx",
          },
          responseType: "blob",
        },
      );

      if (feedbackExcel) {

        const url = window.URL.createObjectURL(response.data);
        const a = document.createElement("a");
        a.href = url;
        a.download = "upload_results.xlsx"; // file name for the user
        document.body.appendChild(a);
        toast.success(
          `Successfully retrieved results as xlsx file.`,
        );

        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        const responseData = response.data as { results: UploadResults };
        setFile(null);
        const fileInput = document.getElementById(
          "file-upload-researgence",
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";
        if (responseData.results.successful > 0) {
          toast.success(
            `Successfully uploaded ${responseData.results.successful} Researgence publications.`,
          );
        }
        if (responseData.results.matched > 0) {
          toast.success(
            `Successfully matched and updated ${responseData.results.matched} publications`,
          );
        }
        if (responseData.results.failed > 0) {
          toast.error(
            `${responseData.results.failed} Researgence publications failed to upload.`,
          );
        }
        if (responseData.results.repeated > 0) {
          toast.info(
            `${responseData.results.repeated} Researgence publications re-uploaded.`,
          );
        }

        void queryClient.invalidateQueries({ queryKey: ["publications"] });
        queryClient.refetchQueries({ queryKey: ["publications"] });

      }
    } catch (err) {
      const error = err as ApiError;
      const errorMessage = error?.response?.data?.error || "Upload failed";
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  if (!authState) return <Navigate to="/" replace />;
  if (!checkAccess("publications:upload")) {
    return <Navigate to="/404" replace />;
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-start p-8">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Upload Researgence Data
          </h1>
          <p className="text-gray-600">
            Upload Excel or CSV file to validate Google API publications with researgence
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload File
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file-upload-researgence">
                  Select Excel or CSV File
                </Label>
                <Input
                  id="file-upload-researgence"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                <p className="text-sm text-muted-foreground">
                  Supported formats: .xlsx, .xls, .csv (Max size: 5MB)
                </p>
              </div>
              {file && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">{file.name}</span>
                  <span className="text-sm text-muted-foreground">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              )}
              <div className="flex w-full">
                <Button
                  onClick={toggleFeedback}
                  className="w-10 mr-2 aspect-square"
                >
                  {feedbackExcel ? <FileSpreadsheetIcon /> : <Text />}
                </Button>
                <Button
                  onClick={() => void handleUpload()}
                  disabled={!file || uploading}
                  className="flex-1 px-3"
                >
                  {uploading ? "Uploading..." : "Upload Researgence Data"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
