// client/src/views/Phd/DrcConvenor/ViewProposal.tsx
import React, { useState } from "react"; // Import useState
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import BackButton from "@/components/BackButton";
import ProposalDocumentsViewer from "@/components/phd/proposal/ProposalDocumentsViewer";
import { DrcReviewForm } from "@/components/phd/proposal/DrcReviewForm";
import { SeminarDetailsForm } from "@/components/phd/proposal/SeminarDetailsForm";
import { phdSchemas } from "lib";
import { Download, CheckCircle } from "lucide-react"; // Import new icon

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
  student: {
    name: string | null;
    email: string;
  };
  supervisor: {
    name: string | null;
    email: string;
  };
  dacMembers: DacMember[];
  dacReviews: any[];
  appendixFileUrl: string;
  summaryFileUrl: string;
  outlineFileUrl: string;
  placeOfResearchFileUrl?: string | null;
  outsideCoSupervisorFormatFileUrl?: string | null;
  outsideSupervisorBiodataFileUrl?: string | null;
}

const DrcViewProposal: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const proposalId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDownloaded, setIsDownloaded] = useState(false); // New state to track download

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
        {
          responseType: "blob",
        }
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
      setIsDownloaded(true); // Set download state to true on success
    },
    onError: () => toast.error("Failed to download package."),
  });

  // New mutation for the finalize step
  const finalizeMutation = useMutation({
    mutationFn: () =>
      api.post(`/phd/proposal/drcConvener/finalizeProposals`, { proposalId }),
    onSuccess: () => {
      toast.success("Process finalized and status updated successfully!");
      void refetch(); // Refetch to show the new 'sent_to_agsrd' status
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
          />
        );
      case "completed":
        return (
          <SeminarDetailsForm
            onSubmit={setSeminarDetailsMutation.mutate}
            isSubmitting={setSeminarDetailsMutation.isLoading}
          />
        );
      case "seminar_details_pending":
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
                disabled={downloadPackageMutation.isLoading || isDownloaded}
                className="w-full max-w-xs"
              >
                <Download className="mr-2 h-4 w-4" />
                {downloadPackageMutation.isLoading
                  ? "Generating..."
                  : isDownloaded
                    ? "Package Downloaded"
                    : "Download Proposal Package"}
              </Button>
              <Button
                onClick={() => finalizeMutation.mutate()}
                disabled={!isDownloaded || finalizeMutation.isLoading}
                className="w-full max-w-xs bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {finalizeMutation.isLoading
                  ? "Finalizing..."
                  : "Confirm & Finalize Process"}
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">
                Finalizing will update the status to "Sent to AGSRD" and
                complete the workflow.
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
          <CardDescription>
            Submitted by: {proposal.student.name} ({proposal.student.email})
            <br />
            Status:{" "}
            <Badge>{proposal.status.replace(/_/g, " ").toUpperCase()}</Badge>
          </CardDescription>
        </CardHeader>
      </Card>
      <ProposalDocumentsViewer files={documentFiles} />
      {renderActionCard()}
    </div>
  );
};

export default DrcViewProposal;
