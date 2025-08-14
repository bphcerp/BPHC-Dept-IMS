import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { LoadingSpinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import QualifyingExamApplication from "@/components/phd/StudentQualifyingExam/QualifyingExamApplication";
import { toast } from "sonner";

interface QualifyingExam {
  id: number;
  examName: string;
  submissionDeadline: string;
  examStartDate: string;
  examEndDate: string;
  vivaDate?: string;
  semester: {
    year: string;
    semesterNumber: number;
  };
}

interface ApplicationStatus {
  id: number;
  examId: number;
  examName: string;
  status: "applied" | "accepted" | "rejected" | "withdrawn";
  qualifyingArea1: string;
  qualifyingArea2: string;
  comments?: string;
  semester: {
    year: string;
    semesterNumber: number;
  };
  submissionDeadline: string;
  examStartDate: string;
  examEndDate: string;
  vivaDate?: string;
  createdAt: string;
}

const QualifyingExams = () => {
  const [selectedExam, setSelectedExam] = useState<QualifyingExam | null>(null);
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);

  const {
    data: examsData,
    isLoading: isLoadingExams,
    refetch: refetchExams,
  } = useQuery({
    queryKey: ["phd-student-qualifying-exams"],
    queryFn: async () => {
      const response = await api.get<{
        success: boolean;
        exams: QualifyingExam[];
      }>("/phd/student/getQualifyingExams?name=Regular Qualifying Exam");
      return response.data;
    },
  });

  const {
    data: applicationsData,
    isLoading: isLoadingApplications,
    refetch: refetchApplications,
  } = useQuery({
    queryKey: ["phd-student-application-status"],
    queryFn: async () => {
      const response = await api.get<{
        success: boolean;
        applications: ApplicationStatus[];
        message?: string;
      }>("/phd/student/getQualifyingExamStatus");
      return response.data;
    },
  });

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "applied":
        return "bg-blue-100 text-blue-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "withdrawn":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleApplyClick = (exam: QualifyingExam) => {
    // Check if already applied for this exam
    const existingApplication = applicationsData?.applications?.find(
      (app) => app.examId === exam.id
    );

    if (existingApplication) {
      toast.error("You have already submitted an application for this exam");
      return;
    }

    setSelectedExam(exam);
    setShowApplicationDialog(true);
  };

  const handleApplicationSuccess = () => {
    setShowApplicationDialog(false);
    setSelectedExam(null);
    void refetchExams();
    void refetchApplications();
    toast.success("Application submitted successfully!");
  };

  if (isLoadingExams || isLoadingApplications) {
    return (
      <div className="min-h-screen w-full bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">PhD Qualifying Exams</h1>
          <p className="mt-2 text-gray-600">Apply for qualifying exams and track your applications</p>
        </div>

        {/* Available Exams */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Available Qualifying Exams</CardTitle>
          </CardHeader>
          <CardContent>
            {examsData?.exams?.length ? (
              <div className="space-y-4">
                {examsData.exams.map((exam) => {
                  const isDeadlinePassed =
                    new Date(exam.submissionDeadline) < new Date();
                  const hasApplied = applicationsData?.applications?.some(
                    (app) => app.examId === exam.id
                  );

                  return (
                    <div
                      key={exam.id}
                      className="rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold">
                              {exam.examName}
                            </h3>
                            {hasApplied && (
                              <Badge className="bg-green-100 text-green-800">
                                Applied
                              </Badge>
                            )}
                            {isDeadlinePassed && (
                              <Badge className="bg-red-100 text-red-800">
                                Deadline Passed
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {exam.semester.year} - Semester{" "}
                            {exam.semester.semesterNumber}
                          </p>
                          <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                            <div>
                              <span className="font-medium text-gray-700">
                                Registration Deadline:
                              </span>{" "}
                              <span className={isDeadlinePassed ? "text-red-600" : "text-gray-600"}>
                                {formatDate(exam.submissionDeadline)}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Exam Start:</span>{" "}
                              <span className="text-gray-600">{formatDate(exam.examStartDate)}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Exam End:</span>{" "}
                              <span className="text-gray-600">{formatDate(exam.examEndDate)}</span>
                            </div>
                            {exam.vivaDate && (
                              <div>
                                <span className="font-medium text-gray-700">Viva Date:</span>{" "}
                                <span className="text-gray-600">{formatDate(exam.vivaDate)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="ml-6">
                          <Button
                            onClick={() => handleApplyClick(exam)}
                            disabled={isDeadlinePassed || hasApplied}
                            className={
                              isDeadlinePassed || hasApplied
                                ? "cursor-not-allowed opacity-50"
                                : ""
                            }
                          >
                            {hasApplied ? "Already Applied" : "Apply"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-500 mb-4">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Exams Available</h3>
                <p className="text-gray-500">No qualifying exams are available at this time.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Application Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Your Applications</CardTitle>
          </CardHeader>
          <CardContent>
            {applicationsData?.applications?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Exam</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Semester</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Areas</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Applied On</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Comments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applicationsData.applications.map((application) => (
                      <tr key={application.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">
                          {application.examName}
                        </td>
                        <td className="px-4 py-3">
                          {application.semester.year} - Semester{" "}
                          {application.semester.semesterNumber}
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <div className="text-sm">
                              <span className="font-medium text-gray-700">Area 1:</span>{" "}
                              <span className="text-gray-600">{application.qualifyingArea1}</span>
                            </div>
                            <div className="text-sm">
                              <span className="font-medium text-gray-700">Area 2:</span>{" "}
                              <span className="text-gray-600">{application.qualifyingArea2}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={getStatusColor(application.status)}>
                            {application.status.replace("_", " ").toUpperCase()}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatDate(application.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {application.comments || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-500 mb-4">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Yet</h3>
                <p className="text-gray-500">You haven&apos;t submitted any applications yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Application Dialog */}
      <Dialog
        open={showApplicationDialog}
        onOpenChange={setShowApplicationDialog}
      >
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Apply for {selectedExam?.examName}</DialogTitle>
          </DialogHeader>
          {selectedExam && (
            <QualifyingExamApplication
              exam={selectedExam}
              onSuccess={handleApplicationSuccess}
              onCancel={() => setShowApplicationDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QualifyingExams;
