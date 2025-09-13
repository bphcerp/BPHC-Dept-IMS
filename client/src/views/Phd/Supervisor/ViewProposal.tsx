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
import { Check, X } from "lucide-react";

interface DacReview {
  dacMember: { name: string | null; email: string };
  approved: boolean;
}

interface DacMember {
  dacMember: {
    name: string | null;
    email: string;
  };
}
interface CoSupervisor {
  coSupervisorEmail: string;
  coSupervisorName: string | null;
  coSupervisor: {
    name: string | null;
    email: string;
  } | null;
}
interface Proposal {
  id: number;
  title: string;
  status: string;
  comments: string | null;
  student: {
    email: string;
    name: string | null;
  };
  dacMembers: DacMember[];
  dacReviews: DacReview[];
  coSupervisors: CoSupervisor[];
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

  const isPostDacRevert =
    proposal.status === "supervisor_review" &&
    (proposal.comments ?? "").includes("DAC_REVERT_FLAG");

  return (
    <div className="space-y-6">
      <BackButton />
      <Card>
        <CardHeader>
          <CardTitle>{proposal.title}</CardTitle>
          <CardDescription>
            Submitted by: {proposal.student.name} ({proposal.student.email})
            <br />
            Status:{" "}
            <Badge>{proposal.status.replace(/_/g, " ").toUpperCase()}</Badge>
          </CardDescription>
        </CardHeader>
        {proposal.coSupervisors.length > 0 && (
          <CardContent>
            <strong>Co-Supervisor: </strong>
            {proposal.coSupervisors[0].coSupervisor?.name ??
              proposal.coSupervisors[0].coSupervisorEmail}
          </CardContent>
        )}
      </Card>
      <ProposalDocumentsViewer files={documentFiles} />

      {/* ADDED: This card now displays the DAC review status correctly */}
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
                  {review.dacMember.name} ({review.dacMember.email})
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
      {proposal.status === "supervisor_review" ? (
        <Card>
          <CardHeader>
            <CardTitle>Review and Action</CardTitle>
            <CardDescription>
              {isPostDacRevert
                ? "The proposal was reverted by the DAC and has been resubmitted by the student. You can forward it to the existing DAC or choose to edit the members."
                : "Add DAC members and accept, or revert the proposal with comments."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SupervisorReviewForm
              proposalId={proposalId}
              onSuccess={handleSuccess}
              deadline={proposal.proposalSemester.facultyReviewDate}
              initialDacMembers={proposal.dacMembers.map(
                (m) => m.dacMember.email
              )}
              isPostDacRevert={isPostDacRevert}
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
              status:{" "}
              <strong>
                {proposal.status.replace(/_/g, " ").toUpperCase()}
              </strong>
            </p>
            {/* CHANGED: Logic now correctly hides the internal revert flag */}
            {proposal.comments && proposal.comments !== "DAC_REVERT_FLAG" && (
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
