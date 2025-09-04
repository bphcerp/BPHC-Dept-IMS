import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import api from "@/lib/axios-instance";
import { LoadingSpinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Download, CheckCircle } from "lucide-react";

interface Proposal {
  id: number;
  title: string;
  status: string;
  student: {
    email: string;
    name: string | null;
  };
  coSupervisors: {
    name: string | null;
    email: string;
  }[];
  currentUserApproval: boolean;
  abstractFileUrl: string;
  proposalFileUrl: string;
}

const CoSupervisorViewProposal: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const {
    data: proposal,
    isLoading: proposalLoading,
    error: proposalError,
  } = useQuery({
    queryKey: ["coSupervisor-proposal", id],
    queryFn: async () => {
      const response = await api.get(
        `/phd/proposal/coSupervisor/viewProposal/${id}`
      );
      return response.data as Proposal;
    },
    enabled: !!id,
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post<{ success: boolean }>(
        `/phd/proposal/coSupervisor/approve/${id}`
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("Proposal approved successfully!");
      void queryClient.invalidateQueries({
        queryKey: ["coSupervisor-proposal", id],
      });
      void queryClient.invalidateQueries({
        queryKey: ["coSupervisor-proposals"],
      });
    },
    onError: () => {
      toast.error("Failed to approve proposal");
    },
  });

  if (proposalLoading) {
    return (
      <div className="min-h-screen w-full bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner className="h-10 w-10" />
          <p className="ml-4 text-gray-500">Loading proposal...</p>
        </div>
      </div>
    );
  }

  if (proposalError || !proposal) {
    return (
      <div className="min-h-screen w-full bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardContent className="p-12">
              <div className="text-center">
                <div className="mb-4 text-red-500">
                  <svg
                    className="mx-auto h-12 w-12"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-medium text-gray-900">
                  Error Loading Proposal
                </h3>
                <p className="text-gray-500">
                  {(proposalError as Error)?.message || "Proposal not found"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const canApprove = proposal.status === "cosupervisor_review";

  return (
    <div className="min-h-screen w-full bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Proposal Review</h1>
          <p className="mt-2 text-gray-600">
            Review PhD proposal as co-supervisor
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              Proposal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="font-medium text-gray-700">Title</label>
                <p className="text-gray-900">{proposal.title}</p>
              </div>
              <div>
                <label className="font-medium text-gray-700">Status</label>
                <div className="mt-1">
                  <Badge
                    className={
                      proposal.status === "cosupervisor_review"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }
                  >
                    {proposal.status.replace("_", " ").toUpperCase()}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="font-medium text-gray-700">Student</label>
                <p className="text-gray-900">
                  {proposal.student.name || proposal.student.email}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-medium text-gray-700">Files</label>
              <div className="flex space-x-4">
                <Button variant="outline" asChild>
                  <a
                    href={proposal.abstractFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Abstract
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a
                    href={proposal.proposalFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Full Proposal
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              Co-Supervisors
            </CardTitle>
          </CardHeader>
          <CardContent>
            {proposal.coSupervisors.length > 0 ? (
              <div className="space-y-2">
                {proposal.coSupervisors.map((coSupervisor, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded bg-gray-50 p-3"
                  >
                    <div>
                      <span className="text-gray-900">{coSupervisor.name}</span>
                      <span className="ml-4 text-gray-900">
                        {coSupervisor.email}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No co-supervisors assigned</p>
            )}
          </CardContent>
        </Card>

        {canApprove && proposal.currentUserApproval === null && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <Button
                  onClick={() => approveMutation.mutate()}
                  disabled={approveMutation.isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {approveMutation.isLoading
                    ? "Approving..."
                    : "Approve Proposal"}
                </Button>
                <p className="mt-2 text-sm text-gray-500">
                  Approve this proposal as co-supervisor
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {proposal.currentUserApproval && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="mb-4 text-green-600">
                  <CheckCircle className="mx-auto h-12 w-12" />
                </div>
                <h3 className="mb-2 text-lg font-medium text-gray-900">
                  Proposal Approved
                </h3>
                <p className="text-gray-500">
                  You have already approved this proposal.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CoSupervisorViewProposal;
