import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import BackButton from "@/components/BackButton";
import ProposalDocumentsViewer from "@/components/phd/proposal/ProposalDocumentsViewer";
import { DrcReviewForm } from "@/components/phd/proposal/DrcReviewForm";
import { SeminarDetailsForm } from "@/components/phd/proposal/SeminarDetailsForm";
import { phdSchemas } from "lib";
import { Download, CheckCircle } from "lucide-react";

// MODIFIED: Updated interface to handle external DAC members
interface DacMember {
  dacMemberEmail: string; // The email is always present
  dacMember: {
    // This can be null if the member is external
    name: string | null;
    email: string;
  } | null;
}
interface CoSupervisor {
  coSupervisor: {
    name: string | null;
    email: string;
  };
}
interface ProposalDetails {
  id: number;
  title: string;
  status: string;
  student: {
    name: string | null;
    email: string;
  };
  supervisor: {
    name: string | null;
    email: string;
  };
  coSupervisors: CoSupervisor[];
  dacMembers: DacMember[];
  dacReviews: any[];
  appendixFileUrl: string;
  summaryFileUrl: string;
  outlineFileUrl: string;
  placeOfResearchFileUrl?: string | null;
  outsideCoSupervisorFormatFileUrl?: string | null;
  outsideSupervisorBiodataFileUrl?: string | null;
  proposalSemester: {
    drcReviewDate: string;
  };
}

const DrcViewProposal: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const proposalId = Number(id);
  const queryClient = useQueryClient();

  const {
    data: proposal,
    isLoading,
    isError,
    refetch,
  } = useQuery<ProposalDetails>({
    queryKey: ["drc-proposal-view", proposalId],
    queryFn: async () => {
      const response = await api.get(
        `/phd/proposal/drcConvener/viewProposal/${proposalId}`
      );
      return response.data;
    },
    enabled: !!proposalId,
  });

  const setSeminarDetailsMutation = useMutation({
    mutationFn: (data: phdSchemas.SetSeminarDetailsBody) =>
      api.post(
        `/phd/proposal/drcConvener/setSeminarDetails/${proposalId}`,
        data
      ),
    onSuccess: () => {
      toast.success("Seminar details saved successfully!");
      void refetch();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to save seminar details."
      );
    },
  });

  const downloadPackageMutation = useMutation({
    mutationFn: () =>
      api.get(
        `/phd/proposal/drcConvener/downloadProposalPackage/${proposalId}`,
        { responseType: "blob" }
      ),
    onSuccess: (response) => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `ProposalPackage_${proposal?.id}.zip`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success("Proposal package downloaded.");
      void refetch();
    },
    onError: () => toast.error("Failed to download package."),
  });

  const finalizeMutation = useMutation({
    mutationFn: () =>
      api.post(`/phd/proposal/drcConvener/finalizeProposals`, { proposalId }),
    onSuccess: () => {
      toast.success("Process finalized and status updated successfully!");
      void refetch();
      void queryClient.invalidateQueries({ queryKey: ["drc-proposals"] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to finalize the process."
      );
    },
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
            onSuccess={() => refetch()}
            deadline={proposal.proposalSemester.drcReviewDate}
          />
        );
      case "seminar_incomplete":
        return (
          <SeminarDetailsForm
            onSubmit={setSeminarDetailsMutation.mutate}
            isSubmitting={setSeminarDetailsMutation.isLoading}
          />
        );
      case "finalising":
      case "formalising":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Finalize Process</CardTitle>
              <CardDescription>
                Step 1: Download all documents. Step 2: Confirm to finalize the
                process.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <Button
                onClick={() => downloadPackageMutation.mutate()}
                disabled={
                  downloadPackageMutation.isLoading ||
                  proposal.status === "formalising"
                }
                className="w-full max-w-xs"
              >
                <Download className="mr-2 h-4 w-4" />
                {downloadPackageMutation.isLoading
                  ? "Generating..."
                  : "Download Proposal Package"}
              </Button>
              <Button
                onClick={() => finalizeMutation.mutate()}
                disabled={
                  proposal.status !== "formalising" ||
                  finalizeMutation.isLoading
                }
                className="w-full max-w-xs bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {finalizeMutation.isLoading
                  ? "Finalizing..."
                  : "Confirm & Finalize Process"}
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">
                Finalizing will update the status to &quot;Completed&quot; and
                finish the workflow.
              </p>
            </CardContent>
          </Card>
        );
      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Proposal Status</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                This proposal is currently at the{" "}
                <strong>
                  {proposal.status.replace(/_/g, " ").toUpperCase()}
                </strong>{" "}
                stage and does not require your action at this moment.
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
          {/* CHANGED: Replaced CardDescription with divs to fix nesting warning */}
          <div className="pt-2 text-sm text-muted-foreground">
            <p>
              Submitted by: {proposal.student.name} ({proposal.student.email})
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span>Status:</span>
              <Badge>{proposal.status.replace(/_/g, " ").toUpperCase()}</Badge>
            </div>
          </div>
        </CardHeader>
        {proposal.coSupervisors.length > 0 && (
          <CardContent>
            <strong>Co-Supervisor: </strong>
            {proposal.coSupervisors[0].coSupervisor?.name ??
              proposal.coSupervisors[0].coSupervisor.email}
          </CardContent>
        )}
      </Card>
      <ProposalDocumentsViewer files={documentFiles} />
      {renderActionCard()}
    </div>
  );
};
export default DrcViewProposal;
