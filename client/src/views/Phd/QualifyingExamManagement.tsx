import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Calendar, 
  Users, 
  FileText, 
  Filter,
  RefreshCw
} from "lucide-react";
import { ApplicationsDataTable, QualifyingExamApplication } from "@/components/phd/ApplicationsDataTable";
import { ApplicationDetailsDialog } from "@/components/phd/ApplicationDetailsDialog";

interface QualifyingExam {
  id: number;
  examName: string;
  examStartDate: string;
  examEndDate: string;
  submissionDeadline: string;
  vivaDate?: string;
  semester: {
    year: string;
    semesterNumber: number;
  };
}

const QualifyingExamManagement: React.FC = () => {
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<QualifyingExamApplication | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  
  const queryClient = useQueryClient();

  // Fetch available exams
  const { data: examsData, isLoading: isLoadingExams } = useQuery({
    queryKey: ["phd-available-exams"],
    queryFn: async () => {
      const response = await api.get<{
        success: boolean;
        exams: QualifyingExam[];
      }>("/phd/drcMember/getAvailableExams");
      return response.data;
    },
  });

  // Fetch applications for selected exam
  const { data: applicationsData, isLoading: isLoadingApplications, refetch: refetchApplications } = useQuery({
    queryKey: ["phd-qualifying-exam-applications", selectedExamId],
    queryFn: async () => {
      if (!selectedExamId) return null;
      const response = await api.get<{
        success: boolean;
        exam: QualifyingExam;
        applications: QualifyingExamApplication[];
      }>(`/phd/drcMember/getQualifyingExamApplications?examId=${selectedExamId}`);
      return response.data;
    },
    enabled: !!selectedExamId,
  });

  // Update application status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      applicationId,
      status,
      comments,
    }: {
      applicationId: number;
      status: "accepted" | "rejected";
      comments?: string;
    }) => {
      const response = await api.patch(
        `/phd/drcMember/updateApplicationStatus/${applicationId}`,
        { status, comments }
      );
      return response.data as { success: boolean; message: string };
    },
    onSuccess: (data) => {
      toast.success(data.message);
      void queryClient.invalidateQueries({ queryKey: ["phd-qualifying-exam-applications"] });
      void refetchApplications();
    },
    onError: (error: unknown) => {
      interface ErrorWithResponse {
        response?: {
          data?: {
            message?: string;
          };
        };
      }
      const errorMessage = (error as ErrorWithResponse)?.response?.data?.message || "Failed to update application status";
      toast.error(errorMessage);
    },
  });

  const handleExamSelect = (examId: string) => {
    setSelectedExamId(parseInt(examId));
  };

  const handleStatusUpdate = (applicationId: number, status: "accepted" | "rejected", comments?: string) => {
    updateStatusMutation.mutate({ applicationId, status, comments });
  };

  const handleViewDetails = (application: QualifyingExamApplication) => {
    setSelectedApplication(application);
    setIsDetailsDialogOpen(true);
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

  const exams = examsData?.exams || [];
  const selectedExam = applicationsData?.exam;
  const applications = applicationsData?.applications || [];

  // Statistics
  const totalApplications = applications.length;
  const pendingApplications = applications.filter(app => app.status === "applied").length;
  const acceptedApplications = applications.filter(app => app.status === "accepted").length;
  const rejectedApplications = applications.filter(app => app.status === "rejected").length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Qualifying Exam Management</h1>
        <p className="text-gray-600 mt-2">
          Review and manage PhD qualifying exam applications
        </p>
      </div>

      {/* Exam Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Select Qualifying Exam
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="exam-select">Choose an exam to view applications:</Label>
              <Select onValueChange={handleExamSelect} disabled={isLoadingExams}>
                <SelectTrigger id="exam-select" className="mt-2">
                  <SelectValue placeholder={isLoadingExams ? "Loading exams..." : "Select an exam"} />
                </SelectTrigger>
                <SelectContent>
                  {exams.map((exam) => (
                    <SelectItem key={exam.id} value={exam.id.toString()}>
                      <div className="flex flex-col">
                        <span className="font-medium">{exam.examName}</span>
                        <span className="text-sm text-gray-500">
                          {exam.semester.year} - Semester {exam.semester.semesterNumber}
                          {exam.submissionDeadline && (
                            <> • Deadline: {formatDate(exam.submissionDeadline)}</>
                          )}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedExam && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border">
                <h3 className="font-semibold text-blue-900">{selectedExam.examName}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 text-sm text-blue-800">
                  <div>
                    <span className="font-medium">Semester:</span> {selectedExam.semester.year} - Semester {selectedExam.semester.semesterNumber}
                  </div>
                  <div>
                    <span className="font-medium">Submission Deadline:</span> {formatDate(selectedExam.submissionDeadline)}
                  </div>
                  <div>
                    <span className="font-medium">Exam Period:</span> {formatDate(selectedExam.examStartDate)} - {formatDate(selectedExam.examEndDate)}
                  </div>
                  {selectedExam.vivaDate && (
                    <div>
                      <span className="font-medium">Viva Date:</span> {formatDate(selectedExam.vivaDate)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Applications Content */}
      {selectedExamId && (
        <>
          {isLoadingApplications ? (
            <div className="flex h-64 items-center justify-center">
              <LoadingSpinner className="h-8 w-8" />
              <span className="ml-2">Loading applications...</span>
            </div>
          ) : (
            <>
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="flex items-center p-6">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="text-2xl font-bold">{totalApplications}</p>
                        <p className="text-sm text-gray-600">Total Applications</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="flex items-center p-6">
                    <div className="flex items-center space-x-2">
                      <Filter className="h-8 w-8 text-orange-600" />
                      <div>
                        <p className="text-2xl font-bold">{pendingApplications}</p>
                        <p className="text-sm text-gray-600">Pending Review</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="flex items-center p-6">
                    <div className="flex items-center space-x-2">
                      <Users className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="text-2xl font-bold">{acceptedApplications}</p>
                        <p className="text-sm text-gray-600">Accepted</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="flex items-center p-6">
                    <div className="flex items-center space-x-2">
                      <RefreshCw className="h-8 w-8 text-red-600" />
                      <div>
                        <p className="text-2xl font-bold">{rejectedApplications}</p>
                        <p className="text-sm text-gray-600">Rejected</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Applications Table */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Student Applications
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void refetchApplications()}
                      disabled={isLoadingApplications}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingApplications ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {applications.length > 0 ? (
                    <ApplicationsDataTable
                      data={applications}
                      onStatusUpdate={handleStatusUpdate}
                      onViewDetails={handleViewDetails}
                      isUpdating={updateStatusMutation.isLoading}
                    />
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">No Applications Found</h3>
                      <p className="text-gray-500">
                        No students have submitted applications for this exam yet.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}

      {/* Application Details Dialog */}
      <ApplicationDetailsDialog
        application={selectedApplication}
        isOpen={isDetailsDialogOpen}
        onClose={() => {
          setIsDetailsDialogOpen(false);
          setSelectedApplication(null);
        }}
        onStatusUpdate={handleStatusUpdate}
        isUpdating={updateStatusMutation.isLoading}
      />
    </div>
  );
};

export default QualifyingExamManagement;
