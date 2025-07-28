import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Upload, FileSpreadsheet, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import api from "@/lib/axios-instance";
import { useAuth } from "@/hooks/Auth";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface BulkUploadWilpProps {
  onBack: () => void;
}

interface UploadResults {
  successful: number;
  failed: number;
  total: number;
  errors: string[];
}

interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
}

export default function BulkUploadWilp({ onBack }: BulkUploadWilpProps) {
  const { authState, checkAccess } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<UploadResults | null>(null);
  const [reminder, setReminder] = useState("");
  const [deadline, setDeadline] = useState("");
  const [minProjects, setMinProjects] = useState(1);
  const [maxProjects, setMaxProjects] = useState(2);
  const [settingRange, setSettingRange] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResults(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }
    if (!reminder || !deadline) {
      toast.error("Please provide both reminder and deadline dates");
      return;
    }
    setUploading(true);
    setResults(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("reminder", reminder);
    formData.append("deadline", deadline);
    try {
      const response = await api.post("/wilpProject/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      const responseData = response.data as { results: UploadResults };
      setResults(responseData.results);
      setFile(null);
      const fileInput = document.getElementById("file-upload-wilp") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      if (responseData.results.successful > 0) {
        toast.success(`Successfully uploaded ${responseData.results.successful} WILP projects`);
      }
      if (responseData.results.failed > 0) {
        toast.error(`${responseData.results.failed} WILP projects failed to upload`);
      }
    } catch (err) {
      const error = err as ApiError;
      const errorMessage = error?.response?.data?.error || "Upload failed";
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        "student ID Number": "2023A7PS0001G",
        "discipline": "Computer Science",
        "student name": "John Doe",
        "Employing Organization": "ABC Corp",
        "Degree Program": "B.Tech. Engineering Technology",
        "Research Area": "AI/ML",
        "Dissertation Title": "Deep Learning for NLP"
      },
      {
        "student ID Number": "2023A7PS0002G",
        "discipline": "Mechanical Engineering",
        "student name": "Jane Smith",
        "Employing Organization": "XYZ Ltd",
        "Degree Program": "MBA in Manufacturing Management",
        "Research Area": "Supply Chain",
        "Dissertation Title": "Optimization in Manufacturing"
      }
    ];
    const columns = [
      "student ID Number",
      "discipline",
      "student name",
      "Employing Organization",
      "Degree Program",
      "Research Area",
      "Dissertation Title"
    ];
    const escapeCSV = (value: string | number | boolean) => {
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };
    const csvContent = [
      columns.join(','),
      ...templateData.map(row => columns.map(col => escapeCSV(row[col as keyof typeof row])).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wilp_bulk_upload_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleSetRange = async () => {
    if (minProjects > maxProjects) {
      toast.error("Min Projects cannot be greater than Max Projects");
      return;
    }
    setSettingRange(true);
    try {
      await api.post("/wilpProject/setRange", { min: minProjects, max: maxProjects });
      toast.success(`Project selection range (${minProjects} - ${maxProjects}) set successfully.`);
    } catch (err) {
      console.error("Set range error:", err);
      let errorMessage = "Failed to set project range";
      if (err && typeof err === "object") {
        const apiErr = err as ApiError & { message?: string; status?: number };
        if (apiErr.response?.data?.error) {
          errorMessage = apiErr.response.data.error;
        } else if (apiErr.message) {
          errorMessage = apiErr.message;
        } else if (apiErr.status) {
          errorMessage += ` (Status: ${apiErr.status})`;
        }
      }
      toast.error(errorMessage);
    } finally {
      setSettingRange(false);
    }
  };

  if (!authState) return <Navigate to="/" replace />;
  if (!checkAccess("wilp:project:upload")) return <Navigate to="/404" replace />;

  return (
    <div className="flex-1 flex flex-col items-center justify-start p-8">
      <div className="w-full max-w-4xl space-y-8">
        <div className="flex items-center gap-4 self-start w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bulk Upload WILP Projects</h1>
          <p className="text-gray-600">Upload Excel or CSV file to create multiple WILP projects at once</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload File
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file-upload-wilp">Select Excel or CSV File</Label>
                <Input
                  id="file-upload-wilp"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                <p className="text-sm text-muted-foreground">
                  Supported formats: .xlsx, .xls, .csv (Max size: 5MB)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reminder-date">Reminder Date (ISO format)</Label>
                <Input
                  id="reminder-date"
                  type="date"
                  value={reminder}
                  onChange={e => setReminder(e.target.value)}
                />
                <Label htmlFor="deadline-date">Deadline Date (ISO format)</Label>
                <Input
                  id="deadline-date"
                  type="date"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                />
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
              <Button
                onClick={() => void handleUpload()}
                disabled={!file || uploading}
                className="w-full"
              >
                {uploading ? "Uploading..." : "Upload WILP Projects"}
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Download Template
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Download the template file to see the required format and column headers.
              </p>
              <div className="space-y-2">
                <h4 className="font-medium">Required Columns:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• student ID Number (<span className="text-red-600">required</span>)</li>
                  <li>• discipline (<span className="text-red-600">required</span>)</li>
                  <li>• student name (<span className="text-red-600">required</span>)</li>
                  <li>• Employing Organization (<span className="text-red-600">required</span>)</li>
                  <li>• Degree Program (<span className="text-red-600">required</span>, must match allowed values)</li>
                  <li>• Research Area (<span className="text-red-600">required</span>)</li>
                  <li>• Dissertation Title (<span className="text-red-600">required</span>)</li>
                </ul>
              </div>
              <Button onClick={downloadTemplate} variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </CardContent>
          </Card>
        </div>
        {results && (
          <Card>
            <CardHeader>
              <CardTitle>Upload Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">{results.successful}</p>
                    <p className="text-sm text-blue-600">Successful</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <div>
                    <p className="font-medium text-red-900">{results.failed}</p>
                    <p className="text-sm text-red-600">Failed</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <FileSpreadsheet className="h-4 w-4 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">{results.total}</p>
                    <p className="text-sm text-gray-600">Total</p>
                  </div>
                </div>
              </div>
              {results.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-red-900">Errors:</h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {results.errors.map((error: string, index: number) => (
                      <p key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                        {error}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        <div className="w-full max-w-4xl mt-8 p-6 bg-white rounded shadow flex flex-col md:flex-row items-center gap-4">
          <Label htmlFor="min-projects" className="w-32">Min Projects</Label>
          <Input
            id="min-projects"
            type="number"
            min={1}
            value={minProjects}
            onChange={e => setMinProjects(Number(e.target.value))}
            className="max-w-xs"
          />
          <Label htmlFor="max-projects" className="w-32">Max Projects</Label>
          <Input
            id="max-projects"
            type="number"
            min={minProjects}
            value={maxProjects}
            onChange={e => setMaxProjects(Number(e.target.value))}
            className="max-w-xs"
          />
          <Button
            onClick={() => void handleSetRange()}
            disabled={settingRange}
            className="ml-2"
          >
            {settingRange ? "Setting..." : "Set Range"}
          </Button>
        </div>
      </div>
    </div>
  );
}