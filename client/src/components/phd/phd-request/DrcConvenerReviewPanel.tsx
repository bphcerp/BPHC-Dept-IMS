import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
import { LoadingSpinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface DrcConvenerReviewPanelProps {
  request: { id: number; status: string };
  onSuccess: () => void;
}

export const DrcConvenerReviewPanel: React.FC<DrcConvenerReviewPanelProps> = ({
  request,
  onSuccess,
}) => {
  const [comments, setComments] = useState("");
  const [selectedDrcMembers, setSelectedDrcMembers] = useState<string[]>([]);

  const { data: facultyList = [] } = useQuery<ComboboxOption[]>({
    queryKey: ["facultyList", "drc"],
    queryFn: async () => {
      const res = await api.get("/phd/proposal/getFacultyList?role=drc");
      return res.data.map((f: { name: string; email: string }) => ({
        label: `${f.name} (${f.email})`,
        value: f.email,
      }));
    },
  });

  const mutation = useMutation({
    mutationFn: (data: phdRequestSchemas.DrcConvenerReviewBody) => {
      return api.post(`/phd-request/drc-convener/review/${request.id}`, data);
    },
    onSuccess: () => {
      toast.success("Action submitted successfully.");
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to submit action.");
    },
  });

  const handleSubmit = (
    action: phdRequestSchemas.DrcConvenerReviewBody["action"]
  ) => {
    if (action === "revert" && !comments.trim()) {
      return toast.error("Comments are required to revert a request.");
    }
    if (action === "forward_to_drc" && selectedDrcMembers.length === 0) {
      return toast.error(
        "Please select at least one DRC member to forward for review."
      );
    }
    mutation.mutate({
      comments,
      action,
      assignedDrcMembers: selectedDrcMembers,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>DRC Convener Action Panel</CardTitle>
        <CardDescription>
          Review the request and decide the next step in the workflow.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {request.status === "drc_convener_review" && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Final Decision Required</AlertTitle>
            <AlertDescription>
              The DRC member review is complete. Please review their feedback in
              the history below and make a final decision to approve or revert.
            </AlertDescription>
          </Alert>
        )}
        {request.status === "drc_member_review" && (
          <Alert variant="destructive">
            <Info className="h-4 w-4" />
            <AlertTitle>Bypass Option</AlertTitle>
            <AlertDescription>
              This request is currently with DRC members for review. You can
              wait for their feedback or choose "Bypass & Forward to HOD" to
              approve it immediately.
            </AlertDescription>
          </Alert>
        )}
        <div className="space-y-2">
          <Label htmlFor="comments">Comments</Label>
          <Textarea
            id="comments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Provide comments for reversion or internal notes for approval..."
          />
        </div>

        {request.status === "supervisor_submitted" && (
          <div className="space-y-2">
            <Label>Assign DRC Members for Review (Optional)</Label>
            <Combobox
              options={facultyList}
              selectedValues={selectedDrcMembers}
              onSelectedValuesChange={setSelectedDrcMembers}
              placeholder="Select DRC members..."
              searchPlaceholder="Search DRC members..."
              emptyPlaceholder="No DRC members found."
            />
            <p className="text-sm text-muted-foreground">
              If no members are selected, you can forward directly to the HOD.
            </p>
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
          <Button
            variant="destructive"
            onClick={() => handleSubmit("revert")}
            disabled={mutation.isLoading}
          >
            Revert to Supervisor
          </Button>

          {request.status === "supervisor_submitted" && (
            <Button
              onClick={() =>
                handleSubmit(
                  selectedDrcMembers.length > 0
                    ? "forward_to_drc"
                    : "forward_to_hod"
                )
              }
              disabled={mutation.isLoading}
            >
              {selectedDrcMembers.length > 0
                ? `Forward to ${selectedDrcMembers.length} DRC Member(s)`
                : "Forward to HOD"}
            </Button>
          )}

          {(request.status === "drc_convener_review" ||
            request.status === "drc_member_review") && (
            <Button
              onClick={() => handleSubmit("approve")}
              disabled={mutation.isLoading}
            >
              {request.status === "drc_member_review"
                ? "Bypass & Forward to HOD"
                : "Approve and Forward to HOD"}
            </Button>
          )}
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
