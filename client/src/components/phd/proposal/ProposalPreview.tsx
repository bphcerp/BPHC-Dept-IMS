// client/src/components/phd/proposal/ProposalPreview.tsx
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

const ProposalPreview: React.FC<{ proposal: Proposal }> = ({ proposal }) => {
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
  ].filter((file) => file.url);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{proposal.title}</CardTitle>
          <CardDescription>
            Status:{" "}
            <Badge variant="outline">
              {proposal.status.replace(/_/g, " ").toUpperCase()}
            </Badge>
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
    </div>
  );
};

export default ProposalPreview;
