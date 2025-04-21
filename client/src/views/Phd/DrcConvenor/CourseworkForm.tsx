import React, { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { LoadingSpinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface IPhdCourseworkQuery {
  success: boolean;
  formData: {
    name: string;
    email: string;
    courses: { name: string; units: string }[];
  }[];
  formLink: string;
}

const PhdStudentCoursework: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["phd-students-coursework"],
    queryFn: async () => {
      const response = await api.get<IPhdCourseworkQuery>(
        "/phd/drcMember/generateCourseworkForm"
      );
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });

  const printRef = useRef<HTMLDivElement>(null);

  if (isLoading) {
    return <LoadingSpinner className="mx-auto mt-10" />;
  }

  // Function to trigger print
  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open("", "_blank");
      printWindow?.document.write(`
        <html>
        <head>
          <title>PhD Coursework Form</title>
          <style>
            @media print {
              body { font-family: Arial, sans-serif; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid black; padding: 5px; text-align: left; }
              .no-print { display: none; } /* Hide buttons when printing */
            }
          </style>
        </head>
        <body>
          ${printRef.current.innerHTML}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); }
            }
          </script>
        </body>
        </html>
      `);
      printWindow?.document.close();
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-4xl">
        <CardContent className="p-6">
          <h2 className="mb-4 flex items-center text-xl font-bold">
            PhD Students Coursework
            <Button
              onClick={handlePrint}
              className="no-print ml-3 bg-blue-600 text-white hover:bg-blue-700"
            >
              <Printer className="mr-1 h-4 w-4" />
              Print
            </Button>
          </h2>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Units</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.formData.map((student) => (
                <React.Fragment key={student.email}>
                  {student.courses.length > 0 ? (
                    student.courses.map((course, index) => (
                      <TableRow key={`${student.email}-${index}`}>
                        {index === 0 && (
                          <TableCell
                            rowSpan={student.courses.length}
                            className="font-medium"
                          >
                            {student.name}
                          </TableCell>
                        )}
                        <TableCell>{course.name}</TableCell>
                        <TableCell>{course.units ?? "N/A"}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell className="font-medium">
                        {student.name}
                      </TableCell>
                      <TableCell colSpan={2} className="text-center">
                        No coursework available
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Hidden Printable Template */}
      <div ref={printRef} style={{ display: "none" }}>
        <div style={{ textAlign: "center", fontWeight: "bold" }}>
          BIRLA INSTITUTE OF TECHNOLOGY AND SCIENCE PILANI
        </div>
        <div style={{ textAlign: "center", fontWeight: "bold" }}>
          DEPARTMENT OF __________________
        </div>
        <p>Date: ______________</p>
        <p>To,</p>
        <p>Associate Dean, AGSRD</p>
        <p>BITS Pilani, ______________ campus.</p>
        <p>
          The suggested course package for the following PhD candidates is given
          below:
        </p>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid black", padding: "5px" }}>
                Sr. No.
              </th>
              <th style={{ border: "1px solid black", padding: "5px" }}>
                Name
              </th>
              <th style={{ border: "1px solid black", padding: "5px" }}>
                Courses
              </th>
              <th style={{ border: "1px solid black", padding: "5px" }}>
                Units
              </th>
            </tr>
          </thead>
          <tbody>
            {data?.formData.map((student, index) => (
              <tr key={student.email}>
                <td style={{ border: "1px solid black", padding: "5px" }}>
                  {index + 1}
                </td>
                <td style={{ border: "1px solid black", padding: "5px" }}>
                  {student.name}
                </td>
                <td style={{ border: "1px solid black", padding: "5px" }}>
                  {student.courses.map((c) => c.name).join(", ")}
                </td>
                <td style={{ border: "1px solid black", padding: "5px" }}>
                  {student.courses.map((c) => c.units).join(", ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: "40px" }}>
          <p>(Name) ____________ (DRC Convener)</p>
          <p>Date: ______________</p>
          <p>(Name) ____________ (HOD)</p>
        </div>
      </div>
    </div>
  );
};

export default PhdStudentCoursework;
