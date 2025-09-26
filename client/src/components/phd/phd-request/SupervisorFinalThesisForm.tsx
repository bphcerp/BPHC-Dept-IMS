// client/src/components/phd/phd-request/SupervisorFinalThesisForm.tsx
import React, { useState } from "react";
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
import { FileUploader } from "@/components/ui/file-uploader";
import { LoadingSpinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { RequestDetailsCard } from "./RequestDetailsCard"; // To show student's submission

interface SupervisorFinalThesisFormProps {
  request: any; // Use the full detailed request type here
  onSuccess: () => void;
}

const SUPERVISOR_DOCS = [
  { id: "examiner_list", label: "Approved List of Examiners", required: true },
  {
    id: "examiner_info",
    label: "Format for Information of Examiners",
    required: true,
  },
];

export const SupervisorFinalThesisForm: React.FC<
  SupervisorFinalThesisFormProps
> = ({ request, onSuccess }) => {
  const [files, setFiles] = useState<Record<string, File[]>>({});
  const [comments, setComments] = useState("");

  const mutation = useMutation({
    mutationFn: (formData: FormData) => {
      // NOTE: This endpoint needs to be created on the backend
      return api.post(
        `/phd/request/supervisor/review-final-thesis/${request.id}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
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
    const formData = new FormData();
    formData.append("action", action);
    formData.append("comments", comments);

    if (action === "revert" && !comments.trim()) {
      return toast.error("Comments are required to revert.");
    }

    if (action === "approve") {
      for (const doc of SUPERVISOR_DOCS) {
        const uploadedFile = files[doc.id]?.[0];
        if (doc.required && !uploadedFile) {
          return toast.error(
            `Please upload the required document: ${doc.label}`
          );
        }
        if (uploadedFile) {
          formData.append(doc.id, uploadedFile);
        }
      }
    }
    mutation.mutate(formData);
  };

  const handleFileChange = (fieldId: string, fileList: File[]) => {
    setFiles((prev) => ({ ...prev, [fieldId]: fileList }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Review Student's Final Thesis Submission</CardTitle>
          <CardDescription>
            The documents submitted by the student are listed below for your
            review.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* This shows the student's submission details, hiding any private supervisor docs from previous rounds */}
          <RequestDetailsCard request={request} hidePrivateDocs={true} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Action & Confidential Documents</CardTitle>
          <CardDescription>
            Approve the submission and upload your documents, or revert with
            comments for the student to revise.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {SUPERVISOR_DOCS.map((doc) => (
              <div key={doc.id}>
                <Label>
                  {doc.label}
                  {doc.required && <span className="text-destructive">*</span>}
                </Label>
                <FileUploader
                  value={files[doc.id] || []}
                  onValueChange={(fileList) =>
                    handleFileChange(doc.id, fileList)
                  }
                  accept={{ "application/pdf": [] }}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  This document will not be visible to the student.
                </p>
              </div>
            ))}
          </div>
          <div>
            <Label htmlFor="comments">Comments</Label>
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
