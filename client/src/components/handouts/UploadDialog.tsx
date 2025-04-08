import React, { ChangeEvent, FormEvent, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { Input } from "../ui/input";

interface UploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: () => void;
  id: string;
  refetch: () => Promise<void>;
}

export const UploadDialog: React.FC<UploadDialogProps> = ({
  isOpen,
  onClose,
  onUpload,
  id,
  refetch,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading] = useState<boolean>(false);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("handout", file);
      await api.post(`/handout/faculty/submit?id=${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
    onSuccess: async () => {
      toast.success("Handout Upload Successfully");
      await queryClient.invalidateQueries([
        "handouts-dca",
        "handouts-faculty",
        `handout-dcaconvenor ${id}`,
        `handout-dca ${id}`,
        `handout-faculty ${id}`,
      ]);
      await refetch();
      onUpload();
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

    uploadMutation.mutate(file);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="border border-gray-300 bg-white text-black">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Upload Handout</span>
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex w-full max-w-md flex-col space-y-6"
        >
          <Input
            id="file-upload"
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="mt-4 file:cursor-pointer file:rounded-md file:border file:border-black file:bg-primary file:text-white file:hover:bg-blue-800"
          />
          <Button type="submit" disabled={uploading} className="self-end">
            {uploading ? "Processing..." : "Submit"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
