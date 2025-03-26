import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { LoadingSpinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Semester {
  id: number;
  year: string;
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
  semesterYear?: string;
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
        "/phd/staff/getCurrentSemester"
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
        `/phd/staff/getAllQualifyingExamForTheSem/${currentSemesterId}`
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
      const response = await api.post("/phd/staff/updateProposalDeadline", formData);
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
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || "Failed to update thesis proposal deadline";
      toast.error(errorMessage);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentSemesterId) {
      toast.error("No active semester found");
      return;
    }
    
    if (!proposalForm.deadline) {
      toast.error("Please provide a deadline");
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
      <div className="w-full max-w-4xl bg-white shadow-xl rounded-xl overflow-hidden">
        <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
          <h1 className="text-3xl font-bold text-gray-800 text-center">Thesis Proposal Deadline Management</h1>
        </div>

        {isLoadingCurrentSemester ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner className="h-12 w-12" />
          </div>
        ) : currentSemesterData?.semester ? (
          <div className="grid md:grid-cols-2 gap-6 p-6">
            {/* Semester Information */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Current Academic Semester</h2>
                <span 
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    isActiveSemester 
                      ? "bg-green-100 text-green-800" 
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {isActiveSemester ? "Active" : "Recent"}
                </span>
              </div>
              <div className="space-y-2">
                <p className="text-lg font-medium">
                  {currentSemesterData.semester.year}-Semester {currentSemesterData.semester.semesterNumber}
                </p>
                <div className="text-sm text-gray-500">
                  <div>Start: {formatDate(currentSemesterData.semester.startDate)}</div>
                  <div>End: {formatDate(currentSemesterData.semester.endDate)}</div>
                </div>
              </div>
            </div>

            {/* Exam Deadline Form */}
            <div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label>Exam Name:</Label>
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
                  className="w-full bg-blue-600 text-white hover:bg-blue-700"
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
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-red-500">
              No semester configuration found. Please contact the system administrator.
            </p>
          </div>
        )}

        {/* Existing Exams Table */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <h3 className="mb-4 text-lg font-medium">Current Thesis Proposal Deadlines</h3>
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
                    <th className="border px-4 py-2 text-left">Registration Deadline</th>
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
            <p className="text-center py-4 text-gray-500">
              No Thesis Proposal deadlines set for this semester.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpdateProposalDeadline;