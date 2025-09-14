import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/spinner";
import { Combobox } from "@/components/ui/combobox";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { PlusCircle, Edit } from "lucide-react";
import { z } from "zod";
import { phdSchemas } from "lib";

interface SupervisorReviewFormProps {
  proposalId: number;
  onSuccess: () => void;
  deadline: string;
  initialDacMembers?: string[];
  isPostDacRevert?: boolean; // ADDED: This prop is now officially declared
}

interface Faculty {
  value: string;
  label: string;
}

export const SupervisorReviewForm: React.FC<SupervisorReviewFormProps> = ({
  proposalId,
  onSuccess,
  deadline,
  initialDacMembers = [],
  isPostDacRevert = false,
}) => {
  const queryClient = useQueryClient();
  const [comments, setComments] = useState("");
  const [selectedDac, setSelectedDac] = useState<string[]>(initialDacMembers);
  const [externalDacEmail, setExternalDacEmail] = useState("");
  const [isEditingDac, setIsEditingDac] = useState(false);
  const isDeadlinePassed = new Date(deadline) < new Date();

  const { data: facultyList = [] } = useQuery<Faculty[]>({
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
    mutationFn: (
      data: z.infer<typeof phdSchemas.supervisorProposalActionSchema>
    ) =>
      api.post(`/phd/proposal/supervisor/reviewProposal/${proposalId}`, data),
    onSuccess: () => {
      toast.success("Review submitted successfully!");
      void queryClient.invalidateQueries({
        queryKey: ["supervisor-proposal", proposalId.toString()],
      });
      void queryClient.invalidateQueries({
        queryKey: ["supervisor-proposals"],
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to submit review.");
    },
  });

  const handleAddExternalDac = () => {
    const emailCheck = z.string().email().safeParse(externalDacEmail);
    if (!emailCheck.success) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (
      selectedDac.includes(externalDacEmail) ||
      facultyList.some((f) => f.value === externalDacEmail)
    ) {
      toast.error(
        "This email is already in the list or is an existing faculty member."
      );
      return;
    }
    setSelectedDac((prev) => [...prev, externalDacEmail]);
    setExternalDacEmail("");
  };

  const handleRevert = () => {
    if (!comments.trim()) {
      toast.error("Comments are required to revert a proposal.");
      return;
    }
    mutation.mutate({ action: "revert", comments });
  };

  const handleForwardToDac = () => {
    mutation.mutate({ action: "forward", comments: comments || undefined });
  };

  const handleAcceptWithEdits = () => {
    if (selectedDac.length < 2 || selectedDac.length > 4) {
      toast.error("Please select between 2 and 4 DAC members.");
      return;
    }
    mutation.mutate({
      action: "accept",
      comments: comments || undefined,
      dacMembers: selectedDac,
    });
  };

  if (isPostDacRevert && !isEditingDac) {
    return (
      <div className="space-y-4">
        <div>
          <Label>Comments (Optional)</Label>
          <Textarea
            placeholder="Add optional comments for the DAC members..."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={3}
            disabled={isDeadlinePassed}
          />
        </div>
        <div>
          <Label>Finalized DAC Members</Label>
          <div className="space-y-2 rounded-md border p-3">
            {initialDacMembers.map((email) => (
              <p key={email} className="text-sm">
                {email}
              </p>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between border-t pt-4">
          <Button
            variant="outline"
            onClick={() => setIsEditingDac(true)}
            disabled={isDeadlinePassed || mutation.isLoading}
          >
            <Edit className="mr-2 h-4 w-4" /> Edit DAC Members
          </Button>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={handleRevert}
              disabled={mutation.isLoading || isDeadlinePassed}
            >
              Revert to Student
            </Button>
            <Button
              onClick={handleForwardToDac}
              disabled={mutation.isLoading || isDeadlinePassed}
            >
              Accept & Forward 
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Label>Your Review</Label>
      <Textarea
        placeholder="Add your comments here... (Required if reverting)"
        value={comments}
        onChange={(e) => setComments(e.target.value)}
        rows={4}
        disabled={isDeadlinePassed}
      />
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Select DAC Members (2-4 required)</Label>
          <Combobox
            options={facultyList}
            selectedValues={selectedDac}
            onSelectedValuesChange={setSelectedDac}
            placeholder="Search and select faculty..."
            searchPlaceholder="Search faculty..."
            emptyPlaceholder="No faculty found."
            disabled={isDeadlinePassed}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="external-dac">Add External DAC Member</Label>
          <div className="flex gap-2">
            <Input
              id="external-dac"
              placeholder="external.member@domain.com"
              value={externalDacEmail}
              onChange={(e) => setExternalDacEmail(e.target.value)}
              disabled={isDeadlinePassed}
            />
            <Button
              variant="outline"
              size="icon"
              type="button"
              onClick={handleAddExternalDac}
              disabled={!externalDacEmail.trim()}
            >
              <PlusCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t pt-4">
        {isPostDacRevert && isEditingDac && (
          <Button variant="ghost" onClick={() => setIsEditingDac(false)}>
            Cancel Edit
          </Button>
        )}
        <Button
          variant="destructive"
          onClick={handleRevert}
          disabled={mutation.isLoading || isDeadlinePassed}
        >
          Revert to Student
        </Button>
        <Button
          onClick={handleAcceptWithEdits}
          disabled={mutation.isLoading || isDeadlinePassed}
        >
          {mutation.isLoading ? <LoadingSpinner /> : "Accept & Forward"}
        </Button>
      </div>

      {isDeadlinePassed && (
        <p className="mt-2 text-center text-sm text-destructive">
          The deadline to review this proposal has passed.
        </p>
      )}
    </div>
  );
};
