import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileIcon, MailIcon, ExternalLinkIcon } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { toast } from "sonner";

export default function ProposalSubmissionForm() {
  // Sample links - replace with your actual links
  const formLinks = [
    {
      id: 1,
      url: "https://www.bits-pilani.ac.in/wp-content/uploads/1.-Appendix-I-to-be-attached-with-research-Proposals.pdf",
      label: "Proposal Form 1",
    },
    {
      id: 2,
      url: "https://www.bits-pilani.ac.in/wp-content/uploads/2.-Summary-of-Research-Proposal.pdf",
      label: "Proposal Form 2",
    },
    {
      id: 3,
      url: "https://www.bits-pilani.ac.in/wp-content/uploads/3.-Outline-of-the-Proposed-topic-of-Research.pdf",
      label: "Proposal Form 3",
    },
  ];

  const [formData, setFormData] = useState<{
    file1: File | null;
    file2: File | null;
    file3: File | null;
    supervisorEmail: string;
    coSupervisorEmail1: string;
    coSupervisorEmail2: string;
  }>({
    file1: null,
    file2: null,
    file3: null,
    supervisorEmail: "",
    coSupervisorEmail1: "",
    coSupervisorEmail2: "",
  });

  const proposalMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post(
        "/phd/student/uploadProposalDocuments",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success(
        `All Document uploaded successfully. Proposal submitted successfully.`
      );
    },
    onError: () => {
      toast.error("Failed to upload documents. Please try again.");
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const { name } = e.target;
      setFormData({
        ...formData,
        [name]: e.target.files[0],
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file1 || !formData.file2 || !formData.file3) {
      alert("Please upload all the files");
      return;
    } else if (!formData.supervisorEmail) {
      alert("Please enter supervisor email");
      return;
    } else if (!formData.coSupervisorEmail1 || !formData.coSupervisorEmail2) {
      alert("Please enter co-supervisor emails");
      return;
    } else {
      proposalMutation.mutate({
        fileUrl1: formData.file1.name,
        fileUrl2: formData.file2.name,
        fileUrl3: formData.file3.name,
        formName1: "Proposal Form 1",
        formName2: "Proposal Form 2",
        formName3: "Proposal Form 3",
        supervisor: formData.supervisorEmail,
        coSupervisor1: formData.coSupervisorEmail1,
        coSupervisor2: formData.coSupervisorEmail2,
      });
    }
  };

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Proposal Submission</CardTitle>
        <CardDescription>
          Download the forms, fill them out, and upload the completed documents.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Form Links and File Uploads */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Proposal Forms</h3>

            {formLinks.map((link) => (
              <div key={link.id} className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ExternalLinkIcon className="h-4 w-4 text-primary" />
                    <span className="font-medium">{link.label}</span>
                  </div>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    Download Form
                    <ExternalLinkIcon className="h-3 w-3" />
                  </a>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileIcon className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor={`file${link.id}`}>
                      Upload Completed Form
                    </Label>
                  </div>
                  <Input
                    id={`file${link.id}`}
                    name={`file${link.id}`}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    required
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Supervisor Emails */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Supervisor Information</h3>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MailIcon className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="supervisorEmail">Supervisor Email</Label>
              </div>
              <Input
                id="supervisorEmail"
                name="supervisorEmail"
                type="email"
                placeholder="Enter supervisor email"
                value={formData.supervisorEmail}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MailIcon className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="coSupervisorEmail1">
                  Co-Supervisor Email 1
                </Label>
              </div>
              <Input
                id="coSupervisorEmail1"
                name="coSupervisorEmail1"
                type="email"
                placeholder="Enter co-supervisor email"
                value={formData.coSupervisorEmail1}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MailIcon className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="coSupervisorEmail2">
                  Co-Supervisor Email 2
                </Label>
              </div>
              <Input
                id="coSupervisorEmail2"
                name="coSupervisorEmail2"
                type="email"
                placeholder="Enter co-supervisor email"
                value={formData.coSupervisorEmail2}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full">
            Submit Proposal
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
