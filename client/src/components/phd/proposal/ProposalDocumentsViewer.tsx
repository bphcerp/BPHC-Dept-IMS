// client/src/components/phd/proposal/ProposalDocumentsViewer.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText } from "lucide-react";

interface FileLink {
  label: string;
  url?: string | null;
}

interface ProposalDocumentsViewerProps {
  files: FileLink[];
}

const ProposalDocumentsViewer: React.FC<ProposalDocumentsViewerProps> = ({
  files,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Submitted Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {files.map((file, index) =>
          file.url ? (
            <a
              key={index}
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full"
            >
              <Button variant="outline" className="w-full justify-start gap-2">
                <Download className="h-4 w-4" />
                <span>{file.label}</span>
              </Button>
            </a>
          ) : null
        )}
      </CardContent>
    </Card>
  );
};

export default ProposalDocumentsViewer;
