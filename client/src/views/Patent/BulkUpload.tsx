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
      const response = await api.post("/patent/bulkUpload", formData, {
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
        toast.success(`Successfully uploaded ${responseData.results.successful} patents`);
      }
      if (responseData.results.failed > 0) {
        toast.error(`${responseData.results.failed} patents failed to upload`);
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
        applicationNumber: "2024XXXXXXX001",
        inventorsName: "Dr. John Smith, Prof. Jane Doe, Dr. Robert Johnson",
        department: "EEE",
        title: "Novel Algorithm for Machine Learning Applications in Data Processing",
        campus: "Hyderabad",
        filingDate: "15/01/2024",
        applicationPublicationDate: "20/06/2024",
        grantedDate: "",
        filingFY: "2023-24",
        filingAY: "2023-24",
        publishedAY: "2023-24",
        publishedFY: "2024-25",
        grantedFY: "",
        grantedAY: "",
        grantedCY: "",
        status: "Pending",
        grantedPatentCertificateLink: "https://example.com/certificate-link",
        applicationPublicationLink: "https://example.com/publication-link",
        form01Link: "",
      },
      {
        applicationNumber: "2024XXXXXXX002",
        inventorsName: "Dr. Sarah Wilson, Dr. Michael Brown",
        department: "EEE",
        title: "Advanced Sensor Technology for Environmental Monitoring Systems",
        campus: "Hyderabad",
        filingDate: "22/03/2024",
        applicationPublicationDate: "10/08/2024",
        grantedDate: "",
        filingFY: "2023-24",
        filingAY: "2023-24",
        publishedAY: "",
        publishedFY: "",
        grantedFY: "",
        grantedAY: "",
        grantedCY: "",
        status: "Filed",
        grantedPatentCertificateLink: "",
        applicationPublicationLink: "",
        form01Link: "https://example.com/form01-link",
      },
    ];

    const columns = [
      'applicationNumber', 'inventorsName', 'department', 'title', 'campus',
      'filingDate', 'applicationPublicationDate', 'grantedDate', 'filingFY',
      'filingAY', 'publishedAY', 'publishedFY', 'grantedFY', 'grantedAY',
      'grantedCY', 'status', 'grantedPatentCertificateLink',
      'applicationPublicationLink', 'form01Link'
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
        columns.map(col => escapeCSV(row[col as keyof typeof row] ?? '')).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "patent_bulk_upload_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (!authState) return <Navigate to="/" replace />;
  if (!checkAccess("patent:bulk-upload")) return <Navigate to="/404" replace />;

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bulk Upload Patents</h1>
          <p className="text-gray-600">Upload Excel or CSV file to create multiple patents at once</p>
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
                {uploading ? "Uploading..." : "Upload Patents"}
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
                  <li>• applicationNumber (<span className="text-red-600">required</span>)</li>
                  <li>• inventorsName (<span className="text-red-600">required</span>, comma-separated names)</li>
                  <li>• department (<span className="text-red-600">required</span>)</li>
                  <li>• title (<span className="text-red-600">required</span>)</li>
                  <li>• campus (<span className="text-red-600">required</span>)</li>
                  <li>• filingDate (<span className="text-red-600">required</span>, DD/MM/YYYY)</li>
                  <li>• filingFY (<span className="text-red-600">required</span>)</li>
                  <li>• filingAY (<span className="text-red-600">required</span>)</li>
                  <li>• status (<span className="text-red-600">required</span>, Pending/Filed/Granted/Abandoned/Rejected)</li>
                </ul>
                <p className="text-xs text-blue-600 mt-2">
                  <strong>Note:</strong> inventorsName should contain comma-separated inventor names. 
                  The system will automatically convert this to the new inventors structure with name and email fields.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Optional Columns:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• applicationPublicationDate (DD/MM/YYYY)</li>
                  <li>• grantedDate (DD/MM/YYYY)</li>
                  <li>• publishedAY</li>
                  <li>• publishedFY</li>
                  <li>• grantedFY</li>
                  <li>• grantedAY</li>
                  <li>• grantedCY</li>
                  <li>• grantedPatentCertificateLink</li>
                  <li>• applicationPublicationLink</li>
                  <li>• form01Link</li>
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