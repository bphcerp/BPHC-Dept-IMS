import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Edit, Eye, ShieldAlert, Check, X } from "lucide-react";
import { FinalThesisPreview } from "@/components/phd/phd-request/FinalThesisPreview";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

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
  const [isEditRequestOpen, setIsEditRequestOpen] = useState(false);
  const [editRequestComments, setEditRequestComments] = useState("");

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

  const finalSubmitMutation = useMutation({
    mutationFn: (formData: FormData) => {
      if (!request) throw new Error("Request data not loaded");
      return api.post(
        `/phd-request/student/submit-final-thesis/${request.id}`,
        formData
      );
    },
    onSuccess: () => {
      toast.success("Final thesis documents submitted for supervisor review.");
      handleSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Submission failed.");
    },
  });

  const handleFinalSubmit = async () => {
    if (!request) return;
    const formData = new FormData();
    formData.append("submissionType", "final");
    formData.append("comments", request.comments || "");
    finalSubmitMutation.mutate(formData);
  };

  const requestEditMutation = useMutation({
    mutationFn: () => api.post(`/phd-request/supervisor/request-edit/${id}`),
    onSuccess: () => {
      toast.success("Edit request submitted to DRC Convener.");
      setIsEditRequestOpen(false);
      void queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to submit request.");
    },
  });

  const reviewEditMutation = useMutation({
    mutationFn: (data: { approve: boolean; comments?: string }) =>
      api.post(`/phd-request/drc-convener/review-edit/${id}`, data),
    onSuccess: () => {
      toast.success("Edit request reviewed.");
      setEditRequestComments("");
      void handleSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to review request.");
    },
  });

  const renderActionPanel = () => {
    if (!request || !authState) return null;
    const { status, student, supervisor, requestType, id: requestId } = request;

    const isSupervisor = authState.email === supervisor.email;
    const isStudent = authState.email === student.email;
    const isDRC = checkAccess("phd-request:drc-convener:review");
    const isHOD = checkAccess("phd-request:hod:review");

    const revertableStatuses: (typeof phdRequestSchemas.phdRequestStatuses)[number][] =
      ["reverted_by_drc_convener", "reverted_by_drc_member", "reverted_by_hod"];
    const lockedForSupervisorStatuses: (typeof phdRequestSchemas.phdRequestStatuses)[number][] =
      [
        "drc_convener_review",
        "drc_member_review",
        "hod_review",
        "supervisor_review_final_thesis",
      ];
    const hodOverrideStatuses: (typeof phdRequestSchemas.phdRequestStatuses)[number][] =
      [
        "supervisor_submitted",
        "drc_convener_review",
        "drc_member_review",
        "hod_review",
      ];
    const hodOverrideFinalThesisStatuses: (typeof phdRequestSchemas.phdRequestStatuses)[number][] =
      [
        "supervisor_review_final_thesis",
        "drc_convener_review",
        "drc_member_review",
        "hod_review",
      ];

    // 1. Student Actions
    if (isStudent && status === "student_review") {
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

    // 2. Supervisor Actions (ACTIVE ACTIONS ONLY)
    // We check only for actions where the supervisor needs to DO something (resubmit, initial review).
    // We moved the "Request Edit" logic (where supervisor is waiting) to the END.
    if (isSupervisor) {
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

    // 3. DRC Convener Actions
    if (isDRC) {
      if (status === "pending_edit_approval") {
        return (
          <Card>
            <CardHeader>
              <CardTitle>Review Edit Request</CardTitle>
              <CardDescription>
                The supervisor has requested to edit this submission. Approving
                will revert it to an editable state.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Label htmlFor="edit-comments">Comments (Optional)</Label>
              <Textarea
                id="edit-comments"
                placeholder="Add comments for the supervisor..."
                value={editRequestComments}
                onChange={(e) => setEditRequestComments(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="destructive"
                  onClick={() =>
                    reviewEditMutation.mutate({
                      approve: false,
                      comments: editRequestComments,
                    })
                  }
                  disabled={reviewEditMutation.isLoading}
                >
                  <X className="mr-2 h-4 w-4" /> Reject Edit
                </Button>
                <Button
                  onClick={() =>
                    reviewEditMutation.mutate({
                      approve: true,
                      comments: editRequestComments,
                    })
                  }
                  disabled={reviewEditMutation.isLoading}
                >
                  <Check className="mr-2 h-4 w-4" /> Approve Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      }
      if (requestType === "final_thesis_submission") {
        if (
          [
            "drc_convener_review",
            "drc_member_review",
            "supervisor_review_final_thesis",
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
        if (
          [
            "supervisor_submitted",
            "drc_convener_review",
            "drc_member_review",
          ].includes(status)
        ) {
          return (
            <DrcConvenerReviewPanel
              request={request}
              onSuccess={handleSuccess}
            />
          );
        }
      }
    }

    // 4. DRC Member Actions
    if (
      checkAccess("phd-request:drc-member:review") &&
      status === "drc_member_review"
    ) {
      return (
        <DrcMemberReviewPanel request={request} onSuccess={handleSuccess} />
      );
    }

    // 5. HOD Actions (Bypass)
    // Placed here so that if a user is BOTH Supervisor/DRC and HOD, they see the HOD action
    // when the request is at the HOD stage, instead of the Supervisor "Request Edit" button.
    if (isHOD) {
      if (
        requestType === "final_thesis_submission" &&
        hodOverrideFinalThesisStatuses.includes(status)
      ) {
        return (
          <HodFinalThesisForm request={request} onSuccess={handleSuccess} />
        );
      }
      if (
        requestType !== "final_thesis_submission" &&
        hodOverrideStatuses.includes(status)
      ) {
        return <HodReviewPanel request={request} onSuccess={handleSuccess} />;
      }
    }

    // 6. Supervisor Actions (PASSIVE/LOCKED)
    // This is the catch-all for supervisors who are waiting.
    // We place it last so it doesn't block HOD/DRC actions if the user has multiple roles.
    if (isSupervisor) {
      if (lockedForSupervisorStatuses.includes(status)) {
        return (
          <Button variant="outline" onClick={() => setIsEditRequestOpen(true)}>
            <ShieldAlert className="mr-2 h-4 w-4" /> Request Edit Access from
            DRC
          </Button>
        );
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

      {/* Dialog for Student Edit (Final Thesis) */}
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

      {/* Dialog for Student Preview (Final Thesis) */}
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
                fileId: doc.file.id,
              }))}
            comments={request.comments || ""}
          />
          <Button
            onClick={handleFinalSubmit}
            className="mt-4 w-full"
            disabled={finalSubmitMutation.isLoading}
          >
            {finalSubmitMutation.isLoading && (
              <LoadingSpinner className="mr-2 h-4 w-4" />
            )}
            Submit to Supervisor
          </Button>
        </DialogContent>
      </Dialog>

      {/* Dialog for Supervisor to Request Edit */}
      <AlertDialog open={isEditRequestOpen} onOpenChange={setIsEditRequestOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request Edit Access?</AlertDialogTitle>
            <AlertDialogDescription>
              This will send a request to the DRC Convener. If approved, the
              submission will be reverted to an editable state.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => requestEditMutation.mutate()}
              disabled={requestEditMutation.isLoading}
            >
              {requestEditMutation.isLoading && (
                <LoadingSpinner className="mr-2 h-4 w-4" />
              )}
              Send Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ViewPhdRequest;
