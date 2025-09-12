// client/src/views/Phd/Supervisor/ViewProposal.tsx
import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import api from "@/lib/axios-instance";
import { LoadingSpinner } from "@/components/ui/spinner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BackButton from "@/components/BackButton";
import ProposalDocumentsViewer from "@/components/phd/proposal/ProposalDocumentsViewer";
import { SupervisorReviewForm } from "@/components/phd/proposal/SupervisorReviewForm";

interface DacMember {
  dacMember: { name: string | null; email: string };
}
interface Proposal {
  id: number;
  title: string;
  status: string;
  comments: string | null;
  student: { email: string; name: string | null };
  dacMembers: DacMember[];
  appendixFileUrl: string;
  summaryFileUrl: string;
  outlineFileUrl: string;
  placeOfResearchFileUrl?: string | null;
  outsideCoSupervisorFormatFileUrl?: string | null;
  outsideSupervisorBiodataFileUrl?: string | null;
  proposalSemester: {
    facultyReviewDate: string;
  };
}

const SupervisorViewProposal: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const proposalId = Number(id);
  const queryClient = useQueryClient();

  const {
    data: proposal,
    isLoading,
    isError,
  } = useQuery<Proposal>({
    queryKey: ["supervisor-proposal", id],
    queryFn: async () => {
      const response = await api.get(
        `/phd/proposal/supervisor/viewProposal/${id}`
      );
      return response.data;
    },
    enabled: !!id,
  });

  if (isLoading)
    return (
      <div className="flex h-full items-center justify-center">
        
        <LoadingSpinner />
      </div>
    );
  if (isError || !proposal) return <div>Error loading proposal.</div>;

  const documentFiles = [
    { label: "Appendix I", url: proposal.appendixFileUrl },
    { label: "Summary of Research Proposal", url: proposal.summaryFileUrl },
    { label: "Outline of Proposed Topic", url: proposal.outlineFileUrl },
    { label: "Place of Research Work", url: proposal.placeOfResearchFileUrl },
    {
      label: "Format for Outside Co-Supervisor",
      url: proposal.outsideCoSupervisorFormatFileUrl,
    },
    {
      label: "Outside Supervisor's Biodata",
      url: proposal.outsideSupervisorBiodataFileUrl,
    },
  ];

  const handleSuccess = () => {
    void queryClient.invalidateQueries({
      queryKey: ["supervisor-proposal", id],
    });
  };

  return (
    <div className="space-y-6">
      
      <BackButton />
      <Card>
        
        <CardHeader>
          
          <CardTitle>{proposal.title}</CardTitle>
          <CardDescription>
            
            Submitted by: {proposal.student.name}({proposal.student.email})
            <br /> Status:
            <Badge>
              {proposal.status.replace(/_/g, " ").toUpperCase()}
            </Badge>
          </CardDescription>
        </CardHeader>
      </Card>
      <ProposalDocumentsViewer files={documentFiles} />
      {proposal.status === "supervisor_review" ? (
        <Card>
          
          <CardHeader>
            
            <CardTitle>Review and Action</CardTitle>
            <CardDescription>
              
              Add DAC members and accept, or revert the proposal with comments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            
            <SupervisorReviewForm
              proposalId={proposalId}
              onSuccess={handleSuccess}
              deadline={proposal.proposalSemester.facultyReviewDate}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          
          <CardHeader>
            
            <CardTitle>Review Information</CardTitle>
          </CardHeader>
          <CardContent>
            
            <p className="text-sm text-muted-foreground">
              
              This proposal is not currently awaiting your review. Current
              status:
              <strong>
                {proposal.status.replace(/_/g, " ").toUpperCase()}
              </strong>
            </p>
            {proposal.comments && (
              <p className="mt-4">
                
                <strong>Your last comment:</strong>
                {proposal.comments}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SupervisorViewProposal;
