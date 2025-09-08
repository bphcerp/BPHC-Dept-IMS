import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { LoadingSpinner } from "@/components/ui/spinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileText, Eye, Download, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ProposalListItem {
  id: number;
  title: string;
  status: string;
  updatedAt: string;
  student: { name: string | null; email: string };
}
interface Supervisor {
  name: string | null;
  email: string;
}
interface CoSupervisor {
  coSupervisor: { name: string | null; email: string };
}
interface DacMember {
  dacMember: { name: string | null; email: string };
}
interface ProposalDetails extends ProposalListItem {
  supervisor: Supervisor;
  coSupervisors: CoSupervisor[];
  dacMembers: DacMember[];
  abstractFileUrl: string;
  proposalFileUrl: string;
}

const DrcProposalManagement: React.FC = () => {
  const [selectedProposalId, setSelectedProposalId] = useState<number | null>(
    null
  );

  const { data: proposals, isLoading: listIsLoading } = useQuery({
    queryKey: ["drc-proposals"],
    queryFn: async () => {
      const response = await api.get<ProposalListItem[]>(
        "/phd/proposal/drcConvener/getProposals"
      );
      return response.data;
    },
    refetchOnWindowFocus: false,
  });

  return (
    <div className="min-h-screen w-full bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold">PhD Proposal Management</h1>
          <p className="mt-2 text-gray-600">
            Review proposals approved by co-supervisors and forward them to DAC
            members.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Awaiting Review</CardTitle>
            </CardHeader>
            <CardContent>
              {listIsLoading ? (
                <div className="flex h-40 items-center justify-center">
                  <LoadingSpinner />
                </div>
              ) : proposals && proposals.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {proposals.map((proposal) => (
                      <TableRow
                        key={proposal.id}
                        className={cn(
                          "cursor-pointer",
                          selectedProposalId === proposal.id && "bg-muted/50"
                        )}
                        onClick={() => setSelectedProposalId(proposal.id)}
                      >
                        <TableCell>
                          <div className="font-medium">
                            {proposal.student.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {proposal.title}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {proposal.status.replace("_", " ").toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-8 text-center">
                  <FileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <h3 className="mb-2 text-lg font-medium">
                    No Pending Proposals
                  </h3>
                  <p className="text-gray-500">
                    No proposals are awaiting your review.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          <div className="lg:col-span-2">
            {selectedProposalId ? (
              <ProposalDetailView
                proposalId={selectedProposalId}
                clearSelection={() => setSelectedProposalId(null)}
              />
            ) : (
              <Card className="flex h-full items-center justify-center">
                <div className="p-8 text-center">
                  <FileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <h3 className="mb-2 text-lg font-medium">
                    Select a Proposal
                  </h3>
                  <p className="text-gray-500">
                    Choose a proposal from the list to view its details and take
                    action.
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ProposalDetailView = ({
  proposalId,
  clearSelection,
}: {
  proposalId: number;
  clearSelection: () => void;
}) => {
  const queryClient = useQueryClient();
  const {
    data: proposal,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["drc-proposal-view", proposalId],
    queryFn: async () => {
      const response = await api.get<ProposalDetails>(
        `/phd/proposal/drcConvener/viewProposal/${proposalId}`
      );
      return response.data;
    },
  });

  const sendToDacMutation = useMutation({
    mutationFn: () =>
      api.post(`/phd/proposal/drcConvener/sendToDac/${proposalId}`),
    onSuccess: () => {
      toast.success(
        "Proposal successfully sent to DAC members for evaluation."
      );
      clearSelection();
      void queryClient.invalidateQueries({ queryKey: ["drc-proposals"] });
    },
    onError: () => {
      toast.error("Failed to send proposal to DAC.");
    },
  });

  if (isLoading)
    return (
      <Card className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </Card>
    );
  if (isError || !proposal)
    return (
      <Card>
        <CardContent>
          <p className="p-4 text-red-500">Could not load proposal details.</p>
        </CardContent>
      </Card>
    );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl">{proposal.title}</CardTitle>
            <CardDescription>
              Submitted by {proposal.student.name}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={clearSelection}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="mb-2 font-semibold">Proposal Documents</h3>
          <div className="flex space-x-2">
            <Button variant="outline" asChild>
              <a
                href={proposal.abstractFileUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download className="mr-2 h-4 w-4" /> Abstract
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a
                href={proposal.proposalFileUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download className="mr-2 h-4 w-4" /> Full Proposal
              </a>
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-2 font-semibold">Supervisor</h3>
            <p>
              {proposal.supervisor.name} ({proposal.supervisor.email})
            </p>
          </div>
          <div>
            <h3 className="mb-2 font-semibold">Co-Supervisors</h3>
            <ul className="list-inside list-disc">
              {proposal.coSupervisors.map((cs) => (
                <li key={cs.coSupervisor.email}>
                  {cs.coSupervisor.name} ({cs.coSupervisor.email})
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div>
          <h3 className="mb-2 font-semibold">Assigned DAC Members</h3>
          <ul className="list-inside list-disc">
            {proposal.dacMembers.map((dac) => (
              <li key={dac.dacMember.email}>
                {dac.dacMember.name} ({dac.dacMember.email})
              </li>
            ))}
          </ul>
        </div>
        {proposal.status === "drc_review" && (
          <div className="border-t pt-4 text-center">
            <Button
              onClick={() => sendToDacMutation.mutate()}
              disabled={sendToDacMutation.isLoading}
            >
              <Send className="mr-2 h-4 w-4" />
              {sendToDacMutation.isLoading
                ? "Sending..."
                : "Send to DAC for Evaluation"}
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              This will notify the DAC members and create a To-do item for them.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DrcProposalManagement;
