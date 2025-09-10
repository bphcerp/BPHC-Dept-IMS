import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import api from "@/lib/axios-instance";
import { LoadingSpinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Download, UserPlus, CheckCircle, X } from "lucide-react";
import { DEPARTMENT_NAME } from "@/lib/constants";

interface Faculty {
  email: string;
  name: string;
  department: string;
}

interface CoSupervisor {
  coSupervisor: {
    name: string | null;
    email: string;
  };
}

interface DacMember {
  dacMember: {
    name: string | null;
    department: string | null;
    email: string;
  };
}

interface Proposal {
  id: number;
  title: string;
  status: string;
  student: {
    email: string;
    name: string | null;
  };
  coSupervisors: CoSupervisor[];
  dacMembers: DacMember[];
  abstractFileUrl: string;
  proposalFileUrl: string;
}

const SupervisorViewProposal: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [isCoSupervisorDialogOpen, setIsCoSupervisorDialogOpen] =
    useState(false);
  const [isDacDialogOpen, setIsDacDialogOpen] = useState(false);
  const [selectedCoSupervisor, setSelectedCoSupervisor] = useState("");
  const [selectedDacMember, setSelectedDacMember] = useState("");

  const queryClient = useQueryClient();

  const {
    data: proposal,
    isLoading: proposalLoading,
    error: proposalError,
  } = useQuery({
    queryKey: ["supervisor-proposal", id],
    queryFn: async () => {
      const response = await api.get<Proposal>(
        `/phd/proposal/supervisor/viewProposal/${id}`
      );
      return response.data;
    },
    enabled: !!id,
  });

  const { data: facultyData } = useQuery({
    queryKey: ["faculty-list"],
    queryFn: async () => {
      const response = await api.get<Faculty[]>(
        "/phd/proposal/supervisor/getFacultyList"
      );
      return response.data;
    },
  });

  const faculty = useMemo(() => facultyData || [], [facultyData]);

  const updateCoSupervisorsMutation = useMutation({
    mutationFn: async (data: { add?: string; remove?: string }) => {
      const response = await api.post<{ success: boolean }>(
        `/phd/proposal/supervisor/updateCoSupervisors/${id}`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("Co-supervisors updated successfully!");
      void queryClient.invalidateQueries({
        queryKey: ["supervisor-proposal", id],
      });
      setIsCoSupervisorDialogOpen(false);
      setSelectedCoSupervisor("");
    },
    onError: () => {
      toast.error("Failed to update co-supervisors");
    },
  });

  const updateDacMembersMutation = useMutation({
    mutationFn: async (data: { add?: string; remove?: string }) => {
      const response = await api.post<{ success: boolean }>(
        `/phd/proposal/supervisor/updateDacMembers/${id}`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("DAC members updated successfully!");
      void queryClient.invalidateQueries({
        queryKey: ["supervisor-proposal", id],
      });
      setIsDacDialogOpen(false);
      setSelectedDacMember("");
    },
    onError: () => {
      toast.error("Failed to update DAC members");
    },
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post<void>(
        `/phd/proposal/supervisor/approveAndSign/${id}`
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("Proposal approved successfully!");
      void queryClient.invalidateQueries({
        queryKey: ["supervisor-proposal", id],
      });
      void queryClient.invalidateQueries({
        queryKey: ["supervisor-proposals"],
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

  const canEdit = proposal.status === "supervisor_review";
  const canApprove = canEdit && proposal.dacMembers.length >= 2;

  const coSupervisorEmails = proposal.coSupervisors.map(
    (cs) => cs.coSupervisor.email
  );
  const dacMemberEmails = proposal.dacMembers.map((dm) => dm.dacMember.email);

  const availableCoSupervisors = faculty.filter(
    (member) =>
      !coSupervisorEmails.includes(member.email) &&
      !dacMemberEmails.includes(member.email)
  );
  const availableDacMembers = faculty.filter(
    (member) =>
      !dacMemberEmails.includes(member.email) &&
      !coSupervisorEmails.includes(member.email)
  );

  const handleAddCoSupervisor = () => {
    if (selectedCoSupervisor) {
      updateCoSupervisorsMutation.mutate({ add: selectedCoSupervisor });
    }
  };

  const handleRemoveCoSupervisor = (email: string) => {
    updateCoSupervisorsMutation.mutate({ remove: email });
  };

  const handleAddDacMember = () => {
    if (selectedDacMember) {
      updateDacMembersMutation.mutate({ add: selectedDacMember });
    }
  };

  const handleRemoveDacMember = (email: string) => {
    updateDacMembersMutation.mutate({ remove: email });
  };

  return (
    <div className="min-h-screen w-full bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Proposal Review</h1>
          <p className="mt-2 text-gray-600">
            Review and manage PhD proposal details
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
                      proposal.status === "supervisor_review"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-blue-100 text-blue-800"
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
            <CardTitle className="flex items-center justify-between text-xl font-semibold">
              Co-Supervisors
              {canEdit && (
                <Dialog
                  open={isCoSupervisorDialogOpen}
                  onOpenChange={setIsCoSupervisorDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Co-Supervisor</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Select
                        value={selectedCoSupervisor}
                        onValueChange={setSelectedCoSupervisor}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select faculty member" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCoSupervisors.map((member) => (
                            <SelectItem key={member.email} value={member.email}>
                              {member.name} ({member.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsCoSupervisorDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleAddCoSupervisor}
                          disabled={updateCoSupervisorsMutation.isLoading}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
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
                      <span className="text-gray-900">
                        {coSupervisor.coSupervisor.name}
                      </span>
                      <span className="ml-4 text-gray-900">
                        {coSupervisor.coSupervisor.email}
                      </span>
                    </div>
                    {canEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleRemoveCoSupervisor(
                            coSupervisor.coSupervisor.email
                          )
                        }
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No co-supervisors assigned</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-xl font-semibold">
              DAC Members
              {canEdit && (
                <Dialog
                  open={isDacDialogOpen}
                  onOpenChange={setIsDacDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add DAC Member</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Select
                        value={selectedDacMember}
                        onValueChange={setSelectedDacMember}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select faculty member" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableDacMembers.map((member) => (
                            <SelectItem key={member.email} value={member.email}>
                              {member.name} -{" "}
                              {member.department?.length
                                ? member.department
                                : DEPARTMENT_NAME}
                              ({member.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsDacDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleAddDacMember}
                          disabled={updateDacMembersMutation.isLoading}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {proposal.dacMembers.length > 0 ? (
              <div className="space-y-2">
                {proposal.dacMembers.map((dacMember, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded bg-gray-50 p-3"
                  >
                    <div>
                      <span className="font-medium text-gray-900">
                        {dacMember.dacMember.name}
                      </span>
                      <span className="ml-4 text-gray-900">
                        {dacMember.dacMember.email}
                      </span>
                      <span className="ml-4 text-gray-500">
                        (
                        {dacMember.dacMember.department?.length
                          ? dacMember.dacMember.department
                          : DEPARTMENT_NAME}
                        )
                      </span>
                    </div>
                    {canEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleRemoveDacMember(dacMember.dacMember.email)
                        }
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No DAC members assigned</p>
            )}
            {proposal.dacMembers.length < 2 && (
              <p className="mt-4 text-sm text-amber-600">
                Minimum 2 DAC members required for approval
              </p>
            )}
          </CardContent>
        </Card>

        {canApprove && (
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
                    : "Approve and Sign Proposal"}
                </Button>
                <p className="mt-2 text-sm text-gray-500">
                  This will move the proposal to the co-supervisor review stage
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SupervisorViewProposal;
