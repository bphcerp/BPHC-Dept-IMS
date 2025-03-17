import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { LoadingSpinner } from "@/components/ui/spinner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface IUpdateProposalDeadlineResponse {
  success: boolean;
  deadline: string;
}

const UpdateProposalDeadline: React.FC = () => {
  const [deadline, setDeadline] = useState("");

  const mutation = useMutation({
    mutationFn: async (newDeadline: string) => {
      const response = await api.post<IUpdateProposalDeadlineResponse>(
        "/phd/drcMember/updateProposalDeadline",
        { deadline: newDeadline }
      );
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(
        `Proposal deadline updated to: ${new Date(data.deadline).toLocaleString()}`
      );
    },
    onError: () => {
      toast.error("Failed to update proposal deadline. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deadline) {
      toast.error("Please select a valid deadline date.");
      return;
    }
    const formattedDeadline = new Date(deadline).toISOString();
    mutation.mutate(formattedDeadline);
  };

  return (
    <div className="flex h-screen w-full justify-center items-start bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md h-auto">
        <CardContent className="p-6">
          <h2 className="mb-4 text-center text-xl font-bold">
            Update Proposal Deadline
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full"
            />
            <Button
              type="submit"
              disabled={mutation.isLoading}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {mutation.isLoading ? (
                <LoadingSpinner className="h-5 w-5" />
              ) : (
                "Update Deadline"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpdateProposalDeadline;
