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
import { Separator } from "@/components/ui/separator";

interface DrcConvenerFinalThesisFormProps {
  request: { id: number; status: string };
  onSuccess: () => void;
}

export const DrcConvenerFinalThesisForm: React.FC<
  DrcConvenerFinalThesisFormProps
> = ({ request, onSuccess }) => {
  const [comments, setComments] = useState("");
  const [selectedDrcMembers, setSelectedDrcMembers] = useState<string[]>([]);
  const [action, setAction] = useState<string>("");

  const { data: facultyList = [] } = useQuery<ComboboxOption[]>({
    queryKey: ["facultyList"],
    queryFn: async () => {
      const res = await api.get("/phd/proposal/getFacultyList");
      return res.data.map((f: { name: string; email: string }) => ({
        label: `${f.name} (${f.email})`,
        value: f.email,
      }));
    },
  });

  const mutation = useMutation({
    mutationFn: (data: phdRequestSchemas.FinalThesisReviewerBody) =>
      api.post(
        `/phd-request/drc-convener/review-final-thesis/${request.id}`,
        data
      ),
    onSuccess: () => {
      toast.success("Action submitted successfully.");
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to submit action.");
    },
  });

  const handleSubmit = (
    currentAction: "approve" | "revert" | "forward_to_drc"
  ) => {
    setAction(currentAction);

    let data: any = { action: currentAction, comments };

    if (currentAction === "revert" && !comments.trim()) {
      toast.error("Comments are required to revert a request.");
      return;
    }
    if (currentAction === "forward_to_drc") {
      data.assignedDrcMembers = selectedDrcMembers;
    }

    const parseResult =
      phdRequestSchemas.finalThesisReviewerSchema.safeParse(data);
    if (!parseResult.success) {
      toast.error(parseResult.error.errors[0].message);
      return;
    }
    mutation.mutate(parseResult.data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>DRC Convener: Final Thesis Review</CardTitle>
        <CardDescription>
          Review the final thesis submission and take appropriate action.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="comments">Comments</Label>
          <Textarea
            id="comments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Provide comments for reversion or internal notes for other actions."
          />
        </div>
        <Separator />
        <div className="space-y-2">
          <Label>Forward to DRC Members for Review (Optional)</Label>
          <Combobox
            options={facultyList}
            selectedValues={selectedDrcMembers}
            onSelectedValuesChange={setSelectedDrcMembers}
            placeholder="Select DRC members..."
            searchPlaceholder="Search faculty..."
            emptyPlaceholder="No faculty found."
          />
          <p className="text-sm text-muted-foreground">
            If no members are selected, approving will forward the request
            directly to the HOD.
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button
            variant="destructive"
            onClick={() => handleSubmit("revert")}
            disabled={mutation.isLoading}
          >
            {mutation.isLoading && action === "revert" ? (
              <LoadingSpinner />
            ) : (
              "Revert to Student"
            )}
          </Button>
          <Button
            onClick={() => {
              const finalAction =
                selectedDrcMembers.length > 0 ? "forward_to_drc" : "approve";
              handleSubmit(finalAction);
            }}
            disabled={mutation.isLoading}
          >
            {mutation.isLoading && action !== "revert" ? (
              <LoadingSpinner />
            ) : selectedDrcMembers.length > 0 ? (
              "Forward to DRC"
            ) : (
              "Approve & Forward to HOD"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
