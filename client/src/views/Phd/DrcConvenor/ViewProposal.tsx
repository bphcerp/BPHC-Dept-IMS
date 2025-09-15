import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import api from "@/lib/axios-instance";
import { LoadingSpinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BackButton from "@/components/BackButton";
import ProposalDocumentsViewer from "@/components/phd/proposal/ProposalDocumentsViewer";
import { DrcReviewForm } from "@/components/phd/proposal/DrcReviewForm";
import { Check, X } from "lucide-react";
interface DacReview {
  dacMember: { name: string | null; email: string };
  approved: boolean;
}
interface DacMember {
  dacMemberEmail: string;
  dacMember: { name: string | null; email: string } | null;
}
interface CoSupervisor {
  coSupervisorEmail: string;
  coSupervisorName: string | null;
  coSupervisor: { name: string | null; email: string } | null;
}
interface ProposalDetails {
  id: number;
  title: string;
  status: string;
  student: { name: string | null; email: string };
  supervisor: { name: string | null; email: string };
  coSupervisors: CoSupervisor[];
  dacMembers: DacMember[];
  dacReviews: DacReview[];
  appendixFileUrl: string;
  summaryFileUrl: string;
  outlineFileUrl: string;
  placeOfResearchFileUrl?: string | null;
  outsideCoSupervisorFormatFileUrl?: string | null;
  outsideSupervisorBiodataFileUrl?: string | null;
  proposalSemester: { drcReviewDate: string };
}
const DrcViewProposal: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const proposalId = Number(id);
  const {
    data: proposal,
    isLoading,
    isError,
    refetch,
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
  if (isLoading)
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  if (isError || !proposal) return <div>Error loading proposal details.</div>;
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
  const renderActionCard = () => {
    switch (proposal.status) {
      case "drc_review":
        return (
          <DrcReviewForm
            proposalId={proposalId}
            suggestedDacMembers={proposal.dacMembers}
            onSuccess={() => void refetch()}
            deadline={proposal.proposalSemester.drcReviewDate}
          />
        );
      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Proposal Status</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                This proposal is currently at the
                <strong>
                  {proposal.status.replace(/_/g, " ").toUpperCase()}
                </strong>
                stage and does not require your direct action on this page.
                Please use the main dashboard for bulk actions.
              </p>
            </CardContent>
          </Card>
        );
    }
  };
  return (
    <div className="space-y-6">
      <BackButton />
      <Card>
        <CardHeader>
          <CardTitle>{proposal.title}</CardTitle>
          <div className="pt-2 text-sm text-muted-foreground">
            <p>
              Submitted by:{proposal.student.name}({proposal.student.email})
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span>Status:</span>
              <Badge>{proposal.status.replace(/_/g, " ").toUpperCase()}</Badge>
            </div>
          </div>
        </CardHeader>
        {proposal.coSupervisors.length > 0 && (
          <CardContent>
            <strong>Co-Supervisors:</strong>
            <ul className="list-disc pl-5">
              {proposal.coSupervisors.map((coSup, index) => (
                <li key={index}>
                  {coSup.coSupervisor?.name ?? coSup.coSupervisorName}(
                  {coSup.coSupervisorEmail})
                </li>
              ))}
            </ul>
          </CardContent>
        )}
      </Card>
      <ProposalDocumentsViewer files={documentFiles} />
      {proposal.dacReviews && proposal.dacReviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>DAC Review Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {proposal.dacReviews.map((review) => (
              <div
                key={review.dacMember.email}
                className="flex items-center justify-between text-sm"
              >
                <p>
                  {review.dacMember.name}({review.dacMember.email})
                </p>
                <Badge
                  variant={review.approved ? "default" : "destructive"}
                  className="flex items-center gap-1"
                >
                  {review.approved ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                  {review.approved ? "Approved" : "Reverted"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      {renderActionCard()}
    </div>
  );
};
export default DrcViewProposal;
