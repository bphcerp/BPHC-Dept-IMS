// createApplication.tsx
import React, { useState, ChangeEvent, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const CreateApplication: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);

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

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Only PDF and DOCX are allowed.");
      return;
    }

    console.log("File ready for submission:", file);
    toast.success("File uploaded successfully.");
  };

  return (
    <div className="flex w-full px-6 pt-4">
      <h1 className="text-3xl font-bold text-primary text-center mb-6">
        Faculty Create Application
      </h1>
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
          <div className="flex flex-col space-y-2">
            <Label htmlFor="file-upload">Upload File</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".pdf, .docx"
              onChange={handleFileChange}
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
