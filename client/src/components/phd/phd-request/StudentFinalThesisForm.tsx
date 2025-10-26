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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, File, ExternalLink, Replace } from "lucide-react";
import { BASE_API_URL } from "@/lib/constants";

interface StudentFinalThesisFormProps {
  request: {
    id: number;
    comments: string | null;
    documents: any[];
    reviews: {
      approved: boolean;
      comments: string | null;
      studentComments: string | null;
    }[];
  };
  onSuccess: () => void;
}

const FINAL_THESIS_DOCS = [
  { id: "thesisTemplate", label: "Thesis Template", required: true },
  { id: "synopsisTemplate", label: "Synopsis Template", required: true },
  {
    id: "antiPlagiarismReport",
    label: "Anti-Plagiarism Digital Report",
    required: true,
  },
  { id: "plagiarismReceipt", label: "Plagiarism Receipt", required: true },
  { id: "thesisFeeReceipt", label: "Thesis Fee Receipt (SWD)", required: true },
  {
    id: "titleApprovalForm",
    label: "Title Approval Form Copy",
    required: true,
  },
  { id: "dacCommentsCopy", label: "DAC Comments Copy", required: true },
  { id: "evaluationForms", label: "Evaluation Forms", required: true },
  {
    id: "preSubmissionNotice",
    label: "Pre-Submission Seminar Notice",
    required: true,
  },
  {
    id: "supervisorConsent",
    label: "Consent form by Supervisor",
    required: true,
  },
  { id: "thesisForm1", label: "Thesis Form 1", required: true },
  { id: "thesisForm2", label: "Thesis Form 2", required: true },
];

export const StudentFinalThesisForm: React.FC<StudentFinalThesisFormProps> = ({
  request,
  onSuccess,
}) => {
  const [files, setFiles] = useState<Record<string, File[]>>({});
  const [comments, setComments] = useState(request.comments || "");
  const [existingFiles, setExistingFiles] = useState<Record<string, any>>({});

  const lastReview = request.reviews.length > 0 ? request.reviews[0] : null;
  const isReverted = lastReview && !lastReview.approved;
  const revertComments = lastReview?.studentComments || lastReview?.comments;

  useEffect(() => {
    const studentDocs = request.documents.filter((doc) => !doc.isPrivate);
    const preloaded: Record<string, any> = {};
    studentDocs.forEach((doc) => {
      const field = FINAL_THESIS_DOCS.find((f) => f.id === doc.documentType);
      if (field) {
        preloaded[field.id] = doc;
      }
    });
    setExistingFiles(preloaded);
    setComments(request.comments || "");
  }, [request]);

  const mutation = useMutation({
    mutationFn: (formData: FormData) => {
      return api.post(
        `/phd-request/student/submit-final-thesis/${request.id}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
    },
    onSuccess: () => {
      toast.success("Changes saved successfully! Preview to finalize.");
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Saving failed.");
    },
  });

  const handleFileChange = (fieldId: string, fileList: File[]) => {
    setFiles((prev) => ({ ...prev, [fieldId]: fileList }));
  };

  const handleSaveChanges = () => {
    const formData = new FormData();
    formData.append("submissionType", "draft");
    formData.append("comments", comments);

    for (const doc of FINAL_THESIS_DOCS) {
      const uploadedFile = files[doc.id]?.[0];
      if (uploadedFile) {
        formData.append("documents", uploadedFile, doc.id);
      }
    }
    mutation.mutate(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Final Thesis Submission</CardTitle>
        <CardDescription>
          Please upload or replace the required documents for your final thesis
          submission.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isReverted && (
          <Alert variant="destructive">
            <Info className="h-4 w-4" />
            <AlertTitle>Action Required</AlertTitle>
            <AlertDescription>
              Your submission has been reverted. Please review the comments,
              make the necessary corrections, and re-upload the corrected
              documents.
              <p className="mt-2 font-semibold">Comments: {revertComments}</p>
            </AlertDescription>
          </Alert>
        )}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FINAL_THESIS_DOCS.map((doc) => {
            const existingFile = existingFiles[doc.id];
            const currentFile = files[doc.id]?.[0];
            return (
              <div key={doc.id}>
                <Label>
                  {doc.label}
                  {doc.required && <span className="text-destructive">*</span>}
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
                        maxSize={10 * 1024 * 1024}
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
                    maxSize={10 * 1024 * 1024}
                    accept={{ "application/pdf": [] }}
                  />
                )}
              </div>
            );
          })}
        </div>
        <div>
          <Label htmlFor="comments">Comments for Supervisor (Optional)</Label>
          <Textarea
            id="comments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Add any notes or comments for your supervisor regarding your submission..."
          />
        </div>
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button
            onClick={handleSaveChanges}
            disabled={mutation.isLoading}
            className="w-full"
          >
            {mutation.isLoading && <LoadingSpinner className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
