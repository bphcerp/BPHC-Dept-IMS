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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/spinner";
import { phdRequestSchemas } from "lib";

export const HodFinalThesisForm: React.FC<{
  request: { id: number };
  onSuccess: () => void;
}> = ({ request, onSuccess }) => {
  const [comments, setComments] = useState("");
  const [revertTo, setRevertTo] = useState<
    "student" | "supervisor" | "both" | null
  >(null);
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

  const handleSubmit = () => {
    let data: any = { action, comments };
    if (action === "revert") {
      if (!comments.trim() || !revertTo)
        return toast.error("Comments and a revert target are required.");
      data.revertTo = revertTo;
    }

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
            placeholder="Comments are required if you revert the request."
          />
        </div>
        <div className="space-y-2">
          <Label>If Reverting, Revert To:</Label>
          <RadioGroup
            onValueChange={(val) => setRevertTo(val as any)}
            value={revertTo ?? ""}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="student" id="h_student" />
              <Label htmlFor="h_student">Student</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="supervisor" id="h_supervisor" />
              <Label htmlFor="h_supervisor">Supervisor</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="both" id="h_both" />
              <Label htmlFor="h_both">Both Student and Supervisor</Label>
            </div>
          </RadioGroup>
        </div>
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button
            variant="destructive"
            onClick={() => {
              setAction("revert");
              handleSubmit();
            }}
            disabled={mutation.isLoading}
          >
            {mutation.isLoading && action === "revert" ? (
              <LoadingSpinner className="mr-2 h-4 w-4" />
            ) : null}
            Revert
          </Button>
          <Button
            onClick={() => {
              setAction("approve");
              handleSubmit();
            }}
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
