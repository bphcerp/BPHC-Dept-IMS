import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
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
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/spinner";
import { phdRequestSchemas } from "lib";
import { Separator } from "@/components/ui/separator";

export const HodFinalThesisForm: React.FC<{
  request: { id: number };
  onSuccess: () => void;
}> = ({ request, onSuccess }) => {
  const [comments, setComments] = useState("");
  const [action, setAction] = useState<"approve" | "revert" | "">("");

  const mutation = useMutation({
    mutationFn: (data: phdRequestSchemas.HodFinalThesisReviewerBody) =>
      api.post(`/phd-request/hod/review-final-thesis/${request.id}`, data),
    onSuccess: () => {
      toast.success("Final decision submitted.");
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to submit decision."
      );
    },
  });

  const handleSubmit = (currentAction: "approve" | "revert") => {
    setAction(currentAction);

    if (currentAction === "revert" && !comments.trim()) {
      toast.error("Comments are required to revert a request.");
      return;
    }

    const data: any = { action: currentAction, comments };

    const parseResult =
      phdRequestSchemas.hodFinalThesisReviewerSchema.safeParse(data);
    if (!parseResult.success) {
      toast.error(parseResult.error.errors[0].message);
      return;
    }
    mutation.mutate(parseResult.data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>HOD: Final Thesis Approval</CardTitle>
        <CardDescription>
          Provide the final decision for this thesis submission.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="comments-hod">Comments</Label>
          <Textarea
            id="comments-hod"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Comments are required if reverting. These will be visible to the student and supervisor."
          />
        </div>
        <Separator />
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button
            variant="destructive"
            onClick={() => handleSubmit("revert")}
            disabled={mutation.isLoading}
          >
            {mutation.isLoading && action === "revert" ? (
              <LoadingSpinner />
            ) : (
              "Revert"
            )}
          </Button>
          <Button
            onClick={() => handleSubmit("approve")}
            disabled={mutation.isLoading}
          >
            {mutation.isLoading && action === "approve" ? (
              <LoadingSpinner className="mr-2 h-4 w-4" />
            ) : null}
            Final Approve
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
