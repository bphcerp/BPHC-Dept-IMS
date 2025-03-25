import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/spinner";

// Student interface
export interface Student {
  name: string;
  email: string;
  erpId?: string;
  supervisor?: string;
  proposalDocuments?: {
    id: number;
    fieldName: string;
    fileName: string;
    fileUrl: string;
    uploadedAt: string;
  }[] | null;
}

// Props interface for the component
interface SuggestDacMembersProps {
  student: Student;
  onClose: () => void;
}

const SuggestDacMembers: React.FC<SuggestDacMembersProps> = ({ 
  student, 
  onClose 
}) => {
  const [dacMembers, setDacMembers] = useState<string[]>([""]);
  const queryClient = useQueryClient();

  const suggestDacMutation = useMutation({
    mutationFn: async (data: { 
      dacMembers: string[], 
      studentEmail: string 
    }) => {    
      return await api.post("/phd/supervisor/suggestDacMembers", data);
    },
    onSuccess: () => {
      toast.success("DAC members suggested successfully");
      queryClient.invalidateQueries({ queryKey: ["phd-supervised-students"] });
      onClose();
    },
    onError: (error: any) => {
      console.error('Mutation Error Full:', error);
      console.error('Error Response:', error.response);
      toast.error(
        error.response?.data?.message || 
        "Failed to suggest DAC members. Please try again."
      );
    },
  });
  
  const onSubmit = () => {
    // Filter out empty entries
    const filteredDacMembers = dacMembers.filter(
      (member) => member.trim() !== ""
    );
  
    if (filteredDacMembers.length === 0) {
      toast.error("Please add at least one DAC member");
      return;
    }
  
    suggestDacMutation.mutate({
      dacMembers: filteredDacMembers,
      studentEmail: student.email,
    });
  };

  const handleAddDacMember = () => {
    setDacMembers([...dacMembers, ""]);
  };

  const handleRemoveDacMember = (index: number) => {
    const newDacMembers = [...dacMembers];
    newDacMembers.splice(index, 1);
    setDacMembers(newDacMembers);
  };

  const handleDacMemberChange = (index: number, value: string) => {
    const newDacMembers = [...dacMembers];
    newDacMembers[index] = value;
    setDacMembers(newDacMembers);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Suggest DAC Members</DialogTitle>
          <DialogDescription>
            Suggest DAC members for {student.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <h3 className="text-lg font-medium">Suggest DAC Members</h3>
          <div className="space-y-2">
            {dacMembers.map((member, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder={`DAC Member ${index + 1} Email`}
                  value={member}
                  onChange={(e) =>
                    handleDacMemberChange(index, e.target.value)
                  }
                />
                {dacMembers.length > 1 && (
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleRemoveDacMember(index)}
                  >
                    ✕
                  </Button>
                )}
              </div>
            ))}

            {dacMembers.length < 5 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddDacMember}
                className="mt-2"
              >
                Add DAC Member
              </Button>
            )}
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={onSubmit}
              disabled={suggestDacMutation.isLoading}
            >
              {suggestDacMutation.isLoading ? (
                <LoadingSpinner className="mr-2 h-4 w-4" />
              ) : null}
              Submit DAC Suggestions
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SuggestDacMembers;