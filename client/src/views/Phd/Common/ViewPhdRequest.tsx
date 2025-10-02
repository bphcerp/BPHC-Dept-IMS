import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { useAuth } from "@/hooks/Auth";
import { LoadingSpinner } from "@/components/ui/spinner";
import BackButton from "@/components/BackButton";
import { RequestDetailsCard } from "@/components/phd/phd-request/RequestDetailsCard";
import { RequestStatusStepper } from "@/components/phd/phd-request/RequestStatusStepper";
import { DrcConvenerReviewPanel } from "@/components/phd/phd-request/DrcConvenerReviewPanel";
import { DrcMemberReviewPanel } from "@/components/phd/phd-request/DrcMemberReviewPanel";
import { HodReviewPanel } from "@/components/phd/phd-request/HodReviewPanel";
import { StudentFinalThesisForm } from "@/components/phd/phd-request/StudentFinalThesisForm";
import { SupervisorFinalThesisReviewForm } from "@/components/phd/phd-request/SupervisorFinalThesisForm";
import { SupervisorResubmitForm } from "@/components/phd/phd-request/SupervisorResubmitForm";
import { DrcConvenerFinalThesisForm } from "@/components/phd/phd-request/DrcConvenerFinalThesisForm";
import { HodFinalThesisForm } from "@/components/phd/phd-request/HodFinalThesisForm";
import { phdRequestSchemas } from "lib";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Edit, Eye } from "lucide-react";
import { FinalThesisPreview } from "@/components/phd/phd-request/FinalThesisPreview";
import { toast } from "sonner";

interface PhdRequestDetails {
  id: number;
  requestType: string;
  status: (typeof phdRequestSchemas.phdRequestStatuses)[number];
  comments: string | null;
  student: { name: string; email: string };
  supervisor: { name: string; email: string };
  documents: Array<{
    id: number;
    documentType: string;
    isPrivate: boolean;
    file: { originalName: string; id: number };
  }>;
  reviews: Array<{
    reviewer: { name: string; email: string };
    approved: boolean;
    comments: string | null;
    studentComments: string | null;
    supervisorComments: string | null;
    createdAt: string;
    status_at_review: string | null;
    reviewerDisplayName: string;
    reviewerRole: string;
  }>;
  drcAssignments: Array<{ drcMemberEmail: string; status: string }>;
}

const ViewPhdRequest: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { authState, checkAccess } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["phd-request-details", id];

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const {
    data: request,
    isLoading,
    isError,
  } = useQuery<PhdRequestDetails>({
    queryKey,
    queryFn: async () => {
      const res = await api.get(`/phd-request/details/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const handleSuccess = async () => {
    setIsEditOpen(false);
    setIsPreviewOpen(false);
    await queryClient.invalidateQueries({ queryKey });
    await queryClient.invalidateQueries({
      queryKey: ["drc-convener-requests"],
    });
    await queryClient.invalidateQueries({ queryKey: ["drc-member-requests"] });
    await queryClient.invalidateQueries({ queryKey: ["hod-requests"] });
    await queryClient.invalidateQueries({
      queryKey: ["supervisor-my-students"],
    });
  };

  const handleFinalSubmit = async () => {
    try {
      const formData = new FormData();
      formData.append("submissionType", "final");
      formData.append("comments", request?.comments ?? "");

      await api.post(
        `/phd-request/student/submit-final-thesis/${id}`,
        formData
      );
      toast.success("Final thesis documents submitted for supervisor review.");
      handleSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Submission failed.");
    }
  };

  const renderActionPanel = () => {
    if (!request || !authState) return null;
    const { status, student, supervisor, requestType, id: requestId } = request;

    if (authState.email === student.email && status === "student_review") {
      if (requestType === "final_thesis_submission") {
        return (
          <div className="flex gap-4">
            <Button onClick={() => setIsEditOpen(true)} className="flex-1">
              <Edit className="mr-2 h-4 w-4" /> Edit Submission
            </Button>
            <Button
              onClick={() => setIsPreviewOpen(true)}
              className="flex-1"
              variant="outline"
            >
              <Eye className="mr-2 h-4 w-4" /> Preview & Submit
            </Button>
          </div>
        );
      }
    }

    if (authState.email === supervisor.email) {
      const revertableStatuses: (typeof phdRequestSchemas.phdRequestStatuses)[number][] =
        [
          "reverted_by_drc_convener",
          "reverted_by_drc_member",
          "reverted_by_hod",
        ];
      if (revertableStatuses.includes(status)) {
        return (
          <SupervisorResubmitForm
            requestId={requestId}
            onSuccess={handleSuccess}
          />
        );
      }
      if (status === "supervisor_review_final_thesis") {
        return (
          <SupervisorFinalThesisReviewForm
            request={request}
            onSuccess={handleSuccess}
          />
        );
      }
    }

    if (checkAccess("phd-request:drc-convener:review")) {
      if (requestType === "final_thesis_submission") {
        if (
          [
            "drc_convener_review",
            "drc_member_review",
            "supervisor_submitted",
          ].includes(status)
        ) {
          return (
            <DrcConvenerFinalThesisForm
              request={request}
              onSuccess={handleSuccess}
            />
          );
        }
      } else {
        if (["supervisor_submitted", "drc_convener_review"].includes(status)) {
          return (
            <DrcConvenerReviewPanel
              request={request}
              onSuccess={handleSuccess}
            />
          );
        }
      }
    }

    if (
      checkAccess("phd-request:drc-member:review") &&
      status === "drc_member_review"
    ) {
      return (
        <DrcMemberReviewPanel request={request} onSuccess={handleSuccess} />
      );
    }

    if (checkAccess("phd-request:hod:review") && status === "hod_review") {
      if (requestType === "final_thesis_submission") {
        return (
          <HodFinalThesisForm request={request} onSuccess={handleSuccess} />
        );
      } else {
        return <HodReviewPanel request={request} onSuccess={handleSuccess} />;
      }
    }

    return null;
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError || !request) {
    return (
      <div className="p-8 text-center text-destructive">
        Failed to load request details.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton />
      <RequestDetailsCard request={request} />
      <RequestStatusStepper reviews={request.reviews} request={request} />
      <div className="mt-6">{renderActionPanel()}</div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Final Thesis Submission</DialogTitle>
            <DialogDescription>
              Replace documents and save your changes. Your submission will not
              be finalized until you submit from the preview screen.
            </DialogDescription>
          </DialogHeader>
          <StudentFinalThesisForm request={request} onSuccess={handleSuccess} />
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview Final Thesis Submission</DialogTitle>
            <DialogDescription>
              Review all documents and comments before final submission to your
              supervisor.
            </DialogDescription>
          </DialogHeader>
          <FinalThesisPreview
            files={request.documents
              .filter((doc) => !doc.isPrivate)
              .map((doc) => ({
                label: doc.documentType,
                fileName: doc.file.originalName,
                isNew: false,
              }))}
            comments={request.comments || ""}
          />
          <Button onClick={handleFinalSubmit} className="mt-4 w-full">
            Submit to Supervisor
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ViewPhdRequest;
