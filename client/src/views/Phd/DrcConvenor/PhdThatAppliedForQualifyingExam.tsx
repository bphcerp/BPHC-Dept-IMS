import React, { useState } from "react";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


interface IQualifyingExam {
  id: number;
  examName: string;
  deadline: string;
  students: {
    name: string;
    email: string;
    erpId: string;
    fileUrl: string;
    formName: string;
    uploadedAt: string;
  }[];
}

interface ISemester {
  id: number;
  year: number;
  semesterNumber: number;
  startDate: string;
  endDate: string;
  exams: IQualifyingExam[];
}

interface IPhdApplicationsResponse {
  success: boolean;
  semestersWithExams: ISemester[];
}

// Helper to format date using toLocaleString
const formatDate = (dateString : string) => {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const PhdThatAppliedForQualifyingExam: React.FC = () => {
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  
  const { data, isLoading } = useQuery({
    queryKey: ["phd-qualifying-exam-applications"],
    queryFn: async () => {
      const response = await api.get<IPhdApplicationsResponse>(
        "/phd/drcMember/getPhdDataOfWhoFilledApplicationForm"
      );
      
      // Automatically select the first semester if available
      if (response.data.success && response.data.semestersWithExams.length > 0) {
        setSelectedSemester(response.data.semestersWithExams[0].id);
      }
      
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return <LoadingSpinner className="mx-auto mt-10" />;
  }

  if (!data?.success || !data.semestersWithExams.length) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
        <Card className="w-full max-w-4xl">
          <CardContent className="p-6">
            <h2 className="mb-4 text-xl font-bold">Qualifying Exam Applications</h2>
            <div className="text-center py-4">No qualifying exams or applications found</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentSemester = data.semestersWithExams.find(sem => sem.id === selectedSemester) || data.semestersWithExams[0];

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-4xl">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Qualifying Exam Applications</h2>
            
            <Select
              value={selectedSemester?.toString() || currentSemester.id.toString()}
              onValueChange={(value) => setSelectedSemester(parseInt(value))}
            >
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Select Semester" />
              </SelectTrigger>
              <SelectContent>
                {data.semestersWithExams.map((semester) => (
                  <SelectItem key={semester.id} value={semester.id.toString()}>
                    {semester.year} - Semester {semester.semesterNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {currentSemester.exams.length === 0 ? (
            <div className="text-center py-4">
              No qualifying exams found for this semester
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {currentSemester.exams.map((exam) => (
                <AccordionItem key={exam.id} value={exam.id.toString()}>
                  <AccordionTrigger className="px-4 py-2 hover:bg-gray-50 rounded-lg">
                    <div className="flex w-full justify-between pr-4">
                      <span>{exam.examName}</span>
                      <span className="text-gray-500">
                        Deadline: {formatDate(exam.deadline)}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {exam.students.length === 0 ? (
                      <div className="text-center py-4">
                        No applications found for this exam
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-1/5">Student Name</TableHead>
                            <TableHead className="w-1/5">Email</TableHead>
                            <TableHead className="w-1/5">ERP ID</TableHead>
                            <TableHead className="w-1/5">Application Form</TableHead>
                            <TableHead className="w-1/5">Submitted On</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {exam.students.map((student) => (
                            <TableRow key={`${exam.id}-${student.email}`}>
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
                              <TableCell>
                                {formatDate(student.uploadedAt)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PhdThatAppliedForQualifyingExam;