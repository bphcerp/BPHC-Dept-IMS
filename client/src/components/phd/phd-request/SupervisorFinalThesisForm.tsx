import React, { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/spinner";
import { toast } from "sonner";

import { BASE_API_URL } from "@/lib/constants";
import { File, ExternalLink } from "lucide-react";

interface SupervisorFinalThesisFormProps {
  request: any;
  onSuccess: () => void;
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  examinerList: "Approved List of Examiners",
  examinerInfoFormat: "Format for Information of Examiners",
};

const SUPERVISOR_DOC_TYPES = Object.keys(DOCUMENT_TYPE_LABELS);

export const SupervisorFinalThesisReviewForm: React.FC<
  SupervisorFinalThesisFormProps
> = ({ request, onSuccess }) => {
  const [comments, setComments] = useState("");
  const [existingDocs, setExistingDocs] = useState<any[]>([]);

  useEffect(() => {
    const preThesisDocs = request.documents.filter(
      (doc: any) =>
        doc.isPrivate && SUPERVISOR_DOC_TYPES.includes(doc.documentType)
    );
    setExistingDocs(preThesisDocs);
  }, [request.documents]);

  const mutation = useMutation({
    mutationFn: (data: { action: "approve" | "revert"; comments: string }) => {
      return api.post(
        `/phd-request/supervisor/review-final-thesis/${request.id}`,
        data
      );
    },
    onSuccess: () => {
      toast.success("Final thesis review submitted successfully.");
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Submission failed.");
    },
  });

  const handleSubmit = (action: "approve" | "revert") => {
    if (action === "revert" && !comments.trim()) {
      return toast.error("Comments are required to revert.");
    }
    mutation.mutate({ action, comments });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Action & Documents</CardTitle>
          <CardDescription>
            Approve the submission to forward it with your previously approved
            documents, or revert with comments for the student to revise.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>Pre-approved Supervisor Documents</Label>
            <div className="mt-2 space-y-2 rounded-md border p-4">
              {existingDocs.length > 0 ? (
                existingDocs.map((doc) => (
                  <a
                    key={doc.id}
                    href={`${BASE_API_URL}f/${doc.file.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                  >
                    <File className="h-4 w-4" />
                    <span>
                      {DOCUMENT_TYPE_LABELS[doc.documentType] ||
                        doc.file.originalName}
                    </span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Could not find pre-approved documents. Please contact an
                  admin.
                </p>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              These documents were approved during the Pre-Thesis Submission
              stage and will be automatically attached upon approval. They are
              not visible to the student.
            </p>
          </div>

          <div>
            <Label htmlFor="comments">
              Comments for Student (Required if reverting)
            </Label>
            <Textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Provide comments for the student (if reverting) or for the DRC (if approving)..."
            />
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button
              variant="destructive"
              onClick={() => handleSubmit("revert")}
              disabled={mutation.isLoading}
            >
              Revert to Student
            </Button>
            <Button
              onClick={() => handleSubmit("approve")}
              disabled={mutation.isLoading}
            >
              {mutation.isLoading && (
                <LoadingSpinner className="mr-2 h-4 w-4" />
              )}
              Approve and Submit to DRC
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
