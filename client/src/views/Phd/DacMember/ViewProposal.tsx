// client/src/views/Phd/DacMember/ViewProposal.tsx
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
import { Badge } from "@/components/ui/badge";
import BackButton from "@/components/BackButton";
import ProposalDocumentsViewer from "@/components/phd/proposal/ProposalDocumentsViewer";
import { DacReviewForm } from "@/components/phd/proposal/DacReviewForm";
import { CheckCircle } from "lucide-react";

interface ProposalDetails {
  id: number;
  title: string;
  status: string;
  student: { email: string; name: string | null };
  supervisor: { email: string; name: string | null };
  dacMembers: { dacMember: { name: string | null; email: string } }[];
  appendixFileUrl: string;
  summaryFileUrl: string;
  outlineFileUrl: string;
  placeOfResearchFileUrl?: string | null;
  outsideCoSupervisorFormatFileUrl?: string | null;
  outsideSupervisorBiodataFileUrl?: string | null;
  currentUserReview: { approved: boolean; comments: string } | null;
}

const DacViewProposal: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const proposalId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: proposal,
    isLoading,
    isError,
    refetch,
  } = useQuery<ProposalDetails>({
    queryKey: ["dac-proposal-view", proposalId],
    queryFn: async () => {
      const response = await api.get(
        `/phd/proposal/dacMember/viewProposal/${proposalId}`
      );
      return response.data;
    },
    enabled: !!proposalId,
  });

  const submitReviewMutation = useMutation({
    mutationFn: (formData: FormData) =>
      api.post(`/phd/proposal/dacMember/submitReview/${proposalId}`, formData),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["dac-proposals"] });
      void queryClient.invalidateQueries({ queryKey: ["todos"] });
      void refetch();
    },
  });

  if (isLoading)
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  if (isError || !proposal)
    return <p className="text-destructive">Could not load proposal details.</p>;

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

  const canReview =
    proposal.status === "dac_review" && !proposal.currentUserReview;

  return (
    <div className="space-y-6">
      <BackButton />
      <Card>
        <CardHeader>
          <CardTitle>{proposal.title}</CardTitle>
          <CardDescription>
            Status:{" "}
            <Badge variant="outline">
              {proposal.status.replace("_", " ").toUpperCase()}
            </Badge>
          </CardDescription>
        </CardHeader>
      </Card>

      <ProposalDocumentsViewer files={documentFiles} />

      {canReview && (
        <DacReviewForm
          proposalId={proposalId}
          onSubmit={submitReviewMutation.mutate}
          isSubmitting={submitReviewMutation.isLoading}
        />
      )}

      {proposal.currentUserReview && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" /> You Have Reviewed This
              Proposal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Your Decision:{" "}
              <strong
                className={
                  proposal.currentUserReview.approved
                    ? "text-green-700"
                    : "text-red-700"
                }
              >
                {proposal.currentUserReview.approved ? "Approved" : "Reverted"}
              </strong>
            </p>
            <p className="mt-2">
              <strong>Your Comments:</strong>
            </p>
            <p className="text-muted-foreground">
              {proposal.currentUserReview.comments}
            </p>
          </CardContent>
        </Card>
      )}

      {!canReview && !proposal.currentUserReview && (
        <Card>
          <CardHeader>
            <CardTitle>Review Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This proposal is not currently awaiting your review.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DacViewProposal;
