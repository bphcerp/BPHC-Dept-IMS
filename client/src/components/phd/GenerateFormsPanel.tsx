import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Printer, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface Student {
  name: string;
  email: string;
  area1: string | null;
  area2: string | null;
  idNumber: string;
  numberOfQeApplication: number | null;
}

interface QualifyingStudentsResponse {
  success: boolean;
  students: Student[];
  examInfo?: {
    id: number;
    examName: string;
    deadline: string;
    semesterId: number;
    semesterYear: number;
    semesterNumber: number;
  };
}

interface ExamDateResponse {
  success: boolean;
  exam: {
    id?: number;
    examName?: string;
    examStartDate: string;
    examEndDate: string;
  };
}

interface GenerateFormsPanelProps {
  selectedSemester: number | null;
  onNext: () => void;
  onBack: () => void;
}

const GenerateFormsPanel: React.FC<GenerateFormsPanelProps> = ({
  onNext,
  onBack,
}) => {
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [formData, setFormData] = useState<{
    students: Student[];
    examStartDate: string;
    examEndDate: string;
  } | null>(null);

  // Fetch students who can be included in qualifying exam form
  const { data, isLoading } = useQuery<QualifyingStudentsResponse, Error>({
    queryKey: ["phd-qualifying-students"],
    queryFn: async () => {
      const response = await api.get<QualifyingStudentsResponse>(
        "/phd/drcMember/getPhdToGenerateQualifyingExamForm"
      );
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch exam dates for the selected semester
  const { data: examDatesData } = useQuery<ExamDateResponse, Error>({
    queryKey: ["phd-qualifying-exam-dates", data?.examInfo?.semesterId],
    queryFn: async () => {
      if (data?.examInfo?.semesterId) {
        const response = await api.get<ExamDateResponse>(
          `/phd/drcMember/getDatesOfQeExam/${data.examInfo.semesterId}`
        );
        return response.data;
      }
      return { success: false, exam: { examStartDate: "", examEndDate: "" } };
    },
    enabled: !!data?.examInfo?.semesterId,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const handleSelectAll = () => {
    if (data?.students) {
      if (selectedStudents.length === data.students.length) {
        setSelectedStudents([]);
      } else {
        setSelectedStudents(data.students.map((student) => student.email));
      }
    }
  };

  const handleSelectStudent = (email: string) => {
    if (selectedStudents.includes(email)) {
      setSelectedStudents(selectedStudents.filter((id) => id !== email));
    } else {
      setSelectedStudents([...selectedStudents, email]);
    }
  };

  const generateForm = () => {
    if (!examDatesData?.exam || selectedStudents.length === 0) {
      toast.error("Please select students and ensure exam dates are available");
      return;
    }

    if (data?.students) {
      const selectedStudentsData = data.students.filter((student) =>
        selectedStudents.includes(student.email)
      );

      setFormData({
        students: selectedStudentsData,
        examStartDate: examDatesData.exam.examStartDate,
        examEndDate: examDatesData.exam.examEndDate,
      });
    }
  };

  const formatDate = (dateString: string) => {
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
            CAMPUS<br />
            DEPARTMENT OF &emsp;
          </p>
          <p>Date: ${currentDate}</p>
          <p>
            To,<br />
            Associate Dean, AGSRD<br />
            BITS Pilani, &emsp; campus.
          </p>
          <p>
            The Department will be conducting PhD qualifying examination as per following-
          </p>
        </div>

        <p>
          1. Date of Examination - From. <span class="underline">${startDate}</span> to. <span class="underline">${endDate}</span>
        </p>

        <p>2. List of candidates who will be appearing in the examination-</p>
        <table>
          <thead>
            <tr>
              <th>Sl No</th>
              <th class="multiline-header">
                ID No/<br />
                Application No/<br />
                PSRN
              </th>
              <th>Name</th>
              <th class="multiline-header">
                First attempt/<br />
                second Attempt
              </th>
              <th class="multiline-header">
                Name of two PhD<br />
                qualifying areas
              </th>
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
                  <td>${
                    (student.numberOfQeApplication || 1) > 1
                      ? "Second Attempt"
                      : "First Attempt"
                  }</td>
                  <td>
                    1. <span class="underline" style="width: 150px">${
                      student.area1 || ""
                    }</span><br />
                    2. <span class="underline" style="width: 150px">${
                      student.area2 || ""
                    }</span>
                  </td>
                </tr>
              `
              )
              .join("")}
          </tbody>
        </table>
        <br />
        <p>(Name)<br />(DRC Convener)<br /> Date: </p>
        <br />
        <p>(Name)<br />(HOD)<br /> Date: </p>

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

  if (isLoading) {
    return <div className="py-8 text-center">Loading student data...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Generate Qualifying Exam Form</h2>

      {data?.examInfo && (
        <Alert>
          <AlertDescription>
            Current exam: <strong>{data.examInfo.examName}</strong> | Deadline:{" "}
            <strong>{formatDate(data.examInfo.deadline)}</strong> | Semester:{" "}
            <strong>
              {data.examInfo.semesterYear}-{data.examInfo.semesterNumber}
            </strong>
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={
                    data?.students &&
                    data.students.length > 0 &&
                    selectedStudents.length === data.students.length
                  }
                  onChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>ID Number</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Area 1</TableHead>
              <TableHead>Area 2</TableHead>
              <TableHead>Attempt</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.students && data.students.length > 0 ? (
              data.students.map((student) => (
                <TableRow key={student.email}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.email)}
                      onChange={() => handleSelectStudent(student.email)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>{student.idNumber}</TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>{student.area1 || "-"}</TableCell>
                  <TableCell>{student.area2 || "-"}</TableCell>
                  <TableCell>{student.numberOfQeApplication || 1}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No qualifying students found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-6 flex justify-between">
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Applications
        </Button>

        <div className="flex gap-4">
          <Button
            onClick={generateForm}
            disabled={
              selectedStudents.length === 0 ||
              !examDatesData?.exam?.examStartDate ||
              !examDatesData?.exam?.examEndDate
            }
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            Generate Form
          </Button>

          {formData && (
            <Button
              onClick={handlePrint}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              <Printer className="mr-2 h-4 w-4" /> Print Form
            </Button>
          )}
        </div>

        <Button onClick={onNext} className="bg-blue-600 hover:bg-blue-700">
          Next: Examiner Management <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default GenerateFormsPanel;
