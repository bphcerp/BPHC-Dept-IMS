// client/src/components/phd/phd-request/DrcMemberReviewPanel.tsx
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
      return api.post(`/phd/request/drc-member/review/${request.id}`, data);
    },
    onSuccess: () => {
      toast.success("Review submitted successfully.");
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to submit review.");
    },
  });

  const handleSubmit = (approved: boolean) => {
    if (!approved && !comments.trim()) {
      return toast.error("Comments are required to revert a request.");
    }
    mutation.mutate({ approved, comments: comments || "Approved" });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Review</CardTitle>
        <CardDescription>
          Approve the request or revert it with comments.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="comments">Comments</Label>
          <Textarea
            id="comments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Comments are mandatory if you revert the request..."
          />
        </div>
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button
            variant="destructive"
            onClick={() => handleSubmit(false)}
            disabled={mutation.isLoading}
          >
            Revert
          </Button>
          <Button
            onClick={() => handleSubmit(true)}
            disabled={mutation.isLoading}
          >
            Approve
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
