import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileUploader } from "@/components/ui/file-uploader";
import { LoadingSpinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

interface SupervisorResubmitFormProps {
  requestId: number;
  onSuccess: () => void;
}

export const SupervisorResubmitForm: React.FC<SupervisorResubmitFormProps> = ({
  requestId,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<File[]>([]);
  const [comments, setComments] = useState("");

  const mutation = useMutation({
    mutationFn: (formData: FormData) => {
      return api.post(
        `/phd-request/supervisor/resubmit/${requestId}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
    },
    onSuccess: () => {
      toast.success("Request resubmitted successfully!");
      void queryClient.invalidateQueries({
        queryKey: ["supervisor-my-students"],
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to resubmit request."
      );
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    if (comments) {
      formData.append("comments", comments);
    }
    files.forEach((file) => {
      formData.append("documents", file);
    });
    mutation.mutate(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resubmit PhD Request</CardTitle>
        <CardDescription>
          The request was reverted. Please upload any corrected documents and
          add comments before resubmitting.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4 pt-4">
          <div>
            <Label htmlFor="documents">
              Corrected/Additional Documents (Optional)
            </Label>
            <FileUploader
              value={files}
              onValueChange={setFiles}
              maxFileCount={5}
              maxSize={2 * 1024 * 1024}
              accept={{ "application/pdf": [] }}
            />
            <p className="mt-1 text-sm text-muted-foreground">
              Uploading new files will replace all previous documents for this
              request.
            </p>
          </div>
          <div>
            <Label htmlFor="comments">Comments (Optional)</Label>
            <Textarea
              id="comments"
              placeholder="Add any additional comments for the DRC Convener..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={mutation.isLoading}>
              {mutation.isLoading && (
                <LoadingSpinner className="mr-2 h-4 w-4" />
              )}
              Resubmit to DRC
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
