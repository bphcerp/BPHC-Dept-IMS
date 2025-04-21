import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/spinner";

interface ProposalReviewDialogProps {
  studentEmail: string;
  studentName: string;
  onClose: () => void;
}

interface ReviewPayload {
  status: "approved" | "rejected";
  comments?: string;
  studentEmail: string;
}

const ProposalReviewDialog: React.FC<ProposalReviewDialogProps> = ({
  studentEmail,
  studentName,
  onClose,
}) => {
  const [status, setStatus] = useState<"pending" | "accept" | "reject">(
    "pending"
  );
  const [comments, setComments] = useState("");

  const queryClient = useQueryClient();

  const reviewMutation = useMutation<void, Error, ReviewPayload>({
    mutationFn: async (payload) => {
      await api.post("/phd/supervisor/reviewProposalDocument", payload);
    },
    onSuccess: () => {
      toast.success(
        `Proposal ${status === "accept" ? "Accepted" : "Rejected"}`
      );
      void queryClient.invalidateQueries({
        queryKey: ["phd-supervised-students"],
      });
      void queryClient.invalidateQueries({ queryKey: ["phd-proposal-status"] });
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to process proposal review");
    },
  });

  const handleReview = () => {
    const payload: ReviewPayload = {
      status: status === "accept" ? "approved" : "rejected",
      comments: comments.trim() || undefined,
      studentEmail,
    };

    reviewMutation.mutate(payload);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Review Proposal for {studentName}</DialogTitle>
          <DialogDescription>
            Review and take action on the students proposal
          </DialogDescription>
        </DialogHeader>

        {status === "pending" && (
          <div className="flex justify-between">
            <Button variant="destructive" onClick={() => setStatus("reject")}>
              Reject Proposal
            </Button>
            <Button variant="default" onClick={() => setStatus("accept")}>
              Accept Proposal
            </Button>
          </div>
        )}

        {status === "reject" && (
          <div className="space-y-4">
            <Input
              placeholder="Provide comments for rejection"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full"
            />
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStatus("pending")}>
                Back
              </Button>
              <Button
                variant="destructive"
                onClick={handleReview}
                disabled={reviewMutation.isLoading}
              >
                {reviewMutation.isLoading && (
                  <LoadingSpinner className="mr-2" />
                )}
                Confirm Rejection
              </Button>
            </div>
          </div>
        )}

        {status === "accept" && (
          <div className="space-y-4">
            <Input
              placeholder="Optional comments for acceptance"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full"
            />
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStatus("pending")}>
                Back
              </Button>
              <Button
                variant="default"
                onClick={handleReview}
                disabled={reviewMutation.isLoading}
              >
                {reviewMutation.isLoading && (
                  <LoadingSpinner className="mr-2" />
                )}
                Confirm Acceptance
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProposalReviewDialog;
