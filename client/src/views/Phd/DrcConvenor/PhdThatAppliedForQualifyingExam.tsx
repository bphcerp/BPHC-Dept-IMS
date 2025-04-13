import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
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
  numberOfQeApplication: number;
  qualifyingExam1StartDate: string | null;
  qualifyingExam2StartDate: string | null;
  qualifyingExam1EndDate: string | null;
  qualifyingExam2EndDate: string | null;
}

// interface IExamStatusResponse {
//   success: boolean;
//   examStatuses: IExamStatus[];
// }

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

interface IExamDatesResponse {
  success: boolean;
  exam: {
    id: number;
    examName: string;
    examStartDate: string;
    examEndDate: string;
  };
}

// Utility functions
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatISODate = (dateString: string | null) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return !isNaN(date.getTime()) ? date.toISOString().split("T")[0] : "";
};

const PhdThatAppliedForQualifyingExam: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const [examResults, setExamResults] = useState<IUpdateExamResult[]>([]);
  const [examDates, setExamDates] = useState<IUpdateExamDate[]>([]);
  const [studentStatus, setStudentStatus] = useState<
    Record<
      string,
      {
        status: boolean | null;
        numberOfQeApplication: number;
      }
    >
  >({});
  const [studentDates, setStudentDates] = useState<
    Record<string, string | null>
  >({});
  const [dateValidationErrors, setDateValidationErrors] = useState<
    Record<string, string | null>
  >({});

  // Fetch main application data
  const { data, isLoading } = useQuery({
    queryKey: ["phd-qualifying-exam-applications"],
    queryFn: async () => {
      const response = await api.get<IPhdApplicationsResponse>(
        "/phd/drcMember/getPhdDataOfWhoFilledApplicationForm"
      );
      if (
        response.data.success &&
        response.data.semestersWithExams.length > 0
      ) {
        setSelectedSemester(response.data.semestersWithExams[0].id);
      }
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch exam status data
  const { data: examStatusData } = useQuery<{
    success: boolean;
    examStatuses: IExamStatus[];
  }>({
    queryKey: ["phd-exam-statuses"],
    queryFn: async () => {
      const response = await api.get("/phd/drcMember/getPhdExamStatus");
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

  // Fetch exam dates for validation
  const { data: examDateData } = useQuery<IExamDatesResponse>({
    queryKey: ["qualifying-exam-dates", selectedSemester],
    queryFn: async () => {
      if (!selectedSemester) return { success: false, exam: null };
      const response = await api.get(
        `/phd/drcMember/getDatesOfQeExam/${selectedSemester}`
      );
      return response.data;
    },
    enabled: !!selectedSemester,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });

  // Initialize student status based on API data
  useEffect(() => {
    if (examStatusData?.examStatuses) {
      const newStatusMap: Record<
        string,
        {
          status: boolean | null;
          numberOfQeApplication: number;
        }
      > = {};

      examStatusData.examStatuses.forEach((status) => {
        let examStatus: boolean | null = null;

        // Determine exam status based on number of QE applications
        if (status.numberOfQeApplication === 1) {
          // For first QE application
          examStatus = status.qualifyingExam1;
        } else if (status.numberOfQeApplication === 2) {
          // For second QE application
          examStatus = status.qualifyingExam2;
        }

        newStatusMap[status.email] = {
          status: examStatus,
          numberOfQeApplication: status.numberOfQeApplication,
        };
      });

      setStudentStatus(newStatusMap);
    }

    // Handle qualification dates
    if (qualificationDatesData?.qualificationDates) {
      const newDatesMap: Record<string, string | null> = {};

      qualificationDatesData.qualificationDates.forEach((item) => {
        newDatesMap[item.email] = item.qualificationDate;
      });

      setStudentDates(newDatesMap);
    }
  }, [examStatusData, qualificationDatesData]);

  // Validate all dates whenever examDateData changes
  useEffect(() => {
    if (examDateData?.success && examDateData.exam?.examEndDate) {
      const examEndDate = new Date(examDateData.exam.examEndDate);
      const errors: Record<string, string | null> = {};

      // Check all current dates against the exam end date
      Object.entries(studentDates).forEach(([email, dateStr]) => {
        if (dateStr) {
          const qualificationDate = new Date(dateStr);
          if (qualificationDate <= examEndDate) {
            errors[email] =
              `Date must be after ${formatDate(examDateData.exam.examEndDate)}`;
          } else {
            errors[email] = null;
          }
        }
      });

      setDateValidationErrors(errors);
    }
  }, [examDateData, studentDates]);

  // Process data to include status and dates in student objects
  const processedData = useMemo(() => {
    if (!data?.semestersWithExams) return null;

    const processed = {
      ...data,
      semestersWithExams: data.semestersWithExams.map((semester) => ({
        ...semester,
        exams: semester.exams.map((exam) => ({
          ...exam,
          students: exam.students.map((student) => {
            const studentStatusInfo = studentStatus[student.email];
            return {
              ...student,
              examStatus: studentStatusInfo?.status ?? null,
              examDate: studentDates[student.email] ?? student.examDate ?? null,
            };
          }),
        })),
      })),
    };

    return processed;
  }, [data, studentStatus, studentDates]);

  // Check if a date is valid (after exam end date)
  const isDateValid = (date: string) => {
    if (!examDateData?.success || !examDateData.exam?.examEndDate) return true;

    const examEndDate = new Date(examDateData.exam.examEndDate);
    const qualificationDate = new Date(date);

    return qualificationDate > examEndDate;
  };

  // Mutation for updating exam results
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
          const existingRecord = newStatusMap[student.email];

          // Update the status based on existing record
          if (existingRecord) {
            newStatusMap[student.email] = {
              ...existingRecord,
              status:
                "qualifyingExam1" in student
                  ? student.qualifyingExam1
                  : student.qualifyingExam2,
            };
          }
        });

        setStudentStatus(newStatusMap);
      }

      void queryClient.invalidateQueries({ queryKey: ["phd-exam-statuses"] });
      setExamResults([]);
    },
    onError: () => {
      toast.error("Failed to update exam results");
    },
  });

  // Mutation for updating exam dates
  const updateExamDatesMutation = useMutation({
    mutationFn: async () => {
      // Filter out any invalid dates before sending
      const validDates = examDates.filter((item) =>
        isDateValid(item.qualificationDate)
      );

      // Convert the date string to a valid ISO string format before sending
      const formattedDates = validDates.map((item) => ({
        email: item.email,
        // Ensure date is in ISO format with proper timezone handling
        qualificationDate: new Date(item.qualificationDate).toISOString(),
      }));

      return await api.post(
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
            newDatesMap[student.email] =
              student.qualificationDate.toISOString();
          }
        });

        setStudentDates(newDatesMap);
      }

      void queryClient.invalidateQueries({
        queryKey: ["phd-qualification-dates"],
      });
      setExamDates([]);
    },
    onError: (error) => {
      console.error("Update error:", error);
      toast.error("Failed to update qualification dates");
    },
  });

  // Handlers for status and date changes
  const handleStatusChange = (email: string, status: string) => {
    const ifPass = status === "pass";
    const numberOfQeApplication =
      studentStatus[email]?.numberOfQeApplication ?? 1;

    // Update local state immediately for UI feedback
    setStudentStatus((prev) => ({
      ...prev,
      [email]: {
        status: ifPass,
        numberOfQeApplication,
      },
    }));

    // Add to changes that will be sent to server
    setExamResults((prev) => {
      const newResults = prev.filter((result) => result.email !== email);
      newResults.push({ email, ifPass });
      return newResults;
    });
  };

  const handleDateChange = (email: string, date: string) => {
    if (!date) return;

    // Validate the date is after the exam end date
    if (!isDateValid(date)) {
      if (examDateData?.exam?.examEndDate) {
        setDateValidationErrors((prev) => ({
          ...prev,
          [email]: `Date must be after ${formatDate(examDateData.exam.examEndDate)}`,
        }));
      }

      // Still update the UI to show the invalid date (with error styling)
      setStudentDates((prev) => ({
        ...prev,
        [email]: date,
      }));

      // Don't add to changes that will be sent to server
      return;
    }

    // Clear any validation errors for this email
    setDateValidationErrors((prev) => ({
      ...prev,
      [email]: null,
    }));

    // Update local state immediately for UI feedback
    setStudentDates((prev) => ({
      ...prev,
      [email]: date,
    }));

    // Add to changes that will be sent to server
    setExamDates((prev) => {
      const newDates = prev.filter((item) => item.email !== email);
      newDates.push({
        email,
        qualificationDate: date,
      });
      return newDates;
    });
  };

  // Save changes function
  const saveChanges = () => {
    // Check for invalid dates
    const hasInvalidDates = Object.values(dateValidationErrors).some(
      (error) => error !== null
    );

    if (hasInvalidDates) {
      toast.error("Please fix the invalid qualification dates before saving");
      return;
    }

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

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-8 text-center text-3xl font-bold text-gray-900">
            PhD Application Forms
          </h1>
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-center text-lg">
              There are currently no students who applied.
            </p>
            <p className="mt-2 text-center text-gray-500">
              Wait till students have applied
            </p>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!processedData?.success || !processedData.semestersWithExams.length) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
        <Card className="w-full max-w-4xl">
          <CardContent className="p-6">
            <h2 className="mb-4 text-xl font-bold">
              Qualifying Exam Applications
            </h2>
            <div className="py-4 text-center">
              No qualifying exams or applications found
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Select current semester
  const currentSemester =
    processedData.semestersWithExams.find(
      (sem) => sem.id === selectedSemester
    ) || processedData.semestersWithExams[0];

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-6xl">
        <CardContent className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold">Qualifying Exam Applications</h2>
            <div className="flex gap-4">
              <Select
                value={
                  selectedSemester?.toString() || currentSemester.id.toString()
                }
                onValueChange={(value) => setSelectedSemester(parseInt(value))}
              >
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Select Semester" />
                </SelectTrigger>
                <SelectContent>
                  {processedData.semestersWithExams.map((semester) => (
                    <SelectItem
                      key={semester.id}
                      value={semester.id.toString()}
                    >
                      {semester.year}-Semester {semester.semesterNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={saveChanges}
                className="bg-green-600 text-white hover:bg-green-700"
                disabled={
                  updateExamResultsMutation.isLoading ||
                  updateExamDatesMutation.isLoading ||
                  Object.values(dateValidationErrors).some(
                    (error) => error !== null
                  )
                }
              >
                {updateExamResultsMutation.isLoading ||
                updateExamDatesMutation.isLoading
                  ? "Saving..."
                  : "Save Changes"}
              </Button>
            </div>
          </div>

          {examDateData?.success && examDateData.exam && (
            <div className="mb-4 rounded-md bg-blue-50 p-3 text-blue-800">
              <p className="text-sm">
                <strong>Note:</strong> Qualification dates must be after the
                exam end date:
                <strong> {formatDate(examDateData.exam.examEndDate)}</strong>
              </p>
            </div>
          )}

          {currentSemester.exams.length === 0 ? (
            <div className="py-4 text-center">
              No qualifying exams found for this semester
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {currentSemester.exams.map((exam) => (
                <AccordionItem key={exam.id} value={exam.id.toString()}>
                  <AccordionTrigger className="rounded-lg px-4 py-2 hover:bg-gray-50">
                    <div className="flex w-full justify-between pr-4">
                      <span>{exam.examName}</span>
                      <span className="text-gray-500">
                        Deadline: {formatDate(exam.deadline)}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {exam.students.length === 0 ? (
                      <div className="py-4 text-center">
                        No applications found for this exam
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-1/7">
                              Student Name
                            </TableHead>
                            <TableHead className="w-1/7">Email</TableHead>
                            <TableHead className="w-1/7">ERP ID</TableHead>
                            <TableHead className="w-1/7">
                              Application Form
                            </TableHead>
                            <TableHead className="w-1/7">
                              Submitted On
                            </TableHead>
                            <TableHead className="w-1/7">Status</TableHead>
                            <TableHead className="w-1/7">
                              Qualification Date
                            </TableHead>
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
                                  <Button
                                    variant="link"
                                    className="text-blue-600"
                                    asChild
                                  >
                                    <a
                                      href={student.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
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
                                  value={
                                    student.examStatus === true
                                      ? "pass"
                                      : student.examStatus === false
                                        ? "fail"
                                        : ""
                                  }
                                  onValueChange={(value) =>
                                    handleStatusChange(student.email, value)
                                  }
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
                                <div className="space-y-1">
                                  <Input
                                    type="date"
                                    disabled={student.examStatus !== true}
                                    value={formatISODate(student.examDate)}
                                    min={
                                      examDateData?.exam?.examEndDate
                                        ? formatISODate(
                                            examDateData.exam.examEndDate
                                          )
                                        : undefined
                                    }
                                    onChange={(e) =>
                                      handleDateChange(
                                        student.email,
                                        e.target.value
                                      )
                                    }
                                    className={`w-full ${
                                      dateValidationErrors[student.email]
                                        ? "border-red-500 focus-visible:ring-red-500"
                                        : ""
                                    }`}
                                  />
                                  {dateValidationErrors[student.email] && (
                                    <p className="text-xs text-red-500">
                                      {dateValidationErrors[student.email]}
                                    </p>
                                  )}
                                </div>
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
