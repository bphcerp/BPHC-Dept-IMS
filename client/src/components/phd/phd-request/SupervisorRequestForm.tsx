import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { phdRequestSchemas } from "lib";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileUploader } from "@/components/ui/file-uploader";
import { LoadingSpinner } from "@/components/ui/spinner";
import { toast } from "sonner";

interface SupervisorRequestFormProps {
  studentEmail: string;
  requestType: (typeof phdRequestSchemas.phdRequestTypes)[number];
  onSuccess: () => void;
}

export const SupervisorRequestForm: React.FC<SupervisorRequestFormProps> = ({
  studentEmail,
  requestType,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [generalFiles, setGeneralFiles] = useState<File[]>([]);
  const [examinerListFile, setExaminerListFile] = useState<File[]>([]);
  const [examinerInfoFile, setExaminerInfoFile] = useState<File[]>([]);

  const form = useForm<phdRequestSchemas.CreateRequestBody>({
    resolver: zodResolver(
      phdRequestSchemas.createRequestSchema.omit({
        studentEmail: true,
        requestType: true,
      })
    ),
    defaultValues: {
      comments: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (formData: FormData) => {
      return api.post("/phd-request/supervisor/create", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      toast.success("Request submitted successfully!");
      void queryClient.invalidateQueries({
        queryKey: ["supervisor-my-students"],
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to submit request.");
    },
  });

  const onSubmit = (data: { comments?: string }) => {
    const formData = new FormData();
    formData.append("studentEmail", studentEmail);
    formData.append("requestType", requestType);
    if (data.comments) {
      formData.append("comments", data.comments);
    }

    if (requestType === "pre_thesis_submission") {
      if (examinerListFile.length === 0 || examinerInfoFile.length === 0) {
        toast.error(
          "Please upload both required documents for pre-thesis submission."
        );
        return;
      }
      formData.append("examinerList", examinerListFile[0]);
      formData.append("examinerInfoFormat", examinerInfoFile[0]);
    } else if (requestType !== "final_thesis_submission") {
      if (generalFiles.length === 0) {
        toast.error("Please upload at least one required document.");
        return;
      }
      generalFiles.forEach((file) => {
        formData.append("documents", file);
      });
    }

    mutation.mutate(formData);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
      {requestType === "pre_thesis_submission" ? (
        <div className="space-y-4">
          <div>
            <Label htmlFor="examinerList">Approved List of Examiners *</Label>
            <FileUploader
              value={examinerListFile}
              onValueChange={setExaminerListFile}
              maxFileCount={1}
              maxSize={2 * 1024 * 1024}
              accept={{ "application/pdf": [] }}
            />
          </div>
          <div>
            <Label htmlFor="examinerInfoFormat">
              Format for Information of Examiners *
            </Label>
            <FileUploader
              value={examinerInfoFile}
              onValueChange={setExaminerInfoFile}
              maxFileCount={1}
              maxSize={2 * 1024 * 1024}
              accept={{ "application/pdf": [] }}
            />
          </div>
        </div>
      ) : requestType !== "final_thesis_submission" ? (
        <div>
          <Label htmlFor="documents">Required Documents</Label>
          <FileUploader
            value={generalFiles}
            onValueChange={setGeneralFiles}
            maxFileCount={5}
            maxSize={2 * 1024 * 1024}
            accept={{ "application/pdf": [] }}
          />
        </div>
      ) : null}

      <div>
        <Label htmlFor="comments">Comments (Optional)</Label>
        <Textarea
          id="comments"
          placeholder="Add any additional comments for the DRC Convener..."
          {...form.register("comments")}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={mutation.isLoading}>
          {mutation.isLoading && <LoadingSpinner className="mr-2 h-4 w-4" />}
          Submit Request
        </Button>
      </div>
    </form>
  );
};
