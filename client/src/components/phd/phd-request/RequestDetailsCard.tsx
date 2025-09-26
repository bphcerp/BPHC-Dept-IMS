// client/src/components/phd/phd-request/RequestDetailsCard.tsx
import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { BASE_API_URL } from "@/lib/constants";

interface PhdRequestDetails {
  id: number;
  requestType: string;
  status: string;
  comments: string | null;
  student: { name: string; email: string };
  supervisor: { name: string; email: string };
  documents: Array<{
    id: number;
    documentType: string;
    isPrivate?: boolean;
    file: { originalName: string; id: number };
  }>;
}

interface RequestDetailsCardProps {
  request: PhdRequestDetails;
  // Prop to conditionally hide private documents (for student view)
  hidePrivateDocs?: boolean;
}

export const RequestDetailsCard: React.FC<RequestDetailsCardProps> = ({
  request,
  hidePrivateDocs = false,
}) => {
  const formatTitle = (text: string) =>
    text.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  const visibleDocuments = hidePrivateDocs
    ? request.documents.filter((doc) => !doc.isPrivate)
    : request.documents;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl">
              {formatTitle(request.requestType)} Request
            </CardTitle>
            <CardDescription className="mt-1">
              For: <strong>{request.student.name}</strong> (
              {request.student.email})
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-sm">
            {formatTitle(request.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold">Supervisor</h4>
          <p className="text-muted-foreground">
            {request.supervisor.name} ({request.supervisor.email})
          </p>
        </div>
        {request.comments && (
          <div>
            <h4 className="text-sm font-semibold">
              Initial Comments from Supervisor
            </h4>
            <p className="rounded-md border bg-muted/50 p-3 text-muted-foreground">
              {request.comments}
            </p>
          </div>
        )}
        <div>
          <h4 className="mb-2 text-sm font-semibold">Submitted Documents</h4>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
            {visibleDocuments.length > 0 ? (
              visibleDocuments.map((doc) => (
                <a
                  key={doc.id}
                  href={`${BASE_API_URL}/f/${doc.file.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span className="truncate">{doc.file.originalName}</span>
                  </Button>
                </a>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No documents were submitted with this request.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
