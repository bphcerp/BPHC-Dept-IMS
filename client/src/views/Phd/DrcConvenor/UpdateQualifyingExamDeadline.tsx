import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { LoadingSpinner } from "@/components/ui/spinner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface IUpdateExamDeadlineResponse {
  success: boolean;
  deadline: string;
}

const UpdateQualifyingExamDeadline: React.FC = () => {
  const [deadline, setDeadline] = useState("");

  const mutation = useMutation({
    mutationFn: async (newDeadline: string) => {
      const response = await api.post<IUpdateExamDeadlineResponse>(
        "/phd/drcMember/updateQualifyingExamDeadline",
        { deadline: newDeadline }
      );
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(
        `Deadline updated to: ${new Date(data.deadline).toLocaleString()}`
      );
    },
    onError: () => {
      toast.error("Failed to update deadline. Please try again.");
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
    <div className="min-h-screen w-full bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="max-w-md">
        <CardContent className="p-6">
          <h2 className="mb-4 text-xl font-bold">
            Update Qualifying Exam Deadline
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

export default UpdateQualifyingExamDeadline;
