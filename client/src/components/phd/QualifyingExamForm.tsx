"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import api from "@/lib/axios-instance";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export default function ExamForm() {
  const [qualifyingArea1, setQualifyingArea1] = useState("");
  const [qualifyingArea2, setQualifyingArea2] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");

  const submitMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await api.post("/phd/student/uploadQeApplicationForm", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Qualifying exam application submitted successfully");
      setQualifyingArea1("");
      setQualifyingArea2("");
      setFile(null);
      setFileName("");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Submission failed");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !qualifyingArea1 || !qualifyingArea2) {
      toast.error("All fields are required");
      return;
    }

    const formData = new FormData();
    formData.append("qualificationForm", file);
    formData.append("qualifyingArea1", qualifyingArea1);
    formData.append("qualifyingArea2", qualifyingArea2);

    submitMutation.mutate(formData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setFileName(selectedFile?.name || "");
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="pt-6 space-y-4">
        <h2 className="text-2xl font-bold">Qualifying Exam Application</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="qualifyingArea1">Primary Research Area *</Label>
            <Input
              id="qualifyingArea1"
              value={qualifyingArea1}
              onChange={(e) => setQualifyingArea1(e.target.value)}
              placeholder="Enter primary research area"
              required
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="qualifyingArea2">Secondary Research Area *</Label>
            <Input
              id="qualifyingArea2"
              value={qualifyingArea2}
              onChange={(e) => setQualifyingArea2(e.target.value)}
              placeholder="Enter secondary research area"
              required
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="qualificationForm">Research Proposal (PDF) *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="qualificationForm"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                required
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => document.getElementById("qualificationForm")?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                {fileName || "Choose PDF file"}
              </Button>
            </div>
            {fileName && (
              <p className="text-sm text-muted-foreground truncate">
                Selected file: {fileName}
              </p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={submitMutation.isLoading}
          >
            {submitMutation.isLoading ? "Submitting..." : "Submit Application"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}