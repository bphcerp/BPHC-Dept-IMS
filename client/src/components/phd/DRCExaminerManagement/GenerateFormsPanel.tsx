import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, FileDown, Loader2, Printer, Download, Calendar, Users, ArrowLeft, ArrowRight } from "lucide-react";
import api from "@/lib/axios-instance";
import { toast } from "sonner";
import { QualifyingExamApplication } from "./ApplicationsDataTable";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

type VerifiedApplication = QualifyingExamApplication;

interface GenerateFormsPanelProps {
  selectedExamId: number;
  onNext?: () => void;
  onBack?: () => void;
}

const GenerateFormsPanel: React.FC<GenerateFormsPanelProps> = ({ selectedExamId, onNext, onBack }) => {
  const [selectedApplications, setSelectedApplications] = useState<number[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const { data: verifiedApplications = [], isLoading } = useQuery({
    queryKey: ["verified-applications", selectedExamId],
    queryFn: async () => {
      const response = await api.get<VerifiedApplication[]>(`/phd/drcMember/getVerifiedApplications/${selectedExamId}`);
      return response.data;
    },
    enabled: !!selectedExamId,
  });

  const verifiedApps = verifiedApplications.filter(app => app.status === 'verified');

  const downloadFormsMutation = useMutation({
    mutationFn: async (applicationIds: number[]) => {
      const response = await api.post(`/phd/drcMember/generateForms`, 
        { applicationIds, format: 'download' },
        { responseType: 'blob' }
      );
      return response.data as Blob;
    },
    onSuccess: (blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Qualifying-Exam-Documents-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Student documents downloaded successfully as a ZIP file.");
      setSelectedApplications([]);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to generate ZIP file.");
    },
    onSettled: () => {
      setIsDownloading(false);
    },
  });

  const handleDownloadForms = () => {
    if (selectedApplications.length === 0) {
      toast.error("Please select at least one application.");
      return;
    }
    setIsDownloading(true);
    downloadFormsMutation.mutate(selectedApplications);
  };

  const handlePrintForms = () => {
    if (selectedApplications.length === 0) {
      toast.error("Please select at least one application");
      return;
    }
    setIsPrinting(true);
    api.post(
      `/phd/drcMember/generateForms`,
      { applicationIds: selectedApplications, format: 'print' },
      { responseType: 'blob' },
    ).then((response: { data: Blob }) => {
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const printWindow = window.open(url, '_blank');
      printWindow?.addEventListener('load', () => printWindow.print());
      toast.success("Consolidated list opened for printing.");
    }).catch((error: unknown) => {
      console.error("Error generating forms for print:", error);
      toast.error("Failed to generate forms for printing.");
    }).finally(() => {
      setIsPrinting(false);
    });
  };

  const handleSelectApplication = (applicationId: number, checked: boolean) => {
    if (checked) {
      setSelectedApplications(prev => [...prev, applicationId]);
    } else {
      setSelectedApplications(prev => prev.filter(id => id !== applicationId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedApplications(verifiedApps.map(app => app.id));
    } else {
      setSelectedApplications([]);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit", hour12: true,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading verified applications...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5" /> Generate Forms for Verified Applications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Verified Applications</p>
                <p className="text-2xl font-bold">{verifiedApps.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Selected</p>
                <p className="text-2xl font-bold">{selectedApplications.length}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleDownloadForms} disabled={selectedApplications.length === 0 || isDownloading || isPrinting} className="flex items-center gap-2">
              {isDownloading ? (<Loader2 className="h-4 w-4 animate-spin" />) : (<Download className="h-4 w-4" />)}
              Download Docs ({selectedApplications.length})
            </Button>
            <Button variant="outline" onClick={handlePrintForms} disabled={selectedApplications.length === 0 || isPrinting || isDownloading} className="flex items-center gap-2">
              <Printer className="h-4 w-4" /> Print List
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {verifiedApps.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedApplications.length === verifiedApps.length && verifiedApps.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>ERP ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Areas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {verifiedApps.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedApplications.includes(application.id)}
                        onCheckedChange={(checked) => handleSelectApplication(application.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{application.student.name || "Unknown"}</TableCell>
                    <TableCell>{application.student.erpId || "N/A"}</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-700">Verified</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">{application.qualifyingArea1}</div>
                        <div className="text-sm text-muted-foreground">{application.qualifyingArea2}</div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <FileDown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Verified Applications</h3>
              <p className="text-muted-foreground">
                No applications have been verified yet in the "Applications" tab.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        {onBack && (
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Applications
          </Button>
        )}
        {onNext && (
          <Button onClick={onNext} className="flex items-center gap-2 ml-auto" disabled={verifiedApps.length === 0}>
            Continue to Examiner Management <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default GenerateFormsPanel;