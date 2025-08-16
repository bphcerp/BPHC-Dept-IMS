import React, { useState, lazy, Suspense } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { LoadingSpinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import NotificationDialog from "./DRCExaminerManagement/NotificationDialog"; // Import the generic dialog

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
  const [examForm, setExamForm] = useState({
    examName: "Regular Qualifying Exam",
    submissionDeadline: "",
    examStartDate: "",
    examEndDate: "",
    vivaDate: "",
  });
  
  const [showNotifyDialog, setShowNotifyDialog] = useState(false);
  const [notificationData, setNotificationData] = useState({ recipients: [], subject: "", body: "" });

  const { data: currentSemesterData, isLoading: isLoadingCurrentSemester } = useQuery({
    queryKey: ["current-phd-semester"],
    queryFn: async () => {
      const response = await api.get<{ semester: Semester; }>("/phd/staff/getLatestSem");
      return response.data;
    },
  });
  const currentSemesterId = currentSemesterData?.semester?.id;

  const { data: examsData, isLoading: isLoadingExams } = useQuery({
    queryKey: ["phd-qualifying-exams", currentSemesterId],
    queryFn: async () => {
      if (!currentSemesterId) return { success: true, exams: [] };
      const response = await api.get<{ exams: QualifyingExam[]; }>(`/phd/staff/qualifyingExams/${currentSemesterId}`);
      const regularQualifyingExams = response.data.exams.filter(
        (exam) => exam.examName === "Regular Qualifying Exam"
      );
      return { exams: regularQualifyingExams };
    },
    enabled: !!currentSemesterId,
  });

  const { data: allUsers } = useQuery({
    queryKey: ["all-users-for-notify"],
    queryFn: async () => {
        const res = await api.get('/admin/member/search'); // A generic endpoint to get users
        return res.data.map((user: any) => user.email);
    },
    staleTime: Infinity,
  });

  const examMutation = useMutation({
    mutationFn: async (formData: typeof examForm & { semesterId: number }) => {
      const response = await api.post<{ exam: QualifyingExam }>("/phd/staff/updateQualifyingExam", formData);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success("Qualifying exam deadline updated successfully");
      const deadlineDate = new Date(data.exam.submissionDeadline).toLocaleString();
      const examStartDate = new Date(data.exam.examStartDate).toLocaleString();
      const examEndDate = new Date(data.exam.examEndDate).toLocaleString();
      const vivaDate = data.exam.vivaDate ? new Date(data.exam.vivaDate).toLocaleString() : "N/A";

      setNotificationData({
          recipients: allUsers || [],
          subject: "New Regular Qualifying Exam Deadline Announced",
          body: `We are pleased to announce that a new **Regular Qualifying Exam** deadline has been set.\n\n- **Registration Deadline:** ${deadlineDate}\n- **Exam Start:** ${examStartDate}\n- **Exam End:** ${examEndDate}\n- **Viva Date:** ${vivaDate}\n\nPlease make sure to submit your application before the registration deadline.\n\nBest regards,\nPhD Department`
      });
      setShowNotifyDialog(true);
      
      void queryClient.invalidateQueries({ queryKey: ["phd-qualifying-exams", currentSemesterId] });
      setExamForm({ examName: "Regular Qualifying Exam", submissionDeadline: "", examStartDate: "", examEndDate: "", vivaDate: "" });
    },
    onError: (error) => {
      const errorMessage = "Failed to update qualifying exam deadline";
      toast.error(isAxiosError(error) ? (error.response?.data as string) || errorMessage : errorMessage);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSemesterId) {
      toast.error("No active semester found");
      return;
    }
    if (!examForm.submissionDeadline || !examForm.examStartDate || !examForm.examEndDate || !examForm.vivaDate) {
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
    if(endDate >= vivaDate) {
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

  if (isLoadingCurrentSemester) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (!currentSemesterData?.semester) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Semester Configuration</h3>
            <p className="text-gray-500">No semester configuration found. Please contact the system administrator.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-8">
        {/* Cards for current semester and update form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Current Academic Semester</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">
                  {currentSemesterData.semester.year} - Semester{" "}
                  {currentSemesterData.semester.semesterNumber}
                </h3>
                <div className="text-sm text-gray-600 mt-1">
                  <div>Start: {formatDate(currentSemesterData.semester.startDate)}</div>
                  <div>End: {formatDate(currentSemesterData.semester.endDate)}</div>
                </div>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Latest
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Update Exam Deadline</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label className="text-sm font-medium">Exam Name</Label>
                <div className="font-medium text-gray-900 mt-1">Regular Qualifying Exam</div>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-3">
                    <Label htmlFor="submissionDeadline" className="text-sm font-medium">Registration Deadline</Label>
                    <Input id="submissionDeadline" type="datetime-local" value={examForm.submissionDeadline} onChange={(e) => setExamForm({ ...examForm, submissionDeadline: e.target.value })} required className="h-10" />
                </div>
                <div className="space-y-3">
                    <Label htmlFor="examStartDate" className="text-sm font-medium">Exam Start Date</Label>
                    <Input id="examStartDate" type="datetime-local" value={examForm.examStartDate} onChange={(e) => setExamForm({ ...examForm, examStartDate: e.target.value, })} required className="h-10" />
                </div>
                <div className="space-y-3">
                    <Label htmlFor="examEndDate" className="text-sm font-medium">Exam End Date</Label>
                    <Input id="examEndDate" type="datetime-local" value={examForm.examEndDate} onChange={(e) => setExamForm({ ...examForm, examEndDate: e.target.value, })} required className="h-10" />
                </div>
                <div className="space-y-3">
                    <Label htmlFor="vivaDate" className="text-sm font-medium">Viva Date</Label>
                    <Input id="vivaDate" type="datetime-local" value={examForm.vivaDate} onChange={(e) => setExamForm({ ...examForm, vivaDate: e.target.value })} required className="h-10" />
                </div>
              </div>
              <Button type="submit" disabled={examMutation.isLoading} className="bg-blue-600 text-white hover:bg-blue-700 h-10 px-6">
                {examMutation.isLoading ? (<LoadingSpinner className="h-4 w-4" />) : ("Update Exam Deadline")}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="text-xl font-semibold">Current Qualifying Exam Deadlines</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoadingExams ? (
                    <div className="flex justify-center py-8">
                        <LoadingSpinner className="h-8 w-8" />
                    </div>
                ) : examsData?.exams && examsData.exams.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b">
                                    <th className="px-4 py-3 text-left font-medium text-gray-700">Exam Name</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-700">Registration Deadline</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-700">Exam Start</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-700">Exam End</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-700">Viva Date</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {examsData.exams.map((exam) => {
                                    const deadlineDate = new Date(exam.submissionDeadline);
                                    const isActive = deadlineDate > new Date();
                                    return (
                                        <tr key={exam.id} className="border-b hover:bg-gray-50">
                                            <td className="px-4 py-3 text-gray-900">{exam.examName}</td>
                                            <td className="px-4 py-3 text-gray-900">{formatDate(exam.submissionDeadline)}</td>
                                            <td className="px-4 py-3 text-gray-900">{formatDate(exam.examStartDate)}</td>
                                            <td className="px-4 py-3 text-gray-900">{formatDate(exam.examEndDate)}</td>
                                            <td className="px-4 py-3 text-gray-900">{exam.vivaDate ? formatDate(exam.vivaDate) : "N/A"}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
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
                    <div className="text-center py-8">
                        <div className="text-gray-500 mb-4">
                          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Deadlines Set</h3>
                        <p className="text-gray-500">No Regular Qualifying Exam deadlines set for this semester.</p>
                    </div>
                )}
            </CardContent>
        </Card>
      </div>
      <NotificationDialog 
        isOpen={showNotifyDialog} 
        onClose={() => setShowNotifyDialog(false)} 
        initialData={notificationData} 
      />
    </>
  );
};

export default UpdateQualifyingExamDeadline;