import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Upload, FileSpreadsheet, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import api from "@/lib/axios-instance";
import { useAuth } from "@/hooks/Auth";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";

interface BulkUploadProps {
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

export default function BulkUpload({ onBack }: BulkUploadProps) {
  const { authState, checkAccess } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<UploadResults | null>(null);

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

    setUploading(true);
    setResults(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post("/project/bulk-upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const responseData = response.data as { results: UploadResults };
      setResults(responseData.results);
      setFile(null);
      const fileInput = document.getElementById("file-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      
      if (responseData.results.successful > 0) {
        toast.success(`Successfully uploaded ${responseData.results.successful} projects`);
      }
      if (responseData.results.failed > 0) {
        toast.error(`${responseData.results.failed} projects failed to upload`);
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
        title: "Sample Project Title",
        piName: "Dr. John Doe",
        piEmail: "john.doe@example.com",
        piDepartment: "Computer Science",
        piCampus: "Main Campus",
        piAffiliation: "Professor",
        coPINames: "Jane Smith, Bob Wilson",
        coPIs: "jane.smith@example.com, bob.wilson@example.com",
        otherPIsNames: "",
        otherPIs: "",
        fundingAgency: "Department of Science and Technology",
        fundingAgencyNature: "public_sector",
        sanctionedAmount: 1000000,
        capexAmount: 300000,
        opexAmount: 500000,
        manpowerAmount: 200000,
        approvalDate: "15-01-2024",
        startDate: "01-02-2024",
        endDate: "31-01-2027",
        hasExtension: false,
      },
      {
        title: "Sample Project with Extension",
        piName: "Dr. Robert Wilson",
        piEmail: "robert.wilson@example.com",
        piDepartment: "Mechanical Engineering",
        piCampus: "Main Campus",
        piAffiliation: "Professor",
        coPINames: "Alice Brown",
        coPIs: "alice.brown@example.com",
        otherPIsNames: "Chris Lee, Taylor Brown",
        otherPIs: "chris.lee@example.com, taylor.brown@example.com",
        fundingAgency: "Council of Scientific and Industrial Research",
        fundingAgencyNature: "public_sector",
        sanctionedAmount: 1800000,
        capexAmount: 600000,
        opexAmount: 900000,
        manpowerAmount: 300000,
        approvalDate: "10-05-2023",
        startDate: "01-06-2023",
        endDate: "31-05-2026",
        hasExtension: true,
      }
    ];

    const columns = [
      'title', 'piName', 'piEmail', 'piDepartment', 'piCampus', 'piAffiliation',
      'coPINames', 'coPIs', 'otherPINames', 'otherPIs', 'fundingAgency', 'fundingAgencyNature', 'sanctionedAmount',
      'capexAmount', 'opexAmount', 'manpowerAmount', 'approvalDate',
      'startDate', 'endDate', 'hasExtension'
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
      ...templateData.map(row => 
        columns.map(col => {
          return escapeCSV(row[col as keyof typeof row] ?? '');
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "project_bulk_upload_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (!authState) return <Navigate to="/" replace />;
  if (!checkAccess("project:create")) return <Navigate to="/404" replace />;

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bulk Upload Projects</h1>
          <p className="text-gray-600">Upload Excel or CSV file to create multiple projects at once</p>
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
                <Label htmlFor="file-upload">Select Excel or CSV File</Label>
                <Input
                  id="file-upload"
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

              <Button
                onClick={() => void handleUpload()}
                disabled={!file || uploading}
                className="w-full"
              >
                {uploading ? "Uploading..." : "Upload Projects"}
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
                  <li>• title (<span className="text-red-600">required</span>)</li>
                  <li>• piName (<span className="text-red-600">required</span>)</li>
                  <li>• piEmail (<span className="text-red-600">required</span>)</li>
                  <li>• piDepartment (optional)</li>
                  <li>• piCampus (optional)</li>
                  <li>• piAffiliation (optional)</li>
                  <li>• coPINames (optional, comma-separated, order matches coPIs)</li>
                  <li>• coPIs (optional, comma-separated emails)</li>
                  <li>• otherPINames (optional, comma-separated, order matches otherPIs)</li>
                  <li>• otherPIs (optional, comma-separated emails)</li>
                  <li>• fundingAgency (<span className="text-red-600">required</span>)</li>
                  <li>• fundingAgencyNature (public_sector or private_industry)</li>
                  <li>• sanctionedAmount (<span className="text-red-600">required</span>, number)</li>
                  <li>• capexAmount (optional, number)</li>
                  <li>• opexAmount (optional, number)</li>
                  <li>• manpowerAmount (optional, number)</li>
                  <li>• approvalDate (<span className="text-red-600">required</span>, DD-MM-YYYY)</li>
                  <li>• startDate (<span className="text-red-600">required</span>, DD-MM-YYYY)</li>
                  <li>• endDate (<span className="text-red-600">required</span>, DD-MM-YYYY)</li>
                  <li>• hasExtension (optional, true/false)</li>
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
      </div>
    </div>
  );
} 