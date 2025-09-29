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
import { PlusCircle, Edit, X } from "lucide-react";
import { z } from "zod";
import { phdSchemas } from "lib";
import { Badge } from "@/components/ui/badge";

interface SupervisorReviewFormProps {
  proposalId: number;
  onSuccess: () => void;
  deadline: string;
  initialDacMembers?: {
    dacMemberEmail: string;
    dacMemberName: string | null;
  }[];
  isPostDacRevert?: boolean;
}
interface Faculty {
  value: string;
  label: string;
}
interface DacMember {
  email: string;
  name?: string;
  isExternal: boolean;
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
  const [selectedDac, setSelectedDac] = useState<DacMember[]>([]);
  const [externalDacName, setExternalDacName] = useState("");
  const [externalDacEmail, setExternalDacEmail] = useState("");
  const [isEditingDac, setIsEditingDac] = useState(!isPostDacRevert);
  const isDeadlinePassed = new Date(deadline) < new Date();
  const { data: facultyList = [] } = useQuery<Faculty[]>({
    queryKey: ["facultyList"],
    queryFn: async () => {
      const res = await api.get("/phd/proposal/getFacultyList");
      return res.data.map((f: { name: string; email: string }) => ({
        label: `${f.name}(${f.email})`,
        value: f.email,
      }));
    },
  });
  React.useEffect(() => {
    if (facultyList.length > 0 && initialDacMembers.length > 0) {
      const initialMembers = initialDacMembers.map((m) => ({
        email: m.dacMemberEmail,
        name:
          m.dacMemberName ??
          facultyList.find((f) => f.value === m.dacMemberEmail)?.label,
        isExternal: !facultyList.some((f) => f.value === m.dacMemberEmail),
      }));
      setSelectedDac(initialMembers);
    }
  }, [initialDacMembers, facultyList]);
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
    if (!externalDacName.trim() || !emailCheck.success) {
      toast.error("Please enter a valid name and email address.");
      return;
    }
    if (selectedDac.some((d) => d.email === externalDacEmail)) {
      toast.error("This email is already in the list.");
      return;
    }
    setSelectedDac((prev) => [
      ...prev,
      { email: externalDacEmail, name: externalDacName, isExternal: true },
    ]);
    setExternalDacName("");
    setExternalDacEmail("");
  };
  const handleRemoveDac = (emailToRemove: string) => {
    setSelectedDac((prev) => prev.filter((d) => d.email !== emailToRemove));
  };
  const handleInternalDacSelect = (values: string[]) => {
    const newSelections = values.map((email) => {
      const faculty = facultyList.find((f) => f.value === email);
      return { email, name: faculty?.label, isExternal: false };
    });
    const externals = selectedDac.filter((d) => d.isExternal);
    setSelectedDac([...externals, ...newSelections]);
  };
  const handleRevert = () => {
    if (!comments.trim()) {
      toast.error("Comments are required to revert a proposal.");
      return;
    }
    mutation.mutate({ action: "revert", comments });
  };
  const handleAccept = () => {
    if (selectedDac.length < 2 || selectedDac.length > 4) {
      toast.error("Please select between 2 and 4 DAC members.");
      return;
    }
    const dacMembersForApi = selectedDac.map((d) => ({
      email: d.email,
      name: d.isExternal ? d.name : undefined,
    }));
    mutation.mutate({
      action: "accept",
      comments: comments || undefined,
      dacMembers: dacMembersForApi,
    });
  };
  if (isPostDacRevert && !isEditingDac) {
    return (
      <div className="space-y-4">
        <div>
          <Label>Comments(Optional)</Label>
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
            {selectedDac.map((member) => (
              <p key={member.email} className="text-sm">
                {member.name ? `${member.name}(${member.email})` : member.email}
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
              onClick={handleAccept}
              disabled={mutation.isLoading || isDeadlinePassed}
            >
              Accept & Forward to Committee
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
        placeholder="Add your comments here...(Required if reverting)"
        value={comments}
        onChange={(e) => setComments(e.target.value)}
        rows={4}
        disabled={isDeadlinePassed}
      />
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Select Internal DAC Members (from BITS)</Label>
          <Combobox
            options={facultyList}
            selectedValues={selectedDac
              .filter((d) => !d.isExternal)
              .map((d) => d.email)}
            onSelectedValuesChange={handleInternalDacSelect}
            placeholder="Search and select faculty..."
            searchPlaceholder="Search faculty..."
            emptyPlaceholder="No faculty found."
            disabled={isDeadlinePassed}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="external-dac-name">Add External DAC Member</Label>
          <div className="flex gap-2">
            <Input
              id="external-dac-name"
              placeholder="External Member Name"
              value={externalDacName}
              onChange={(e) => setExternalDacName(e.target.value)}
              disabled={isDeadlinePassed}
            />
            <Input
              id="external-dac-email"
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
              disabled={!externalDacEmail.trim() || !externalDacName.trim()}
            >
              <PlusCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {selectedDac.length > 0 && (
          <div className="space-y-2 pt-2">
            <Label>Selected DAC Members ({selectedDac.length})</Label>
            {selectedDac.map((member) => {
              return (
                <div
                  key={member.email}
                  className="flex items-center justify-between rounded-md border bg-muted/50 p-2 text-sm"
                >
                  <span>
                    {member.name
                      ? `${member.name}(${member.email})`
                      : member.email}
                    {member.isExternal && (
                      <Badge variant="outline" className="ml-2">
                        External
                      </Badge>
                    )}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleRemoveDac(member.email)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
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
          onClick={handleAccept}
          disabled={mutation.isLoading || isDeadlinePassed}
        >
          {mutation.isLoading ? <LoadingSpinner /> : "Accept & Submit"}
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
