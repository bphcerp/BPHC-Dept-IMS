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
import { AlertCircle, Edit } from "lucide-react";

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
  status: "applied" | "verified" | "resubmit";
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
  files: Record<string, string | null>;
}

const QualifyingExams = () => {
  const [selectedExam, setSelectedExam] = useState<QualifyingExam | null>(null);
  const [selectedApplicationForEdit, setSelectedApplicationForEdit] = useState<ApplicationStatus | null>(null);
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

  const getStatusBadge = (status: ApplicationStatus['status']) => {
    switch (status) {
      case "applied": return <Badge className="bg-blue-100 text-blue-800">Applied</Badge>;
      case "verified": return <Badge className="bg-green-100 text-green-800">Verified</Badge>;
      case "resubmit": return <Badge variant="destructive">Resubmission Required</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleApplyClick = (exam: QualifyingExam) => {
    const existingApplication = applicationsData?.applications?.find((app) => app.examId === exam.id);
    if (existingApplication) {
      toast.error("You have already submitted an application for this exam");
      return;
    }
    setSelectedExam(exam);
    setSelectedApplicationForEdit(null);
    setShowApplicationDialog(true);
  };

  const handleResubmitClick = (application: ApplicationStatus) => {
    // Corrected Logic: Check the deadline directly from the application object.
    if (new Date(application.submissionDeadline) < new Date()) {
      toast.error("The deadline for resubmission has passed.");
      return;
    }
    // Reconstruct a valid `QualifyingExam` object for the form component.
    const examForResubmission: QualifyingExam = {
        id: application.examId,
        examName: application.examName,
        submissionDeadline: application.submissionDeadline,
        examStartDate: application.examStartDate,
        examEndDate: application.examEndDate,
        vivaDate: application.vivaDate,
        semester: application.semester,
    };
    setSelectedExam(examForResubmission);
    setSelectedApplicationForEdit(application);
    setShowApplicationDialog(true);
  }

  const handleApplicationSuccess = () => {
    setShowApplicationDialog(false);
    setSelectedExam(null);
    setSelectedApplicationForEdit(null);
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

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Available Qualifying Exams</CardTitle>
          </CardHeader>
          <CardContent>
            {examsData?.exams?.length ? (
              <div className="space-y-4">
                {examsData.exams.map((exam) => {
                  const isDeadlinePassed = new Date(exam.submissionDeadline) < new Date();
                  const hasApplied = applicationsData?.applications?.some((app) => app.examId === exam.id);
                  return (
                    <div key={exam.id} className="rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold">{exam.examName}</h3>
                            {hasApplied && (<Badge className="bg-green-100 text-green-800">Applied</Badge>)}
                            {isDeadlinePassed && (<Badge className="bg-red-100 text-red-800">Deadline Passed</Badge>)}
                          </div>
                          <p className="text-sm text-gray-600">{exam.semester.year} - Semester {exam.semester.semesterNumber}</p>
                          <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                            <div>
                              <span className="font-medium text-gray-700">Registration Deadline:</span>{" "}
                              <span className={isDeadlinePassed ? "text-red-600" : "text-gray-600"}>{formatDate(exam.submissionDeadline)}</span>
                            </div>
                            <div><span className="font-medium text-gray-700">Exam Start:</span>{" "}<span className="text-gray-600">{formatDate(exam.examStartDate)}</span></div>
                            <div><span className="font-medium text-gray-700">Exam End:</span>{" "}<span className="text-gray-600">{formatDate(exam.examEndDate)}</span></div>
                            {exam.vivaDate && (<div><span className="font-medium text-gray-700">Viva Date:</span>{" "}<span className="text-gray-600">{formatDate(exam.vivaDate)}</span></div>)}
                          </div>
                        </div>
                        <div className="ml-6">
                          <Button onClick={() => handleApplyClick(exam)} disabled={isDeadlinePassed || hasApplied} className={isDeadlinePassed || hasApplied ? "cursor-not-allowed opacity-50" : ""}>
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
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Areas</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Applied On</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applicationsData.applications.map((application) => (
                      <tr key={application.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">{application.examName}</td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <div className="text-sm">{application.qualifyingArea1}</div>
                            <div className="text-sm text-muted-foreground">{application.qualifyingArea2}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(application.status)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(application.createdAt)}</td>
                        <td className="px-4 py-3">
                          {application.status === 'resubmit' ? (
                            <div className="flex flex-col items-start gap-2">
                                <Button size="sm" onClick={() => handleResubmitClick(application)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit & Resubmit
                                </Button>
                                {application.comments && (
                                  <div className="flex items-start text-xs text-red-600 p-2 bg-red-50 border border-red-200 rounded-md">
                                    <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                                    <p><strong>DRC Comments:</strong> {application.comments}</p>
                                  </div>
                                )}
                            </div>
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                {/* ... No Applications Yet SVG and text ... */}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showApplicationDialog} onOpenChange={setShowApplicationDialog}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
                {selectedApplicationForEdit ? `Resubmit Application for ${selectedExam?.examName}` : `Apply for ${selectedExam?.examName}`}
            </DialogTitle>
          </DialogHeader>
          {selectedExam && (
            <QualifyingExamApplication
              exam={selectedExam}
              existingApplication={selectedApplicationForEdit}
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