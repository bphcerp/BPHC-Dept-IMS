import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Printer } from "lucide-react";
import api from "@/lib/axios-instance";
import { toast } from "sonner";
import { LoadingSpinner } from "../ui/spinner";

interface IntimationStudent {
    idNumber: string;
    name: string;
    attempt: string;
    qualifyingArea1: string;
    qualifyingArea2: string;
}

interface IntimationData {
    examStartDate: string | null;
    examEndDate: string | null;
    students: IntimationStudent[];
}

interface GenerateFormsPanelProps {
  selectedExamEventId: number | null;
}

export const GenerateFormsPanel: React.FC<GenerateFormsPanelProps> = ({
  selectedExamEventId,
}) => {
  const { data: formData, isLoading } = useQuery<IntimationData>({
    queryKey: ["intimation-data", selectedExamEventId],
    queryFn: async () => {
      if (!selectedExamEventId) return { students: [] };
      const response = await api.get(
        `/phd/drcMember/exam-events/intimation-data/${selectedExamEventId}`
      );
      return response.data.formData;
    },
    enabled: !!selectedExamEventId,
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "TBD";
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handlePrint = () => {
    if (!formData) {
      toast.error("No form data available. Please generate the form first.");
      return;
    }
    const startDate = formatDate(formData.examStartDate);
    const endDate = formatDate(formData.examEndDate);
    const currentDate = formatDate(new Date().toISOString());

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow pop-ups to print the form");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Intimation to AGSRD for PhD Qualifying Examination</title>
          <style>
            body { margin: 40px; line-height: 1.5; font-family: Arial, sans-serif; }
            .underline { border-bottom: 1px solid; display: inline-block; width: 200px; margin: 0 5px; }
            table { width: 100%; margin-bottom: 20px; border-collapse: collapse; }
            table, th, td { border: 1px solid; }
            th, td { padding: 8px; text-align: center; vertical-align: middle; }
            .multiline-header { line-height: 1.2; }
            .header-section { text-align: center; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="header-section">
            <h2>Intimation to AGSRD for PhD Qualifying Examination</h2>
            <p>
              BIRLA INSTITUTE OF TECHNOLOGY AND SCIENCE PILANI,<br />
              HYDERABAD CAMPUS<br />
              DEPARTMENT OF COMPUTER SCIENCE & INFORMATION SYSTEMS
            </p>
            <p>Date: ${currentDate}</p>
            <p>
              To,<br />
              Associate Dean, AGSRD<br />
              BITS Pilani, Hyderabad campus.
            </p>
            <p>The Department will be conducting PhD qualifying examination as per following-</p>
          </div>
          <p>1. Date of Examination - From. <span class="underline">${startDate}</span> to. <span class="underline">${endDate}</span></p>
          <p>2. List of candidates who will be appearing in the examination-</p>
          <table>
            <thead>
              <tr>
                <th>Sl No</th>
                <th class="multiline-header">ID No</th>
                <th>Name</th>
                <th class="multiline-header">First attempt/<br />second Attempt</th>
                <th class="multiline-header">Name of two PhD<br />qualifying areas</th>
              </tr>
            </thead>
            <tbody>
              ${formData.students
                .map(
                  (student, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${student.idNumber}</td>
                  <td>${student.name}</td>
                  <td>${student.attempt}</td>
                  <td>
                    1. <span class="underline" style="width: 150px">${student.qualifyingArea1 || ""}</span><br />
                    2. <span class="underline" style="width: 150px">${student.qualifyingArea2 || ""}</span>
                  </td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
          <br />
          <p>(Name)<br />(DRC Convener)<br />Date: </p>
          <br />
          <p>(Name)<br />(HOD)<br />Date: </p>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              }
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!selectedExamEventId) {
    return (
      <Alert>
        <AlertDescription>
          Please select an exam event from the Applications tab to generate forms.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return <div className="py-8 text-center"><LoadingSpinner /></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate Qualifying Exam Form</CardTitle>
        </CardHeader>
        <CardContent>
          {!formData || formData.students.length === 0 ? (
            <div className="py-8 text-center">
              <p>No applications found for this exam event.</p>
              <p className="text-sm text-muted-foreground">
                Students need to submit applications first.
              </p>
            </div>
          ) : (
            <>
              <Alert className="mb-4">
                <AlertDescription>
                  Exam Period: <strong>{formatDate(formData.examStartDate)}</strong> to <strong>{formatDate(formData.examEndDate)}</strong>
                </AlertDescription>
              </Alert>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>ID Number</TableHead>
                    <TableHead>Qualifying Areas</TableHead>
                    <TableHead>Attempt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formData.students.map((student, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.idNumber}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">1. {student.qualifyingArea1}</div>
                          <div className="text-sm">2. {student.qualifyingArea2}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{student.attempt}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-6 flex justify-end">
                <Button onClick={handlePrint} variant="default">
                  <Printer className="mr-2 h-4 w-4" />
                  Print Form
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};