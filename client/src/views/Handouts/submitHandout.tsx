// createApplication.tsx
import React, { useState, ChangeEvent, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { useParams } from "react-router-dom";
import { isAxiosError } from "axios";

const CreateApplication: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading] = useState<boolean>(false);
  const params = useParams();
  const queryClient = useQueryClient();

  const handoutSubmitMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("handout", file);
      await api.post(`/handout/submit?id=${params.id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
    onSuccess: async () => {
      toast.success("Handout Upload Successfully");
      await queryClient.refetchQueries(["handouts-faculty", "handouts-dca"]);
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        const { response, message } = error;
        if (response?.status == 400) {
          toast.error(message);
        }
      } else {
        toast.error("Error in uploading handout");
      }
    },
  });

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!file) {
      toast.error("Please select a file to upload.");
      return;
    }

    if (file.type != "application/pdf") {
      toast.error("Invalid file type. Only PDF type files are allowed.");
      return;
    }

    handoutSubmitMutation.mutate(file);
  };

  return (
    <div className="flex w-full px-6 pt-4">
      <h1 className="mb-6 text-center text-3xl font-bold text-primary">
        Submit Handout
      </h1>
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
          <div className="flex flex-col space-y-2">
            <Label htmlFor="file-upload">Upload File</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="file:cursor-pointer file:rounded-md file:border file:border-black file:bg-primary file:text-white file:hover:bg-blue-800"
            />
          </div>
          <Button type="submit" disabled={uploading}>
            {uploading ? "Processing..." : "Submit"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CreateApplication;
