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
import { FileUploader } from "@/components/ui/file-uploader";
import { LoadingSpinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { RequestDetailsCard } from "./RequestDetailsCard";
import { BASE_API_URL } from "@/lib/constants";
import { File, ExternalLink, Replace } from "lucide-react";

interface SupervisorFinalThesisFormProps {
  request: any;
  onSuccess: () => void;
}

const SUPERVISOR_DOCS = [
  { id: "examinerList", label: "Approved List of Examiners", required: true },
  {
    id: "examinerInfoFormat",
    label: "Format for Information of Examiners",
    required: true,
  },
];

export const SupervisorFinalThesisReviewForm: React.FC<
  SupervisorFinalThesisFormProps
> = ({ request, onSuccess }) => {
  const [files, setFiles] = useState<Record<string, File[]>>({});
  const [comments, setComments] = useState("");
  const [existingFiles, setExistingFiles] = useState<Record<string, any>>({});

  useEffect(() => {
    const supervisorDocs = request.documents.filter(
      (doc: any) => doc.isPrivate
    );
    const preloaded: Record<string, any> = {};
    supervisorDocs.forEach((doc: any) => {
      if (SUPERVISOR_DOCS.some((d) => d.id === doc.documentType)) {
        preloaded[doc.documentType] = doc;
      }
    });
    setExistingFiles(preloaded);
  }, [request.documents]);

  const mutation = useMutation({
    mutationFn: (formData: FormData) => {
      return api.post(
        `/phd-request/supervisor/review-final-thesis/${request.id}`,
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
        if (doc.required && !uploadedFile && !existingFiles[doc.id]) {
          return toast.error(
            `Please upload the required document: ${doc.label}`
          );
        }
        if (uploadedFile) {
          formData.append("documents", uploadedFile, doc.id);
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
          <RequestDetailsCard
            request={{
              ...request,
              documents: request.documents.filter((d: any) => !d.isPrivate),
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Action & Documents</CardTitle>
          <CardDescription>
            Approve the submission and upload your confidential documents, or
            revert with comments for the student to revise.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {SUPERVISOR_DOCS.map((doc) => {
              const existingFile = existingFiles[doc.id];
              const currentFile = files[doc.id]?.[0];
              return (
                <div key={doc.id}>
                  <Label>
                    {doc.label}
                    {doc.required && (
                      <span className="text-destructive">*</span>
                    )}
                  </Label>
                  {existingFile && !currentFile ? (
                    <div className="mt-1 flex items-center justify-between gap-2 rounded-md border bg-blue-50 p-3">
                      <a
                        href={`${BASE_API_URL}f/${existingFile.file.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                      >
                        <File className="h-4 w-4" /> View Current File
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() =>
                          document.getElementById(`uploader-${doc.id}`)?.click()
                        }
                      >
                        <Replace className="mr-2 h-4 w-4" /> Replace
                      </Button>
                      <div className="hidden">
                        <FileUploader
                          id={`uploader-${doc.id}`}
                          value={[]}
                          onValueChange={(fileList) =>
                            handleFileChange(doc.id, fileList)
                          }
                          maxFileCount={1}
                          maxSize={4 * 1024 * 1024}
                          accept={{ "application/pdf": [] }}
                        />
                      </div>
                    </div>
                  ) : (
                    <FileUploader
                      value={files[doc.id] || []}
                      onValueChange={(fileList) =>
                        handleFileChange(doc.id, fileList)
                      }
                      maxFileCount={1}
                      maxSize={4 * 1024 * 1024}
                      accept={{ "application/pdf": [] }}
                    />
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    These documents will not be visible to the student.
                  </p>
                </div>
              );
            })}
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
