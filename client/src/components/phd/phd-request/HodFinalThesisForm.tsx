// client/src/components/phd/phd-request/HodFinalThesisForm.tsx
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
import { Separator } from "@/components/ui/separator";

export const HodFinalThesisForm: React.FC<{
  request: { id: number };
  onSuccess: () => void;
}> = ({ request, onSuccess }) => {
  const [studentComments, setStudentComments] = useState("");
  const [supervisorComments, setSupervisorComments] = useState("");
  const [internalComments, setInternalComments] = useState("");
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

  const handleSubmit = (currentAction: "approve" | "revert") => {
    setAction(currentAction);
    let data: any = { action: currentAction, comments: internalComments };

    if (currentAction === "revert") {
      data.revertTo = revertTo;
      data.studentComments = studentComments;
      data.supervisorComments = supervisorComments;
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
          <Label htmlFor="internal-comments-hod">
            Internal Comments (Optional)
          </Label>
          <Textarea
            id="internal-comments-hod"
            value={internalComments}
            onChange={(e) => setInternalComments(e.target.value)}
            placeholder="Comments for internal record."
          />
        </div>

        <Separator />

        <div className="space-y-4 rounded-md border p-4">
          <h3 className="font-semibold">Reversion Options</h3>
          <div className="space-y-2">
            <Label>Revert To:</Label>
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
          {(revertTo === "student" || revertTo === "both") && (
            <div className="space-y-2">
              <Label htmlFor="studentComments-hod">Comments for Student</Label>
              <Textarea
                id="studentComments-hod"
                value={studentComments}
                onChange={(e) => setStudentComments(e.target.value)}
                placeholder="Visible to student and supervisor."
              />
            </div>
          )}
          {(revertTo === "supervisor" || revertTo === "both") && (
            <div className="space-y-2">
              <Label htmlFor="supervisorComments-hod">
                Comments for Supervisor
              </Label>
              <Textarea
                id="supervisorComments-hod"
                value={supervisorComments}
                onChange={(e) => setSupervisorComments(e.target.value)}
                placeholder="Visible only to supervisor."
              />
            </div>
          )}
          <Button
            variant="destructive"
            onClick={() => handleSubmit("revert")}
            disabled={mutation.isLoading || !revertTo}
          >
            {mutation.isLoading && action === "revert" ? (
              <LoadingSpinner />
            ) : (
              "Revert"
            )}
          </Button>
        </div>

        <div className="flex justify-end gap-2 border-t pt-4">
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
