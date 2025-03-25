import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { LoadingSpinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Semester {
  id: number;
  year: number;
  semesterNumber: number;
  startDate: string;
  endDate: string;
  createdAt: string;
}

interface ProposalDeadline {
  id: number;
  semesterId: number;
  examName: string;
  deadline: string;
  createdAt: string;
  semesterYear?: number;
  semesterNumber?: number;
}

const UpdateProposalDeadline: React.FC = () => {
  const queryClient = useQueryClient();
  const [proposalForm, setProposalForm] = useState({
    examName: "Thesis Proposal",
    deadline: ""
  });

  // Query for current semester
  const { data: currentSemesterData, isLoading: isLoadingCurrentSemester } = useQuery({
    queryKey: ["current-phd-semester"],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; semester: Semester; isActive: boolean }>(
        "/phd/drcMember/getCurrentSemester"
      );
      return response.data;
    }
  });

  // Get the current semester ID
  const currentSemesterId = currentSemesterData?.semester?.id;
  const isActiveSemester = currentSemesterData?.isActive;

  // Query for proposal deadlines in the current semester
  const { data: proposalData, isLoading: isLoadingProposals } = useQuery({
    queryKey: ["phd-proposal-deadlines", currentSemesterId],
    queryFn: async () => {
      if (!currentSemesterId) return { success: true, exams: [] };
      const response = await api.get<{ success: boolean; exams: ProposalDeadline[] }>(
        `/phd/drcMember/getAllQualifyingExamForTheSem/${currentSemesterId}`
      );
      // Filter out all Thesis Proposal deadlines
      const proposalDeadlines = response.data.exams.filter(exam => exam.examName === "Thesis Proposal");
      return { success: response.data.success, exams: proposalDeadlines };
    },
    enabled: !!currentSemesterId
  });

  // Mutation for updating proposal deadlines
  const proposalMutation = useMutation({
    mutationFn: async (formData: typeof proposalForm & { semesterId: number }) => {
      const response = await api.post("/phd/drcMember/updateProposalDeadline", formData);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Thesis proposal deadline updated successfully");
      queryClient.invalidateQueries({ queryKey: ["phd-proposal-deadlines", currentSemesterId] });
      setProposalForm({
        examName: "Thesis Proposal",
        deadline: ""
      });
    },
    onError: () => {
      toast.error("Failed to update thesis proposal deadline");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentSemesterId) {
      toast.error("No active semester found");
      return;
    }
    
    if (!proposalForm.examName || !proposalForm.deadline) {
      toast.error("Please provide both exam name and deadline");
      return;
    }
    
    const formattedDeadline = new Date(proposalForm.deadline).toISOString();
    
    proposalMutation.mutate({
      ...proposalForm,
      deadline: formattedDeadline,
      semesterId: currentSemesterId
    });
  };

  // Helper to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-center text-3xl font-bold">Thesis Proposal Deadline Management</h1>
      
      {isLoadingCurrentSemester ? (
        <Card className="w-full max-w-md mb-6">
          <CardContent className="flex justify-center py-8">
            <LoadingSpinner className="h-8 w-8" />
          </CardContent>
        </Card>
      ) : currentSemesterData?.semester ? (
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                Current Academic Semester
              </CardTitle>
              <Badge variant={isActiveSemester ? "default" : "secondary"}>
                {isActiveSemester ? "Active" : "Recent"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="text-lg font-medium">
                {currentSemesterData.semester.year} - Semester {currentSemesterData.semester.semesterNumber}
              </div>
              <div className="text-sm text-gray-500">
                <div>Start: {formatDate(currentSemesterData.semester.startDate)}</div>
                <div>End: {formatDate(currentSemesterData.semester.endDate)}</div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-6">
              <div>
                <Label htmlFor="examName">Exam Name: </Label>
                <div className="font-bold">Thesis Proposal</div>
              </div>
              <div>
                <Label htmlFor="deadline">Registration Deadline</Label>
                <Input
                  id="deadline"
                  type="datetime-local"
                  value={proposalForm.deadline}
                  onChange={(e) => setProposalForm({ ...proposalForm, deadline: e.target.value })}
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={proposalMutation.isLoading || !isActiveSemester}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {proposalMutation.isLoading ? (
                  <LoadingSpinner className="h-5 w-5" />
                ) : (
                  "Update Proposal Deadline"
                )}
              </Button>
              {!isActiveSemester && (
                <p className="text-sm text-amber-600">
                  Warning: You are setting deadlines for a semester that is not currently active.
                </p>
              )}
            </form>

            <div className="mt-6">
              <h3 className="mb-3 text-lg font-medium">Current Thesis Proposal Deadlines</h3>
              {isLoadingProposals ? (
                <div className="flex justify-center py-4">
                  <LoadingSpinner className="h-6 w-6" />
                </div>
              ) : (proposalData?.exams && proposalData.exams.length > 0) ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border px-4 py-2 text-left">Exam Name</th>
                        <th className="border px-4 py-2 text-left">Deadline</th>
                        <th className="border px-4 py-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {proposalData.exams.map((proposal) => {
                        const deadlineDate = new Date(proposal.deadline);
                        const isActive = deadlineDate > new Date();
                        return (
                          <tr key={proposal.id}>
                            <td className="border px-4 py-2">{proposal.examName}</td>
                            <td className="border px-4 py-2">
                              {formatDate(proposal.deadline)}
                            </td>
                            <td className="border px-4 py-2">
                              <span
                                className={`rounded-full px-2 py-1 text-xs font-medium ${
                                  isActive
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {isActive ? "Active" : "Expired"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center py-4 text-gray-500">No Thesis Proposal deadlines set for this semester.</p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full max-w-md">
          <CardContent className="py-8">
            <p className="text-center text-red-500">
              No semester configuration found. Please contact the system administrator.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UpdateProposalDeadline;