// client/src/components/phd/proposal/DrcReviewForm.tsx
import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingSpinner } from "@/components/ui/spinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

interface DacMember {
  dacMember: {
    name: string | null;
    email: string;
  };
}

interface DrcReviewFormProps {
  proposalId: number;
  suggestedDacMembers: DacMember[];
  onSuccess: () => void;
}

export const DrcReviewForm: React.FC<DrcReviewFormProps> = ({
  proposalId,
  suggestedDacMembers,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [selectedDac, setSelectedDac] = useState<string[]>([]);
  const [comments, setComments] = useState("");

  useEffect(() => {
    // Pre-select all suggested members initially
    setSelectedDac(suggestedDacMembers.map((m) => m.dacMember.email));
  }, [suggestedDacMembers]);

  const mutation = useMutation({
    mutationFn: (data: {
      action: "accept" | "revert";
      comments?: string;
      selectedDacMembers?: string[];
    }) =>
      api.post(`/phd/proposal/drcConvener/reviewProposal/${proposalId}`, data),
    onSuccess: () => {
      toast.success("DRC review submitted successfully!");
      void queryClient.invalidateQueries({
        queryKey: ["drc-proposal-view", proposalId],
      });
      void queryClient.invalidateQueries({ queryKey: ["drc-proposals"] });
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to submit DRC review."
      );
    },
  });

  const handleAccept = () => {
    if (selectedDac.length !== 2) {
      toast.error("You must select exactly 2 DAC members to approve.");
      return;
    }
    mutation.mutate({
      action: "accept",
      selectedDacMembers: selectedDac,
      comments: comments || undefined,
    });
  };

  const handleRevert = () => {
    if (!comments.trim()) {
      toast.error("Comments are required to revert the proposal.");
      return;
    }
    mutation.mutate({ action: "revert", comments });
  };

  const handleCheckboxChange = (email: string, checked: boolean) => {
    setSelectedDac((prev) =>
      checked ? [...prev, email] : prev.filter((e) => e !== email)
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>DRC Convenor Review</CardTitle>
        <CardDescription>
          Select exactly two DAC members and provide comments if necessary.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="font-semibold">
            Finalize Doctoral Advisory Committee (DAC)
          </Label>
          <p className="text-sm text-muted-foreground">
            Supervisor suggested the following members. Please select exactly
            two to proceed.
          </p>
          <div className="mt-2 space-y-2 rounded-md border p-4">
            {suggestedDacMembers.map((member) => (
              <div
                key={member.dacMember.email}
                className="flex items-center space-x-2"
              >
                <Checkbox
                  id={member.dacMember.email}
                  checked={selectedDac.includes(member.dacMember.email)}
                  onCheckedChange={(checked) =>
                    handleCheckboxChange(
                      member.dacMember.email,
                      checked as boolean
                    )
                  }
                />
                <Label htmlFor={member.dacMember.email}>
                  {member.dacMember.name} ({member.dacMember.email})
                </Label>
              </div>
            ))}
          </div>
          {selectedDac.length !== 2 && (
            <p className="mt-2 text-xs text-destructive">
              Please select exactly 2 members.
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="comments">Comments</Label>
          <Textarea
            id="comments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Provide comments for the student or for internal record..."
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="destructive"
            onClick={handleRevert}
            disabled={mutation.isLoading}
          >
            {mutation.isLoading ? <LoadingSpinner /> : "Revert to Student"}
          </Button>
          <Button
            onClick={handleAccept}
            disabled={mutation.isLoading || selectedDac.length !== 2}
          >
            {mutation.isLoading ? (
              <LoadingSpinner />
            ) : (
              "Accept and Forward to DAC"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
