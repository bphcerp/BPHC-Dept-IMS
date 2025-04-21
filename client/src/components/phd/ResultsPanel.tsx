import React, { useState, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

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

interface ResultsPanelProps {
  selectedSemester: number | null;
  onBack: () => void;
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({
  selectedSemester,
  onBack,
}) => {
  const queryClient = useQueryClient();
  const [examResults, setExamResults] = useState<IUpdateExamResult[]>([]);
  const [examDates, setExamDates] = useState<IUpdateExamDate[]>([]);
  const [studentStatus, setStudentStatus] = useState<
    Record<string, { status: boolean | null; numberOfQeApplication: number }>
  >({});
  const [studentDates, setStudentDates] = useState<
    Record<string, string | null>
  >({});
  const [dateValidationErrors, setDateValidationErrors] = useState<
    Record<string, string | null>
  >({});

  // Fetch application data
  const { data, isLoading } = useQuery<IPhdApplicationsResponse, Error>({
    queryKey: ["phd-qualifying-exam-applications", selectedSemester],
    queryFn: async () => {
      const response = await api.get<IPhdApplicationsResponse>(
        "/phd/drcMember/getPhdDataOfWhoFilledApplicationForm"
      );
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch exam status data
  const { data: examStatusData } = useQuery<
    { success: boolean; examStatuses: IExamStatus[] },
    Error
  >({
    queryKey: ["phd-exam-statuses"],
    queryFn: async () => {
      const response = await api.get<{
        success: boolean;
        examStatuses: IExamStatus[];
      }>("/phd/drcMember/getPhdExamStatus");
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch qualification dates
  const { data: qualificationDatesData } = useQuery<
    IQualificationDatesResponse,
    Error
  >({
    queryKey: ["phd-qualification-dates"],
    queryFn: async () => {
      const response = await api.get<IQualificationDatesResponse>(
        "/phd/drcMember/getQualificationDates"
      );
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch exam dates for validation
  const { data: examDateData } = useQuery<IExamDatesResponse, Error>({
    queryKey: ["qualifying-exam-dates", selectedSemester],
    queryFn: async () => {
      if (!selectedSemester)
        return {
          success: false,
          exam: { id: 0, examName: "", examStartDate: "", examEndDate: "" },
        };
      const response = await api.get<IExamDatesResponse>(
        `/phd/drcMember/getDatesOfQeExam/${selectedSemester}`
      );
      return response.data;
    },
    enabled: !!selectedSemester,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Initialize student status and dates from API data
  useEffect(() => {
    if (examStatusData?.examStatuses) {
      const newStatusMap: Record<
        string,
        { status: boolean | null; numberOfQeApplication: number }
      > = {};

      examStatusData.examStatuses.forEach((status) => {
        let examStatus: boolean | null = null;

        // Determine exam status based on number of QE applications
        if (status.numberOfQeApplication === 1) {
          examStatus = status.qualifyingExam1;
        } else if (status.numberOfQeApplication === 2) {
          examStatus = status.qualifyingExam2;
        }

        newStatusMap[status.email] = {
          status: examStatus,
          numberOfQeApplication: status.numberOfQeApplication,
        };
      });

      setStudentStatus(newStatusMap);
    }

    if (qualificationDatesData?.qualificationDates) {
      const newDatesMap: Record<string, string | null> = {};

      qualificationDatesData.qualificationDates.forEach((item) => {
        newDatesMap[item.email] = item.qualificationDate;
      });

      setStudentDates(newDatesMap);
    }
  }, [examStatusData, qualificationDatesData]);

  // Validate dates when exam data changes
  useEffect(() => {
    if (examDateData?.success && examDateData.exam?.examEndDate) {
      const examEndDate = new Date(examDateData.exam.examEndDate);
      const errors: Record<string, string | null> = {};

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

      if (response.data.updatedStudents) {
        const newStatusMap = { ...studentStatus };

        response.data.updatedStudents.forEach((student: any) => {
          const existingRecord = newStatusMap[student.email];

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

  // Mutation for updating qualification dates
  const updateExamDatesMutation = useMutation({
    mutationFn: async () => {
      const validDates = examDates.filter((item) =>
        isDateValid(item.qualificationDate)
      );

      const formattedDates = validDates.map((item) => ({
        email: item.email,
        qualificationDate: new Date(item.qualificationDate).toISOString(),
      }));

      return await api.post(
        "/phd/drcMember/updatePassingDatesOfPhd",
        formattedDates
      );
    },
    onSuccess: (response) => {
      toast.success("Qualification dates updated successfully");

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

  const isDateValid = (date: string) => {
    if (!examDateData?.success || !examDateData.exam?.examEndDate) return true;

    const examEndDate = new Date(examDateData.exam.examEndDate);
    const qualificationDate = new Date(date);

    return qualificationDate > examEndDate;
  };

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

  if (isLoading) {
    return <div className="py-8 text-center">Loading exam results data...</div>;
  }

  if (!data?.success || !data.semestersWithExams.length) {
    return (
      <div className="py-4 text-center">
        <p>No qualifying exams or applications found</p>
      </div>
    );
  }

  const currentSemester =
    data.semestersWithExams.find((sem) => sem.id === selectedSemester) ||
    data.semestersWithExams[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Exam Results & Qualification Dates
        </h2>
        <Button
          onClick={saveChanges}
          className="bg-green-600 text-white hover:bg-green-700"
          disabled={
            updateExamResultsMutation.isLoading ||
            updateExamDatesMutation.isLoading ||
            Object.values(dateValidationErrors).some((error) => error !== null)
          }
        >
          {updateExamResultsMutation.isLoading ||
          updateExamDatesMutation.isLoading
            ? "Saving..."
            : "Save Changes"}
        </Button>
      </div>

      {examDateData?.success && examDateData.exam && (
        <div className="mb-4 rounded-md bg-blue-50 p-3 text-blue-800">
          <p className="text-sm">
            <strong>Note:</strong> Qualification dates must be after the exam
            end date:
            <strong> {formatDate(examDateData.exam.examEndDate)}</strong>
          </p>
        </div>
      )}

      {currentSemester.exams.map((exam: IQualifyingExam) => (
        <div
          key={exam.id}
          className="overflow-hidden rounded-lg border bg-white"
        >
          <div className="border-b bg-gray-50 px-4 py-3">
            <h3 className="font-semibold">{exam.examName}</h3>
            <p className="text-sm text-gray-500">
              Deadline: {formatDate(exam.deadline)}
            </p>
          </div>

          {exam.students.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No applications found for this exam
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Qualifying Areas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Qualification Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exam.students.map((student) => (
                  <TableRow key={student.email}>
                    <TableCell className="font-medium">
                      {student.name}
                    </TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>
                      <div>1. {student.qualifyingArea1 || "N/A"}</div>
                      <div>2. {student.qualifyingArea2 || "N/A"}</div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={
                          studentStatus[student.email]?.status === true
                            ? "pass"
                            : studentStatus[student.email]?.status === false
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
                          disabled={
                            studentStatus[student.email]?.status !== true
                          }
                          value={formatISODate(studentDates[student.email])}
                          min={
                            examDateData?.exam?.examEndDate
                              ? formatISODate(examDateData.exam.examEndDate)
                              : undefined
                          }
                          onChange={(e) =>
                            handleDateChange(student.email, e.target.value)
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
        </div>
      ))}

      <div className="mt-6">
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Examiner Management
        </Button>
      </div>
    </div>
  );
};

export default ResultsPanel;
