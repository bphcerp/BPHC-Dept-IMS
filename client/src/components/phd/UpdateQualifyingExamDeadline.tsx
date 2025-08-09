import React, { useState, lazy, Suspense } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { LoadingSpinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTheme } from "@/hooks/use-theme";

const MDEditor = lazy(() => import("@uiw/react-md-editor"));

interface Semester {
  id: number;
  year: string;
  semesterNumber: number;
  startDate: string;
  endDate: string;
  createdAt: string;
}

interface QualifyingExam {
  id: number;
  semesterId: number;
  examName: string;
  submissionDeadline: string;
  examStartDate: string;
  examEndDate: string;
  vivaDate?: string;
  createdAt: string;
}

const UpdateQualifyingExamDeadline: React.FC = () => {
  const queryClient = useQueryClient();
  const editorTheme = useTheme();
  
  const [examForm, setExamForm] = useState({
    examName: "Regular Qualifying Exam",
    submissionDeadline: "",
    examStartDate: "",
    examEndDate: "",
    vivaDate: "",
  });
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [createdExamDates, setCreatedExamDates] = useState<{
    submissionDeadline: string;
    examStartDate: string;
    examEndDate: string;
    vivaDate: string;
  } | null>(null);
  const { data: currentSemesterData, isLoading: isLoadingCurrentSemester } =
    useQuery({
      queryKey: ["current-phd-semester"],
      queryFn: async () => {
        const response = await api.get<{
          semester: Semester;
        }>("/phd/staff/getLatestSem");
        return response.data;
      },
    });

  const currentSemesterId = currentSemesterData?.semester?.id;

  const { data: examsData, isLoading: isLoadingExams } = useQuery({
    queryKey: ["phd-qualifying-exams", currentSemesterId],
    queryFn: async () => {
      if (!currentSemesterId) return { success: true, exams: [] };
      const response = await api.get<{
        exams: QualifyingExam[];
      }>(`/phd/staff/qualifyingExams/${currentSemesterId}`);
      const regularQualifyingExams = response.data.exams.filter(
        (exam) => exam.examName === "Regular Qualifying Exam"
      );
      return { exams: regularQualifyingExams };
    },
    enabled: !!currentSemesterId,
  });

  const examMutation = useMutation({
    mutationFn: async (formData: typeof examForm & { semesterId: number }) => {
      const response = await api.post<{ exam: QualifyingExam }>(
        "/phd/staff/updateQualifyingExam",
        formData
      );
      return response.data;
    },
    onSuccess: (data) => {
      toast.success("Qualifying exam deadline updated successfully");

      // Store the created exam data for email notification
      setCreatedExamDates({
        submissionDeadline: data.exam.submissionDeadline,
        examStartDate: data.exam.examStartDate,
        examEndDate: data.exam.examEndDate,
        vivaDate: data.exam.vivaDate || "",
      });

      // Set up default email template
      setEmailSubject("New Regular Qualifying Exam Deadline Announced");
      
      const deadlineDate = new Date(data.exam.submissionDeadline).toLocaleString();
      const examStartDate = new Date(data.exam.examStartDate).toLocaleString();
      const examEndDate = new Date(data.exam.examEndDate).toLocaleString();
      const vivaDate = data.exam.vivaDate ? new Date(data.exam.vivaDate).toLocaleString() : "N/A";
      
      const defaultEmailBody = `# New PhD Qualifying Exam Deadline Announced

We are pleased to announce that a new **Regular Qualifying Exam** deadline has been set.

## Exam Details:
- **Registration Deadline:** ${deadlineDate}
- **Exam Start:** ${examStartDate}
- **Exam End:** ${examEndDate}
- **Viva Date:** ${vivaDate}

Please make sure to submit your application before the registration deadline.

Best regards,  
PhD Department`;

      setEmailBody(defaultEmailBody);

      // Show option to send notification
      setShowEmailDialog(true);

      void queryClient.invalidateQueries({
        queryKey: ["phd-qualifying-exams", currentSemesterId],
      });

      setExamForm({
        examName: "Regular Qualifying Exam",
        submissionDeadline: "",
        examStartDate: "",
        examEndDate: "",
        vivaDate: "",
      });
    },
    onError: (error) => {
      const errorMessage = "Failed to update qualifying exam deadline";
      toast.error(
        isAxiosError(error)
          ? (error.response?.data as string) || errorMessage
          : errorMessage
      );
    },
  });

  // Email notification mutation
  const emailMutation = useMutation({
    mutationFn: async (emailData: {
      subject: string;
      body: string;
    }) => {
      await api.post("/phd/staff/notifyAllUsers", emailData);
    },
    onSuccess: () => {
      toast.success("Email notification sent to all users");
      setShowEmailDialog(false);
    },
    onError: () => {
      toast.error("Failed to send email notification");
    },
  });

  const handleSendEmail = () => {
    if (!createdExamDates) return;
    
    emailMutation.mutate({
      subject: emailSubject,
      body: emailBody,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSemesterId) {
      toast.error("No active semester found");
      return;
    }
    if (
      !examForm.submissionDeadline ||
      !examForm.examStartDate ||
      !examForm.examEndDate ||
      !examForm.vivaDate
    ) {
      toast.error("Please provide all dates");
      return;
    }

    const deadlineDate = new Date(examForm.submissionDeadline);
    const startDate = new Date(examForm.examStartDate);
    const endDate = new Date(examForm.examEndDate);
    const vivaDate = new Date(examForm.vivaDate);

    if (deadlineDate >= startDate) {
      toast.error("Registration deadline must be before exam start date");
      return;
    }
    if (startDate >= endDate) {
      toast.error("Exam start date must be before exam end date");
      return;
    }
    if (endDate >= vivaDate) {
      toast.error("Viva date must be after exam end date");
      return;
    }

    const formattedData = {
      examName: examForm.examName,
      submissionDeadline: deadlineDate.toISOString(),
      examStartDate: startDate.toISOString(),
      examEndDate: endDate.toISOString(),
      vivaDate: vivaDate.toISOString(),
      semesterId: currentSemesterId,
    };

    examMutation.mutate(formattedData);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <>
      <div className="flex min-h-screen w-full flex-col items-center bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-xl">
          <div className="border-b border-gray-200 bg-gray-100 px-6 py-4">
            <h1 className="text-center text-3xl font-bold text-gray-800">
              Qualifying Exam Deadline Management
            </h1>
          </div>
          {isLoadingCurrentSemester ? (
            <div className="flex h-64 items-center justify-center">
              <LoadingSpinner className="h-12 w-12" />
            </div>
          ) : currentSemesterData?.semester ? (
            <div className="grid gap-6 p-6 md:grid-cols-2">
              {}
              <div className="space-y-4 rounded-lg bg-gray-50 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold">
                    Current Academic Semester
                  </h2>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium`}
                  >
                    Latest
                  </span>
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-medium">
                    {currentSemesterData.semester.year}-Semester{" "}
                    {currentSemesterData.semester.semesterNumber}
                  </p>
                  <div className="text-sm text-gray-500">
                    <div>
                      Start:{" "}
                      {formatDate(currentSemesterData.semester.startDate)}
                    </div>
                    <div>
                      End: {formatDate(currentSemesterData.semester.endDate)}
                    </div>
                  </div>
                </div>
              </div>
              {}
              <div>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label>Exam Name:</Label>
                    <div className="font-bold">Regular Qualifying Exam</div>
                  </div>
                  <div>
                    <Label htmlFor="submissionDeadline">Registration Deadline</Label>
                    <Input
                      id="submissionDeadline"
                      type="datetime-local"
                      value={examForm.submissionDeadline}
                      onChange={(e) =>
                        setExamForm({ ...examForm, submissionDeadline: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="examStartDate">Exam Start Date</Label>
                    <Input
                      id="examStartDate"
                      type="datetime-local"
                      value={examForm.examStartDate}
                      onChange={(e) =>
                        setExamForm({
                          ...examForm,
                          examStartDate: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="examEndDate">Exam End Date</Label>
                    <Input
                      id="examEndDate"
                      type="datetime-local"
                      value={examForm.examEndDate}
                      onChange={(e) =>
                        setExamForm({
                          ...examForm,
                          examEndDate: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="vivaDate">Viva Date</Label>
                    <Input
                      id="vivaDate"
                      type="datetime-local"
                      value={examForm.vivaDate}
                      onChange={(e) =>
                        setExamForm({ ...examForm, vivaDate: e.target.value })
                      }
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={examMutation.isLoading}
                    className="w-full bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {examMutation.isLoading ? (
                      <LoadingSpinner className="h-5 w-5" />
                    ) : (
                      "Update Exam Deadline"
                    )}
                  </Button>
                </form>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-red-500">
                No semester configuration found. Please contact the system
                administrator.
              </p>
            </div>
          )}
          {}
          <div className="border-t border-gray-200 bg-gray-50 p-6">
            <h3 className="mb-4 text-lg font-medium">
              Current Qualifying Exam Deadlines
            </h3>
            {isLoadingExams ? (
              <div className="flex justify-center py-4">
                <LoadingSpinner className="h-6 w-6" />
              </div>
            ) : examsData?.exams && examsData.exams.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border px-4 py-2 text-left">Exam Name</th>
                      <th className="border px-4 py-2 text-left">
                        Registration Deadline
                      </th>
                      <th className="border px-4 py-2 text-left">Exam Start</th>
                      <th className="border px-4 py-2 text-left">Exam End</th>
                      <th className="border px-4 py-2 text-left">Viva Date</th>
                      <th className="border px-4 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {examsData.exams.map((exam) => {
                      const deadlineDate = new Date(exam.submissionDeadline);
                      const isActive = deadlineDate > new Date();
                      return (
                        <tr key={exam.id}>
                          <td className="border px-4 py-2">{exam.examName}</td>
                          <td className="border px-4 py-2">
                            {formatDate(exam.submissionDeadline)}
                          </td>
                          <td className="border px-4 py-2">
                            {formatDate(exam.examStartDate)}
                          </td>
                          <td className="border px-4 py-2">
                            {formatDate(exam.examEndDate)}
                          </td>
                          <td className="border px-4 py-2">
                            {exam.vivaDate ? formatDate(exam.vivaDate) : "N/A"}
                          </td>
                          <td className="border px-4 py-2">
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-medium ${
                                isActive
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {isActive ? "Active" : "Expired"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-4 text-center text-gray-500">
                No Regular Qualifying Exam deadlines set for this semester.
              </p>
            )}
          </div>
        </div>
      </div>
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Send Email Notification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="emailSubject">Subject</Label>
              <Input
                id="emailSubject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Email subject"
              />
            </div>
            <div>
              <Label>Email Body</Label>
              <div className="py-2" data-color-mode={editorTheme}>
                <Suspense
                  fallback={
                    <div className="w-full text-center py-8">
                      Loading editor...
                    </div>
                  }
                >
                  <MDEditor
                    value={emailBody}
                    onChange={(value) => setEmailBody(value || "")}
                    height={400}
                    preview="live"
                    commandsFilter={(command) =>
                      command.name !== "fullscreen" ? command : false
                    }
                  />
                </Suspense>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowEmailDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendEmail}
                disabled={emailMutation.isLoading || !emailSubject.trim() || !emailBody.trim()}
              >
                {emailMutation.isLoading ? (
                  <LoadingSpinner className="h-4 w-4 mr-2" />
                ) : null}
                Send Email
              </Button>
            </div>
          </div>
          <style>
            {`
              .wmde-markdown ul { list-style-type: disc; margin-left: 1.5rem; }
              .wmde-markdown ol { list-style-type: decimal; margin-left: 1.5rem; }
            `}
          </style>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UpdateQualifyingExamDeadline;
