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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface StudentFinalThesisFormProps {
  request: {
    id: number;
    reviews: { approved: boolean; comments: string | null }[];
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
  const [comments, setComments] = useState("");

  const lastReview = request.reviews.length > 0 ? request.reviews[0] : null;
  const isReverted = lastReview && !lastReview.approved;

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
      toast.success("Final thesis documents submitted for supervisor review.");
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Submission failed.");
    },
  });

  const handleFileChange = (fieldId: string, fileList: File[]) => {
    setFiles((prev) => ({ ...prev, [fieldId]: fileList }));
  };

  const handleSubmit = () => {
    const formData = new FormData();

    for (const doc of FINAL_THESIS_DOCS) {
      const uploadedFile = files[doc.id]?.[0];
      if (doc.required && !uploadedFile) {
        return toast.error(`Please upload the required document: ${doc.label}`);
      }
      if (uploadedFile) {
        formData.append("documents", uploadedFile, uploadedFile.name);
      }
    }

    formData.append("comments", comments);
    mutation.mutate(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Final Thesis Submission</CardTitle>
        <CardDescription>
          Please upload all the required documents for your final thesis
          submission.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isReverted && (
          <Alert variant="destructive">
            <Info className="h-4 w-4" />
            <AlertTitle>Action Required</AlertTitle>
            <AlertDescription>
              Your submission has been reverted. Please review your supervisor's
              comments, make the necessary corrections, and re-upload the
              corrected documents.
              <p className="mt-2 font-semibold">
                Comments: {lastReview.comments}
              </p>
            </AlertDescription>
          </Alert>
        )}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FINAL_THESIS_DOCS.map((doc) => (
            <div key={doc.id}>
              <Label>
                {doc.label}
                {doc.required && <span className="text-destructive">*</span>}
              </Label>
              <FileUploader
                value={files[doc.id] || []}
                onValueChange={(fileList) => handleFileChange(doc.id, fileList)}
                maxFileCount={1}
                maxSize={10 * 1024 * 1024}
                accept={{ "application/pdf": [] }}
              />
            </div>
          ))}
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
        <div className="flex justify-end border-t pt-4">
          <Button onClick={handleSubmit} disabled={mutation.isLoading}>
            {mutation.isLoading && <LoadingSpinner className="mr-2 h-4 w-4" />}
            Submit to Supervisor
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
