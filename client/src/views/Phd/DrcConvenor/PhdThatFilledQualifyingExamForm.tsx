import React from "react";
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

interface IPhdQualifyingExamQuery {
  success: boolean;
  students: {
    name: string;
    email: string;
    area1: string;
    area2: string;
    idNumber: string;
  }[];
}

const StudentsFillingQualifyingExam: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["phd-qualifying-exam-students"],
    queryFn: async () => {
      const response = await api.get<IPhdQualifyingExamQuery>(
        "/phd/drcMember/getPhdThatFilledQualifyingExamApplicationForm"
      );
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return <LoadingSpinner className="mx-auto mt-10" />;
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-[1000px]">
        <CardContent className="p-6">
          <h2 className="mb-4 text-xl font-bold">
            PhD Students Applying for Qualifying Exam
            <Button
              disabled
              onClick={() => window.print()}
              className="m-2 ml-3 bg-blue-600 text-white hover:bg-blue-700"
            >
              <Printer className="inline-block h-6 w-6" />
            </Button>
          </h2>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/5">Student Name</TableHead>
                <TableHead className="w-1/5">Email</TableHead>
                <TableHead className="w-1/5">ID Number</TableHead>
                <TableHead className="w-1/5">Area 1</TableHead>
                <TableHead className="w-1/5">Area 2</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.students.map((student) => (
                <TableRow key={student.email}>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>{student.idNumber}</TableCell>
                  <TableCell>{student.area1}</TableCell>
                  <TableCell>{student.area2}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentsFillingQualifyingExam;
