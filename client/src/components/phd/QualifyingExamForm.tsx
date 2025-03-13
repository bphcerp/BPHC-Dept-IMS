"use client";

import type React from "react";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import api from "@/lib/axios-instance";
import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";

export default function ExamForm() {
  const [subArea1, setSubArea1] = useState("");
  const [subArea2, setSubArea2] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setFileName(e.target.files[0].name);
    }
  };

  interface Application {
    fileUrl: string;
    formName: string;
    applicationType: string;
    qualifyingArea1: string;
    qualifyingArea2: string;
  }

  const submitMutation = useMutation({
    mutationFn: async (data: Application) => {
      return api.post("/phd/student/uploadQeApplicationForm",  data );
    },
    onSuccess: (_) => {
      toast.success("Qualifying Exam form submitted successfully");
    },
    onError: () => {
      toast.error("Failed to submit Qualifying Exam form");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !subArea1 || !subArea2) {
      alert("Please fill out all the fields!");
      return;
    }
    submitMutation.mutate({
      fileUrl: file.name,
      formName: "Qualifying Exam",
      applicationType: "qualifying_exam",
      qualifyingArea1: subArea1,
      qualifyingArea2: subArea2,
    });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subArea1">Sub Area 1</Label>
            <Input
              id="subArea1"
              value={subArea1}
              onChange={(e) => setSubArea1(e.target.value)}
              placeholder="Enter sub area 1"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subArea2">Sub Area 2</Label>
            <Input
              id="subArea2"
              value={subArea2}
              onChange={(e) => setSubArea2(e.target.value)}
              placeholder="Enter sub area 2"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Upload File</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                required
              />
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={() => document.getElementById("file")?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                {fileName || "Choose file"}
              </Button>
            </div>
            {fileName && (
              <p className="mt-1 text-sm text-muted-foreground">
                Selected: {fileName}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full">
            Submit
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
