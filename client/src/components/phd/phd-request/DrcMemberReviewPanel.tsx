import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { phdRequestSchemas } from "lib";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/spinner";
import { toast } from "sonner";

interface DrcMemberReviewPanelProps {
  request: { id: number };
  onSuccess: () => void;
}

export const DrcMemberReviewPanel: React.FC<DrcMemberReviewPanelProps> = ({
  request,
  onSuccess,
}) => {
  const [comments, setComments] = useState("");

  const mutation = useMutation({
    mutationFn: (data: phdRequestSchemas.ReviewerBody) => {
      return api.post(`/phd-request/drc-member/review/${request.id}`, data);
    },
    onSuccess: () => {
      toast.success("Feedback submitted successfully to the DRC Convener.");
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to submit feedback."
      );
    },
  });

  const handleSubmit = (approved: boolean) => {
    if (!approved && !comments.trim()) {
      toast.error(
        "Comments are mandatory if you are not recommending approval."
      );
      return;
    }
    mutation.mutate({ approved, comments });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Feedback</CardTitle>
        <CardDescription>
          Your recommendation and comments will be forwarded to the DRC Convener
          for the final decision.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="comments">Comments</Label>
          <Textarea
            id="comments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Your comments are required if you do not recommend approval."
          />
        </div>
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button
            variant="outline"
            onClick={() => handleSubmit(false)}
            disabled={mutation.isLoading}
          >
            Forward with Comments
          </Button>
          <Button
            onClick={() => handleSubmit(true)}
            disabled={mutation.isLoading}
          >
            Recommend Approval
          </Button>
        </div>
        {mutation.isLoading && (
          <div className="flex justify-center">
            <LoadingSpinner />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
