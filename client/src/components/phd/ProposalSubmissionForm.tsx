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

interface UploadResponse {
  message: string;
  success: boolean;
}

export default function ProposalSubmissionForm() {
  // Form links - replace with your actual links
  const formLinks = [
    {
      id: 1,
      url: "https://www.bits-pilani.ac.in/wp-content/uploads/1.-Appendix-I-to-be-attached-with-research-Proposals.pdf",
      label: "Proposal Form 1",
      fieldName: "proposalDocument1",
    },
    {
      id: 2,
      url: "https://www.bits-pilani.ac.in/wp-content/uploads/2.-Summary-of-Research-Proposal.pdf",
      label: "Proposal Form 2",
      fieldName: "proposalDocument2",
    },
    {
      id: 3,
      url: "https://www.bits-pilani.ac.in/wp-content/uploads/3.-Outline-of-the-Proposed-topic-of-Research.pdf",
      label: "Proposal Form 3",
      fieldName: "proposalDocument3",
    },
  ];

  const [formData, setFormData] = useState({
    proposalDocument1: null as File | null,
    proposalDocument2: null as File | null,
    proposalDocument3: null as File | null,
    supervisor: "",
    coSupervisor1: "",
    coSupervisor2: "",
  });

  // New state for checkboxes
  const [appendixIChecked, setAppendixIChecked] = useState(false);
  const [summaryResearchProposalChecked, setSummaryResearchProposalChecked] = useState(false);
  const [outlineProposedTopicChecked, setOutlineProposedTopicChecked] = useState(false);

  const proposalMutation = useMutation<UploadResponse, Error, FormData>({
    mutationFn: async (data: FormData): Promise<UploadResponse> => {
      const response = await api.post<UploadResponse>(
        "/phd/student/uploadProposalDocuments",
        data,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("Proposal submitted successfully.");
      
      setFormData({
        proposalDocument1: null,
        proposalDocument2: null,
        proposalDocument3: null,
        supervisor: "",
        coSupervisor1: "",
        coSupervisor2: "",
      });

      // Reset checkboxes
      setAppendixIChecked(false);
      setSummaryResearchProposalChecked(false);
      setOutlineProposedTopicChecked(false);
    },
    onError: (error) => {
      console.error("Submission error:", error);
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

    // Validate form data
    if (
      !formData.proposalDocument1 ||
      !formData.proposalDocument2 ||
      !formData.proposalDocument3
    ) {
      toast.error("Please upload all three proposal documents");
      return;
    }

    // Validate checkboxes
    if (!appendixIChecked || !summaryResearchProposalChecked || !outlineProposedTopicChecked) {
      toast.error("Please confirm you have filled all required forms");
      return;
    }

    if (!formData.supervisor) {
      toast.error("Please enter supervisor email");
      return;
    }

    const submitData = new FormData();
    submitData.append("proposalDocument1", formData.proposalDocument1);
    submitData.append("proposalDocument2", formData.proposalDocument2);
    submitData.append("proposalDocument3", formData.proposalDocument3);
    submitData.append("supervisor", formData.supervisor);
    submitData.append("coSupervisor1", formData.coSupervisor1);
    submitData.append("coSupervisor2", formData.coSupervisor2);

    proposalMutation.mutate(submitData);
  };

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Research Proposal Submission</CardTitle>
        <CardDescription>
          Download the required forms, fill them out, and upload the completed
          PDF documents.
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
                    <FileIcon className="h-4 w-4 text-primary" />
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
                    <Label htmlFor={link.fieldName}>
                      Upload Completed {link.label} (PDF)
                    </Label>
                  </div>
                  <Input
                    id={link.fieldName}
                    name={link.fieldName}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                    required
                  />
                  {formData[link.fieldName as keyof typeof formData] && (
                    <p className="text-xs text-green-600">
                      ✓{" "}
                      {
                        (
                          formData[
                            link.fieldName as keyof typeof formData
                          ] as File
                        ).name
                      }
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* New Checkbox Sections */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="appendixI" 
                  className="form-checkbox h-4 w-4"
                  checked={appendixIChecked}
                  onChange={(e) => setAppendixIChecked(e.target.checked)}
                  required 
                />
                <Label 
                  htmlFor="appendixI" 
                  className="text-sm font-medium"
                >
                  I have filled everything in Appendix I to be attached with Research Proposals *
                </Label>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="summaryResearchProposal" 
                  className="form-checkbox h-4 w-4"
                  checked={summaryResearchProposalChecked}
                  onChange={(e) => setSummaryResearchProposalChecked(e.target.checked)}
                  required 
                />
                <Label 
                  htmlFor="summaryResearchProposal" 
                  className="text-sm font-medium"
                >
                  I have filled everything in Summary of Research Proposal *
                </Label>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="outlineProposedTopic" 
                  className="form-checkbox h-4 w-4"
                  checked={outlineProposedTopicChecked}
                  onChange={(e) => setOutlineProposedTopicChecked(e.target.checked)}
                  required 
                />
                <Label 
                  htmlFor="outlineProposedTopic" 
                  className="text-sm font-medium"
                >
                  I have filled everything in Outline of the Proposed Topic of Research *
                </Label>
              </div>
            </div>
          </div>

          {/* Supervisor Emails */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Supervisor Information</h3>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MailIcon className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="supervisor">Supervisor Email *</Label>
              </div>
              <Input
                id="supervisor"
                name="supervisor"
                type="email"
                placeholder="Enter supervisor email"
                value={formData.supervisor}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MailIcon className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="coSupervisor1">Co-Supervisor Email 1 *</Label>
              </div>
              <Input
                id="coSupervisor1"
                name="coSupervisor1"
                type="email"
                placeholder="Enter co-supervisor email"
                value={formData.coSupervisor1}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MailIcon className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="coSupervisor2">Co-Supervisor Email 2 *</Label>
              </div>
              <Input
                id="coSupervisor2"
                name="coSupervisor2"
                type="email"
                placeholder="Enter co-supervisor email"
                value={formData.coSupervisor2}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
        <Button 
            type="submit" 
            className="w-full" 
            disabled={proposalMutation.isLoading}
          >
            {proposalMutation.isLoading ? "Submitting..." : "Submit Proposal"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}