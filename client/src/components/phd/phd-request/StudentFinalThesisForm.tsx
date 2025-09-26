// client/src/components/phd/phd-request/StudentFinalThesisForm.tsx
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
import { Download } from "lucide-react";

interface StudentFinalThesisFormProps {
  request: { id: number };
  onSuccess: () => void;
}

const FINAL_THESIS_DOCS = [
  {
    id: "thesis_template",
    label: "Thesis Template",
    required: true,
    href: "#",
  },
  {
    id: "synopsis_template",
    label: "Synopsis Template",
    required: true,
    href: "#",
  },
  {
    id: "anti_plagiarism_report",
    label: "Anti-Plagiarism Digital Report",
    required: true,
    href: "#",
  },
  {
    id: "plagiarism_receipt",
    label: "Plagiarism Receipt",
    required: true,
    href: "#",
  },
  {
    id: "thesis_fee_receipt",
    label: "Thesis Fee Receipt (from SWD)",
    required: true,
    href: "#",
  },
  {
    id: "title_approval_form",
    label: "Title Approval Form Copy (if title changed)",
    required: false,
    href: "#",
  },
  {
    id: "dac_comments_copy",
    label: "DAC Comments Copy (from Pre-Submission)",
    required: false,
    href: "#",
  },
  {
    id: "evaluation_forms",
    label: "Evaluation Forms for the semester",
    required: true,
    href: "#",
  },
  {
    id: "pre_submission_notice",
    label: "Pre-Submission Seminar Notice",
    required: true,
    href: "#",
  },
  {
    id: "supervisor_consent_form",
    label: "Consent form by Supervisor",
    required: true,
    href: "#",
  },
  { id: "thesis_form_1", label: "Thesis Form 1", required: true, href: "#" },
  { id: "thesis_form_2", label: "Thesis Form 2", required: true, href: "#" },
];

export const StudentFinalThesisForm: React.FC<StudentFinalThesisFormProps> = ({
  request,
  onSuccess,
}) => {
  const [files, setFiles] = useState<Record<string, File[]>>({});
  const [comments, setComments] = useState("");

  const mutation = useMutation({
    mutationFn: (formData: FormData) => {
      return api.post(
        `/phd/request/student/submit-final-thesis/${request.id}`,
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
    let fileCount = 0;

    for (const doc of FINAL_THESIS_DOCS) {
      const uploadedFile = files[doc.id]?.[0];
      if (doc.required && !uploadedFile) {
        return toast.error(`Please upload the required document: ${doc.label}`);
      }
      if (uploadedFile) {
        formData.append(doc.id, uploadedFile);
        fileCount++;
      }
    }

    if (fileCount === 0) {
      return toast.error("You must upload at least one document.");
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
        {/* This alert can be conditionally rendered based on request status */}
        {/* <Alert variant="destructive">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Action Required</AlertTitle>
                    <AlertDescription>
                        Your submission was reverted. Please review comments and re-upload corrected documents.
                    </AlertDescription>
                </Alert> */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {FINAL_THESIS_DOCS.map((doc) => (
            <div key={doc.id}>
              <div className="mb-1 flex items-center gap-2">
                <Label htmlFor={doc.id}>
                  {doc.label}
                  {doc.required && <span className="text-destructive">*</span>}
                </Label>
                <a
                  href={doc.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Download Template"
                  className="text-primary hover:underline"
                >
                  <Download className="h-4 w-4" />
                </a>
              </div>
              <FileUploader
                value={files[doc.id] || []}
                onValueChange={(fileList) => handleFileChange(doc.id, fileList)}
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
