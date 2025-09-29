import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Users, FileText, Filter, RefreshCw, ArrowRight } from "lucide-react";
import {
  ApplicationsDataTable,
  QualifyingExamApplication,
} from "@/components/phd/DRCExaminerManagement/ApplicationsDataTable";
import { ApplicationDetailsDialog } from "@/components/phd/DRCExaminerManagement/ApplicationDetailsDialog";

interface ApplicationStatusPanelProps {
  selectedExamId: number;
  onNext?: () => void;
}

const ApplicationStatusPanel: React.FC<ApplicationStatusPanelProps> = ({
  selectedExamId,
  onNext,
}) => {
  const [selectedApplication, setSelectedApplication] =
    useState<QualifyingExamApplication | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  // Fetch applications for the selected exam
  const { data: applicationsData, isLoading: isLoadingApplications } = useQuery(
    {
      queryKey: ["phd-qualifying-exam-applications", selectedExamId],
      queryFn: async () => {
        if (!selectedExamId) return null;
        const response = await api.get<{
          exam: {
            id: string;
            semester: string;
            academic_year: string;
            exam_date: string;
            application_deadline: string;
          };
          applications: QualifyingExamApplication[];
        }>(
          `/phd/drcMember/getQualifyingExamApplications?examId=${selectedExamId}`
        );
        return response.data;
      },
      enabled: !!selectedExamId,
    }
  );

  // Mutation for updating application status
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      applicationId,
      status,
      comments,
    }: {
      applicationId: number;
      status: "applied" | "verified" | "resubmit";
      comments?: string;
    }) => {
      const response = await api.patch<{ success: boolean; message: string }>(
        `/phd/drcMember/updateApplicationStatus/${applicationId}`,
        {
          status,
          comments,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["phd-qualifying-exam-applications", selectedExamId],
      });
      setIsDetailsDialogOpen(false);
      toast.success("Application status updated successfully");
    },
    onError: (error: Error & { response?: { data?: string } }) => {
      const errorMessage: string =
        error.response?.data || "Failed to update application status";
      toast.error(errorMessage);
    },
  });

  const handleStatusUpdate = (
    applicationId: number,
    status: "applied" | "verified" | "resubmit",
    comments?: string
  ) => {
    updateStatusMutation.mutate({ applicationId, status, comments });
  };

  const handleViewDetails = (application: QualifyingExamApplication) => {
    setSelectedApplication(application);
    setIsDetailsDialogOpen(true);
  };

  // Calculate statistics
  const applications = applicationsData?.applications || [];
  const totalApplications = applications.length;
  const verifiedApplications = applications.filter(
    (app) => app.status === "verified"
  ).length;
  const resubmitApplications = applications.filter(
    (app) => app.status === "resubmit"
  ).length;
  const appliedApplications = applications.filter(
    (app) => app.status === "applied"
  ).length;

  // Check if user can proceed to next step
  const canProceedToNext = selectedExamId && verifiedApplications > 0;

  if (isLoadingApplications) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
        <span className="ml-2">Loading applications...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Applications Content */}
      {selectedExamId && (
        <>
          {/* Statistics Section */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="flex items-center p-6">
                <FileText className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Applications
                  </p>
                  <p className="text-2xl font-bold">{totalApplications}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center p-6">
                <Users className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Verified</p>
                  <p className="text-2xl font-bold text-green-600">
                    {verifiedApplications}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center p-6">
                <RefreshCw className="h-8 w-8 text-yellow-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Resubmit</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {resubmitApplications}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center p-6">
                <Filter className="h-8 w-8 text-gray-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Pending Review
                  </p>
                  <p className="text-2xl font-bold text-gray-600">
                    {appliedApplications}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Applications Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Student Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {applications.length > 0 ? (
                <ApplicationsDataTable
                  data={applications}
                  onViewDetails={handleViewDetails}
                />
              ) : (
                <div className="py-8 text-center">
                  <Users className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <h3 className="mb-2 text-lg font-medium text-gray-900">
                    No Applications Found
                  </h3>
                  <p className="text-gray-500">
                    No student applications have been submitted for this
                    qualifying exam yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          {onNext && canProceedToNext && (
            <div className="flex justify-end">
              <Button onClick={onNext} className="flex items-center gap-2">
                Continue to Generate Forms
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Show message if no verified applications */}
          {onNext && !canProceedToNext && applications.length > 0 && (
            <div className="py-4 text-center">
              <p className="text-gray-600">
                You need at least one verified application to proceed to the
                next step.
              </p>
            </div>
          )}
        </>
      )}

      {/* Application Details Dialog */}
      <ApplicationDetailsDialog
        application={selectedApplication}
        isOpen={isDetailsDialogOpen}
        onClose={() => setIsDetailsDialogOpen(false)}
        onStatusUpdate={handleStatusUpdate}
      />
    </div>
  );
};

export default ApplicationStatusPanel;
