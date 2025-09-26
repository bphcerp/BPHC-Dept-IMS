// client/src/components/phd/phd-request/HodReviewPanel.tsx
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

interface HodReviewPanelProps {
  request: { id: number };
  onSuccess: () => void;
}

export const HodReviewPanel: React.FC<HodReviewPanelProps> = ({
  request,
  onSuccess,
}) => {
  const [comments, setComments] = useState("");

  const mutation = useMutation({
    mutationFn: (data: phdRequestSchemas.ReviewerBody) => {
      return api.post(`/phd/request/hod/review/${request.id}`, data);
    },
    onSuccess: () => {
      toast.success("Final decision submitted successfully.");
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to submit decision."
      );
    },
  });

  const handleSubmit = (approved: boolean) => {
    if (!approved && !comments.trim()) {
      return toast.error("Comments are required to revert a request.");
    }
    mutation.mutate({ approved, comments: comments || "Approved by HOD" });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>HOD Final Approval</CardTitle>
        <CardDescription>
          Provide the final decision for this request.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="comments">Comments</Label>
          <Textarea
            id="comments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Comments are mandatory if you revert..."
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
            Final Approve
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
