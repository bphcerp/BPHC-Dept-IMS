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
import { Button } from "@/components/ui/button";

interface IPhdApplicationQuery {
  success: boolean;
  applications: {
    name: string;
    email: string;
    erpId: string;
    fileUrl: string;
    formName: string;
  }[];
}

const PhdThatAppliedForQualifyingExam: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["phd-qualifying-exam-applications"],
    queryFn: async () => {
      const response = await api.get<IPhdApplicationQuery>(
        "/phd/drcMember/getPhdDataToGeneratePhdQualifyingExamForm"
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
            Qualifying Exam Applications
          </h2>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/5">Student Name</TableHead>
                <TableHead className="w-1/5">Email</TableHead>
                <TableHead className="w-1/5">ERP ID</TableHead>
                <TableHead className="w-1/5">Application Form</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.applications.length ? (
                data.applications.map((student) => (
                  <TableRow key={student.email}>
                    <TableCell className="font-medium">
                      {student.name}
                    </TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{student.erpId}</TableCell>
                    <TableCell>
                      <Button variant="link" className="text-blue-600" asChild>
                        <a
                          href={student.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {student.formName}
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No applications found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PhdThatAppliedForQualifyingExam;
