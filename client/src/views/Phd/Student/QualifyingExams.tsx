import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { LoadingSpinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import QualifyingExamApplication from "@/components/phd/QualifyingExamApplication";
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

  const { data: examsData, isLoading: isLoadingExams, refetch: refetchExams } = useQuery({
    queryKey: ["phd-student-qualifying-exams"],
    queryFn: async () => {
      const response = await api.get<{
        success: boolean;
        exams: QualifyingExam[];
      }>("/phd/student/getQualifyingExams?name=Regular Qualifying Exam");
      return response.data;
    },
  });

  const { data: applicationsData, isLoading: isLoadingApplications, refetch: refetchApplications } = useQuery({
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
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-100 px-4 py-12">
      <h1 className="mb-8 text-center text-3xl font-bold">PhD Qualifying Exams</h1>
      
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Available Exams */}
        <Card>
          <CardHeader>
            <CardTitle>Available Qualifying Exams</CardTitle>
          </CardHeader>
          <CardContent>
            {examsData?.exams?.length ? (
              <div className="space-y-4">
                {examsData.exams.map((exam) => {
                  const isDeadlinePassed = new Date(exam.submissionDeadline) < new Date();
                  const hasApplied = applicationsData?.applications?.some(
                    (app) => app.examId === exam.id
                  );
                  
                  return (
                    <div
                      key={exam.id}
                      className="rounded-lg border bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold">{exam.examName}</h3>
                          <p className="text-sm text-gray-600">
                            {exam.semester.year} - Semester {exam.semester.semesterNumber}
                          </p>
                          <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                            <div>
                              <span className="font-medium">Registration Deadline:</span>{" "}
                              {formatDate(exam.submissionDeadline)}
                            </div>
                            <div>
                              <span className="font-medium">Exam Start:</span>{" "}
                              {formatDate(exam.examStartDate)}
                            </div>
                            <div>
                              <span className="font-medium">Exam End:</span>{" "}
                              {formatDate(exam.examEndDate)}
                            </div>
                            {exam.vivaDate && (
                              <div>
                                <span className="font-medium">Viva Date:</span>{" "}
                                {formatDate(exam.vivaDate)}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
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
              <p className="py-4 text-center text-gray-500">
                No qualifying exams available at this time.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Application Status */}
        <Card>
          <CardHeader>
            <CardTitle>Your Applications</CardTitle>
          </CardHeader>
          <CardContent>
            {applicationsData?.applications?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border px-4 py-2 text-left">Exam</th>
                      <th className="border px-4 py-2 text-left">Semester</th>
                      <th className="border px-4 py-2 text-left">Areas</th>
                      <th className="border px-4 py-2 text-left">Status</th>
                      <th className="border px-4 py-2 text-left">Applied On</th>
                      <th className="border px-4 py-2 text-left">Comments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applicationsData.applications.map((application) => (
                      <tr key={application.id}>
                        <td className="border px-4 py-2">{application.examName}</td>
                        <td className="border px-4 py-2">
                          {application.semester.year} - Semester {application.semester.semesterNumber}
                        </td>
                        <td className="border px-4 py-2">
                          <div className="space-y-1">
                            <div className="text-sm">
                              <span className="font-medium">Area 1:</span> {application.qualifyingArea1}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">Area 2:</span> {application.qualifyingArea2}
                            </div>
                          </div>
                        </td>
                        <td className="border px-4 py-2">
                          <Badge className={getStatusColor(application.status)}>
                            {application.status.replace("_", " ").toUpperCase()}
                          </Badge>
                        </td>
                        <td className="border px-4 py-2">
                          {formatDate(application.createdAt)}
                        </td>
                        <td className="border px-4 py-2">
                          {application.comments || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-4 text-center text-gray-500">
                You haven&apos;t submitted any applications yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Application Dialog */}
      <Dialog open={showApplicationDialog} onOpenChange={setShowApplicationDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Apply for {selectedExam?.examName}
            </DialogTitle>
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
