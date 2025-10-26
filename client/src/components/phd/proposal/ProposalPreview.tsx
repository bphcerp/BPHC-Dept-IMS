import React from "react";
import ProposalDocumentsViewer from "@/components/phd/proposal/ProposalDocumentsViewer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatStatus } from "@/lib/utils";

interface CoSupervisor {
  coSupervisorEmail: string;
  coSupervisorName: string | null;
  coSupervisor?: {
    name: string | null;
    email: string;
  } | null;
}

interface Proposal {
  title: string;
  status: string;
  coSupervisors: CoSupervisor[];
  hasOutsideCoSupervisor: boolean;
  appendixFileUrl?: string | null;
  summaryFileUrl?: string | null;
  outlineFileUrl?: string | null;
  placeOfResearchFileUrl?: string | null;
  outsideCoSupervisorFormatFileUrl?: string | null;
  outsideSupervisorBiodataFileUrl?: string | null;
}

interface ProposalPreviewProps {
  proposal: Proposal;
  onSubmit?: () => void; // Optional function prop
  isSubmitting?: boolean;
}

const ProposalPreview: React.FC<ProposalPreviewProps> = ({
  proposal,
  onSubmit, // Can be undefined
  isSubmitting = false,
}) => {
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{proposal.title}</CardTitle>
          <CardDescription>
            Status:{" "}
            <Badge variant="outline">{formatStatus(proposal.status)}</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {proposal.coSupervisors && proposal.coSupervisors.length > 0 && (
            <div>
              <h4 className="font-semibold">Co-Supervisors:</h4>
              <ul className="mt-2 list-disc pl-5">
                {proposal.coSupervisors.map((coSup, index) => (
                  <li key={index}>
                    {coSup.coSupervisor?.name ??
                      coSup.coSupervisorName ??
                      "External"}{" "}
                    ({coSup.coSupervisorEmail})
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="mt-4">
            <span className="font-semibold">Has Outside Co-Supervisor:</span>{" "}
            {proposal.hasOutsideCoSupervisor ? "Yes" : "No"}
          </p>
        </CardContent>
      </Card>
      <ProposalDocumentsViewer files={documentFiles} />
      {/* Conditionally render the button only if onSubmit is provided */}
      {onSubmit && (
        <Button onClick={onSubmit} disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Submitting..." : "Final Submit"}
        </Button>
      )}
    </div>
  );
};

export default ProposalPreview;
