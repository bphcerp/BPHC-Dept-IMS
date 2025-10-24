import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import SeminarSlotSelector from "@/components/phd/proposal/SeminarSlotSelector";
import { SeminarDetailsForm } from "@/components/phd/proposal/SeminarDetailsForm";
import { Check, X, AlertTriangle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { phdSchemas } from "lib";
import { formatStatus } from "@/lib/utils"; // Import formatStatus

interface DacReview {
  dacMember: { name: string | null; email: string };
  approved: boolean;
}
interface DacMember {
  dacMember: { name: string | null; email: string } | null;
  dacMemberEmail: string;
  dacMemberName: string | null;
}
interface CoSupervisor {
  coSupervisorEmail: string;
  coSupervisorName: string | null;
  coSupervisor: { name: string | null; email: string } | null;
}

// FIX: Added supervisor to the interface
interface Proposal {
  id: number;
  title: string;
  status: string;
  comments: string | null;
  isResubmission: boolean;
  student: { email: string; name: string | null };
  supervisor: { email: string; name: string | null } | null; // Added this line
  dacMembers: DacMember[];
  dacReviews: DacReview[];
  coSupervisors: CoSupervisor[];
  appendixFileUrl: string;
  summaryFileUrl: string;
  outlineFileUrl: string;
  placeOfResearchFileUrl?: string | null;
  outsideCoSupervisorFormatFileUrl?: string | null;
  outsideSupervisorBiodataFileUrl?: string | null;
  proposalSemester: { facultyReviewDate: string };
  canBookSlot?: boolean;
}

const SupervisorViewProposal: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const proposalId = Number(id);
  const queryClient = useQueryClient();
  const {
    data: proposal,
    isLoading,
    isError,
    refetch,
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

  const handleSuccess = () => {
    void queryClient.invalidateQueries({
      queryKey: ["supervisor-proposal", id],
    });
    void queryClient.invalidateQueries({ queryKey: ["todos"] });
  };

  const customSeminarMutation = useMutation({
    mutationFn: (data: phdSchemas.SetSeminarDetailsBody) =>
      api.post(
        `/phd/proposal/supervisor/setSeminarDetailsCustom/${proposalId}`,
        data
      ),
    onSuccess: () => {
      toast.success("Custom seminar details saved!");
      void refetch();
      void queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to save details.");
    },
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
  ].filter((file): file is { label: string; url: string } => Boolean(file.url));

  const isPostDacRevert =
    proposal.status === "supervisor_review" &&
    (proposal.comments ?? "").includes("DAC_REVERT_FLAG");

  const renderActionCard = () => {
    switch (proposal.status) {
      case "supervisor_review":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Review and Action</CardTitle>
              <CardDescription>
                {isPostDacRevert
                  ? "The proposal was reverted by the DAC. You can forward it to the existing DAC or edit the members."
                  : "Add DAC members and accept, or revert the proposal with comments."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SupervisorReviewForm
                proposalId={proposalId}
                onSuccess={handleSuccess}
                deadline={proposal.proposalSemester.facultyReviewDate}
                initialDacMembers={proposal.dacMembers.map((m) => ({
                  dacMemberEmail: m.dacMemberEmail,
                  dacMemberName: m.dacMemberName ?? m.dacMember?.name ?? null,
                }))}
                isPostDacRevert={isPostDacRevert}
              />
            </CardContent>
          </Card>
        );
      case "dac_accepted":
      case "seminar_pending":
        if (proposal.canBookSlot) {
          return (
            <div className="space-y-6">
              <SeminarSlotSelector
                proposalId={proposalId}
                onSuccess={refetch}
              />
              <SeminarDetailsForm
                onSubmit={customSeminarMutation.mutate}
                isSubmitting={customSeminarMutation.isLoading}
              />
            </div>
          );
        }
        return (
          <Card>
            <CardHeader>
              <CardTitle>Seminar Scheduling</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Please wait for the DRC Convenor to request seminar details.
                Once requested, available slots will appear here for booking, or
                you can set a custom time.
              </p>
            </CardContent>
          </Card>
        );
      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Review Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This proposal is not currently awaiting your review. Current
                status: <strong>{formatStatus(proposal.status)}</strong>
              </p>
              {proposal.comments && proposal.comments !== "DAC_REVERT_FLAG" && (
                <p className="mt-4">
                  <strong>Your last comment:</strong>
                  {proposal.comments}
                </p>
              )}
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
          <CardTitle className="flex items-center gap-4">
            {proposal.title}
            {proposal.isResubmission && (
              <Badge variant="outline">Resubmission</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Submitted by: {proposal.student.name} ({proposal.student.email})
            <br />
            Supervisor: {proposal.supervisor?.name ?? "N/A"} (
            {proposal.supervisor?.email ?? "N/A"})
            <br />
            Status: <Badge>{formatStatus(proposal.status)}</Badge>
          </CardDescription>
        </CardHeader>
        {proposal.coSupervisors.length > 0 && (
          <CardContent>
            <strong>Co-Supervisors:</strong>
            <ul className="list-disc pl-5">
              {proposal.coSupervisors.map((coSup, index) => (
                <li key={index}>
                  {coSup.coSupervisor?.name ??
                    coSup.coSupervisorName ??
                    "External"}{" "}
                  ({coSup.coSupervisorEmail})
                </li>
              ))}
            </ul>
          </CardContent>
        )}
      </Card>
      {proposal.comments && ["supervisor_review"].includes(proposal.status) && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Feedback & Comments from Previous Stage</AlertTitle>
          <AlertDescription>
            <div className="space-y-2">
              {proposal.comments && <p>{proposal.comments}</p>}
            </div>
          </AlertDescription>
        </Alert>
      )}
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
      {renderActionCard()}
    </div>
  );
};

export default SupervisorViewProposal;
