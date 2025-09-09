import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/axios-instance";
import { LoadingSpinner } from "@/components/ui/spinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Send } from "lucide-react";
import { toast } from "sonner";
import BackButton from "@/components/BackButton";

interface Student {
  name: string | null;
  email: string;
}
interface Supervisor {
  name: string | null;
  email: string;
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
    email: string;
  };
}
interface ProposalDetails {
  id: number;
  title: string;
  status: string;
  student: Student;
  supervisor: Supervisor;
  coSupervisors: CoSupervisor[];
  dacMembers: DacMember[];
  abstractFileUrl: string;
  proposalFileUrl: string;
}

const DrcViewProposal: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const proposalId = Number(id);
  const navigate = useNavigate();
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
    enabled: !!proposalId,
  });

  const sendToDacMutation = useMutation({
    mutationFn: () =>
      api.post(`/phd/proposal/drcConvener/sendToDac/${proposalId}`),
    onSuccess: () => {
      toast.success("Proposal successfully sent to DAC members for evaluation.");
      void queryClient.invalidateQueries({ queryKey: ["drc-proposals"] });
      navigate("/phd/drc-convenor/proposal-management");
    },
    onError: () => {
      toast.error("Failed to send proposal to DAC.");
    },
  });

  if (isLoading)
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
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
    <div className="space-y-4">
      <BackButton />
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{proposal.title}</CardTitle>
              <CardDescription>
                Submitted by {proposal.student.name}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Proposal Documents</h3>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Supervisor</h3>
              <p>
                {proposal.supervisor.name} ({proposal.supervisor.email})
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Co-Supervisors</h3>
              <ul className="list-disc list-inside">
                {proposal.coSupervisors.map((cs) => (
                  <li key={cs.coSupervisor.email}>
                    {cs.coSupervisor.name} ({cs.coSupervisor.email})
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Assigned DAC Members</h3>
            <ul className="list-disc list-inside">
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
              <p className="text-xs text-muted-foreground mt-2">
                This will notify the DAC members and create a To-do item for
                them.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DrcViewProposal;