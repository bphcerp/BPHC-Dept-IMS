import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// Interfaces
interface IStudent {
  name: string;
  email: string;
  erpId: string;
  formName: string;
  fileUrl: string | null;
  uploadedAt: string;
  examStatus: boolean | null;
  examDate: string | null;
  qualifyingArea1: string | null;
  qualifyingArea2: string | null;
}

interface IQualifyingExam {
  id: number;
  examName: string;
  deadline: string;
  students: IStudent[];
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

interface IExamStatus {
  email: string;
  qualifyingExam1: boolean | null;
  qualifyingExam2: boolean | null;
  qualifyingExam1StartDate: string | null;
  qualifyingExam2StartDate: string | null;
  qualifyingExam1EndDate: string | null;
  qualifyingExam2EndDate: string | null;
}

interface IExamStatusResponse {
  success: boolean;
  examStatuses: IExamStatus[];
}

interface IQualificationDate {
  email: string;
  name: string;
  qualificationDate: string | null;
  examStatus: boolean | null;
}

interface IQualificationDatesResponse {
  success: boolean;
  qualificationDates: IQualificationDate[];
}

interface IUpdateExamResult {
  email: string;
  ifPass: boolean;
}

interface IUpdateExamDate {
  email: string;
  qualificationDate: string;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const formatISODate = (dateString: string | null) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : "";
};

const PhdThatAppliedForQualifyingExam: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const [examResults, setExamResults] = useState<IUpdateExamResult[]>([]);
  const [examDates, setExamDates] = useState<IUpdateExamDate[]>([]);
  const [studentStatus, setStudentStatus] = useState<Record<string, boolean | null>>({});
  const [studentDates, setStudentDates] = useState<Record<string, string | null>>({});

  // Fetch main application data
  const { data, isLoading } = useQuery({
    queryKey: ["phd-qualifying-exam-applications"],
    queryFn: async () => {
      const response = await api.get<IPhdApplicationsResponse>(
        "/phd/drcMember/getPhdDataOfWhoFilledApplicationForm"
      );
      if (response.data.success && response.data.semestersWithExams.length > 0) {
        setSelectedSemester(response.data.semestersWithExams[0].id);
      }
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch exam status data
  const { data: examStatusData } = useQuery({
    queryKey: ["phd-exam-statuses"],
    queryFn: async () => {
      const response = await api.get<IExamStatusResponse>(
        "/phd/drcMember/getPhdExamStatus"
      );
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch qualification dates data
  const { data: qualificationDatesData } = useQuery({
    queryKey: ["phd-qualification-dates"],
    queryFn: async () => {
      const response = await api.get<IQualificationDatesResponse>(
        "/phd/drcMember/getQualificationDates"
      );
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });

  // Initialize student status and dates based on API data
  useEffect(() => {
    if (examStatusData?.examStatuses) {
      const newStatusMap: Record<string, boolean | null> = {};
      
      examStatusData.examStatuses.forEach(status => {
        // Determine exam status based on both start and end dates
        let examStatus: boolean | null = null;
        
        // Check Exam 2 first (if both start and end dates exist)
        if (status.qualifyingExam2StartDate && status.qualifyingExam2EndDate) {
          examStatus = status.qualifyingExam2;
        } 
        // If Exam 2 not complete, check Exam 1
        else if (status.qualifyingExam1StartDate && status.qualifyingExam1EndDate) {
          examStatus = status.qualifyingExam1;
        }
        
        newStatusMap[status.email] = examStatus;
      });
      
      setStudentStatus(newStatusMap);
    }
    
    // Handle qualification dates (unchanged)
    if (qualificationDatesData?.qualificationDates) {
      const newDatesMap: Record<string, string | null> = {};
      
      qualificationDatesData.qualificationDates.forEach(item => {
        newDatesMap[item.email] = item.qualificationDate;
      });
      
      setStudentDates(newDatesMap);
    }
  }, [examStatusData, qualificationDatesData]);

  // Process data to include status and dates in student objects
  const processedData = React.useMemo(() => {
    if (!data?.semestersWithExams) return null;
    
    const processed = {
      ...data,
      semestersWithExams: data.semestersWithExams.map(semester => ({
        ...semester,
        exams: semester.exams.map(exam => ({
          ...exam,
          students: exam.students.map(student => ({
            ...student,
            examStatus: studentStatus[student.email] ?? student.examStatus ?? null,
            examDate: studentDates[student.email] ?? student.examDate ?? null
          }))
        }))
      }))
    };
    
    return processed;
  }, [data, studentStatus, studentDates]);

  const updateExamResultsMutation = useMutation({
    mutationFn: async () => {
      return await api.post(
        "/phd/drcMember/updateQualifyingExamResultsOfAllStudents",
        examResults
      );
    },
    onSuccess: (response) => {
      toast.success("Exam results updated successfully");
      
      // Update local state with new status values
      if (response.data.updatedStudents) {
        const newStatusMap = { ...studentStatus };
        
        response.data.updatedStudents.forEach((student: any) => {
          if ('qualifyingExam1' in student) {
            newStatusMap[student.email] = student.qualifyingExam1;
          } else if ('qualifyingExam2' in student) {
            newStatusMap[student.email] = student.qualifyingExam2;
          }
        });
        
        setStudentStatus(newStatusMap);
      }
      
      queryClient.invalidateQueries({ queryKey: ["phd-exam-statuses"] });
      setExamResults([]);
    },
    onError: () => {
      toast.error("Failed to update exam results");
    }
  });

  const updateExamDatesMutation = useMutation({
    mutationFn: async () => {
      // Convert the date string to a valid ISO string format before sending
      const formattedDates = examDates.map(item => ({
        email: item.email,
        // Ensure date is in ISO format with proper timezone handling
        qualificationDate: new Date(item.qualificationDate).toISOString()
      }));
      
      return await api.patch(
        "/phd/drcMember/updatePassingDatesOfPhd",
        formattedDates
      );
    },
    onSuccess: (response) => {
      toast.success("Qualification dates updated successfully");
      
      // Update local state with new date values
      if (response.data.updatedStudents) {
        const newDatesMap = { ...studentDates };
        
        response.data.updatedStudents.forEach((student: any) => {
          if (student.qualificationDate) {
            newDatesMap[student.email] = student.qualificationDate;
          }
        });
        
        setStudentDates(newDatesMap);
      }
      
      queryClient.invalidateQueries({ queryKey: ["phd-qualification-dates"] });
      setExamDates([]);
    },
    onError: (error) => {
      console.error("Update error:", error);
      toast.error("Failed to update qualification dates");
    }
  });

  if (isLoading) {
    return <LoadingSpinner className="mx-auto mt-10" />;
  }

  if (!processedData?.success || !processedData.semestersWithExams.length) {
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

  const currentSemester = processedData.semestersWithExams.find(sem => sem.id === selectedSemester) || processedData.semestersWithExams[0];

  const handleStatusChange = (email: string, status: string) => {
    const ifPass = status === 'pass';
    
    // Update local state immediately for UI feedback
    setStudentStatus(prev => ({
      ...prev,
      [email]: ifPass
    }));
    
    // Add to changes that will be sent to server
    setExamResults(prev => {
      const newResults = prev.filter(result => result.email !== email);
      newResults.push({ email, ifPass });
      return newResults;
    });
  };

  const handleDateChange = (email: string, date: string) => {
    if (!date) return;
    
    // Update local state immediately for UI feedback
    setStudentDates(prev => ({
      ...prev,
      [email]: date
    }));
    
    // Add to changes that will be sent to server
    setExamDates(prev => {
      const newDates = prev.filter(item => item.email !== email);
      newDates.push({
        email,
        qualificationDate: date
      });
      return newDates;
    });
  };

  const saveChanges = () => {
    if (examResults.length > 0) {
      updateExamResultsMutation.mutate();
    }
    if (examDates.length > 0) {
      updateExamDatesMutation.mutate();
    }
    if (examResults.length === 0 && examDates.length === 0) {
      toast.info("No changes to save");
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-6xl">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Qualifying Exam Applications</h2>
            <div className="flex gap-4">
              <Select
                value={selectedSemester?.toString() || currentSemester.id.toString()}
                onValueChange={(value) => setSelectedSemester(parseInt(value))}
              >
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Select Semester" />
                </SelectTrigger>
                <SelectContent>
                  {processedData.semestersWithExams.map((semester) => (
                    <SelectItem key={semester.id} value={semester.id.toString()}>
                      {semester.year}-Semester {semester.semesterNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={saveChanges}
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={updateExamResultsMutation.isLoading || updateExamDatesMutation.isLoading}
              >
                {(updateExamResultsMutation.isLoading || updateExamDatesMutation.isLoading)
                  ? "Saving..."
                  : "Save Changes"}
              </Button>
            </div>
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
                            <TableHead className="w-1/7">Student Name</TableHead>
                            <TableHead className="w-1/7">Email</TableHead>
                            <TableHead className="w-1/7">ERP ID</TableHead>
                            <TableHead className="w-1/7">Application Form</TableHead>
                            <TableHead className="w-1/7">Submitted On</TableHead>
                            <TableHead className="w-1/7">Status</TableHead>
                            <TableHead className="w-1/7">Qualification Date</TableHead>
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
                              {student.fileUrl ? (
                                <Button variant="link" className="text-blue-600" asChild>
                                  <a href={student.fileUrl} target="_blank" rel="noopener noreferrer">
                                    {student.formName}
                                  </a>
                                </Button>
                              ) : (
                                <span className="text-gray-500">
                                  No form available (ID: {student.erpId})
                                </span>
                              )}
                              </TableCell>
                              <TableCell>
                                {formatDate(student.uploadedAt)}
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={student.examStatus === true ? "pass" : student.examStatus === false ? "fail" : ""}
                                  onValueChange={(value) => handleStatusChange(student.email, value)}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select Status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pass">Pass</SelectItem>
                                    <SelectItem value="fail">Fail</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="date"
                                  disabled={student.examStatus !== true}
                                  value={formatISODate(student.examDate)}
                                  onChange={(e) => handleDateChange(student.email, e.target.value)}
                                  className="w-full"
                                />
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