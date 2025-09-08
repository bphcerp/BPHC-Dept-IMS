import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { LoadingSpinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { FileText, Plus, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Proposal {
  id: number;
  title: string;
  status: string;
  updatedAt: string;
  active: boolean;
  comments?: string | null;
}

const StudentProposal: React.FC = () => {
  const [isNewProposalDialogOpen, setIsNewProposalDialogOpen] = useState(false);
  const [proposalToResubmit, setProposalToResubmit] = useState<Proposal | null>(
    null
  );
  const [title, setTitle] = useState("");
  const [abstractFile, setAbstractFile] = useState<File | null>(null);
  const [proposalFile, setProposalFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["student-proposals"],
    queryFn: async () => {
      const response = await api.get<{
        proposals: Proposal[];
        canApply: boolean;
      }>("/phd/proposal/student/getProposals");
      return response.data;
    },
    refetchOnWindowFocus: false,
  });

  const resetForm = () => {
    setTitle("");
    setAbstractFile(null);
    setProposalFile(null);
    setIsNewProposalDialogOpen(false);
    setProposalToResubmit(null);
  };

  const submitMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await api.post<{ submittedProposalId: number }>(
        "/phd/proposal/student/submitProposal",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data;
    },
    onSuccess: (res) => {
      toast.success(
        "Proposal submitted successfully with ID " + res.submittedProposalId
      );
      resetForm();
      void queryClient.invalidateQueries({ queryKey: ["student-proposals"] });
    },
    onError: (err) => {
      toast.error(
        "Failed to submit proposal: " +
          ((err as { response: { data: string } }).response?.data ??
            "Unknown error")
      );
    },
  });

  const resubmitMutation = useMutation({
    mutationFn: async (data: { proposalId: number; formData: FormData }) => {
      const response = await api.post<void>(
        `/phd/proposal/student/resubmit/${data.proposalId}`,
        data.formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("Proposal resubmitted successfully!");
      resetForm();
      void queryClient.invalidateQueries({ queryKey: ["student-proposals"] });
    },
    onError: (err) => {
      toast.error(
        "Failed to resubmit proposal: " +
          ((err as { response: { data: string } }).response?.data ??
            "Unknown error")
      );
    },
  });

  const handleFormSubmit = (isResubmit: boolean) => {
    if (!title.trim() || !abstractFile || !proposalFile) {
      toast.error("Please fill all fields and upload both files.");
      return;
    }
    const formData = new FormData();
    formData.append("title", title);
    formData.append("abstractFile", abstractFile);
    formData.append("proposalFile", proposalFile);

    if (isResubmit && proposalToResubmit) {
      resubmitMutation.mutate({ proposalId: proposalToResubmit.id, formData });
    } else {
      submitMutation.mutate(formData);
    }
  };

  const openResubmitDialog = (proposal: Proposal) => {
    setTitle(proposal.title);
    setProposalToResubmit(proposal);
  };

  const { proposals = [], canApply = false } = data || {};

  // ... (error and loading states remain the same)
  if (isLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }
  if (error) {
    return <div className="text-red-500">Error loading proposals.</div>;
  }

  return (
    <div className="min-h-screen w-full bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">PhD Proposals</h1>
            <p className="mt-2 text-gray-600">
              Manage your PhD proposal submissions
            </p>
          </div>
          {canApply && (
            <Dialog
              open={isNewProposalDialogOpen}
              onOpenChange={setIsNewProposalDialogOpen}
            >
              <DialogTrigger asChild>
                <Button onClick={() => setTitle("")}>
                  <Plus className="mr-2 h-4 w-4" /> Submit New Proposal
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Submit PhD Proposal</DialogTitle>
                </DialogHeader>
                {/* Form Content */}
                <div className="space-y-4">
                  {/* ... form inputs ... */}
                  <Button onClick={() => handleFormSubmit(false)}>
                    Submit
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              Your Proposals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {proposals.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proposals.map((proposal) => (
                    <React.Fragment key={proposal.id}>
                      <TableRow className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          {proposal.title}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              proposal.status === "dac_rejected"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {proposal.status.replace("_", " ").toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(proposal.updatedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {proposal.status === "dac_rejected" && (
                            <Button
                              size="sm"
                              onClick={() => openResubmitDialog(proposal)}
                            >
                              Resubmit
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                      {proposal.status === "dac_rejected" &&
                        proposal.comments && (
                          <TableRow>
                            <TableCell colSpan={4}>
                              <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                  <p className="font-semibold">
                                    DAC Member Comments:
                                  </p>
                                  <pre className="whitespace-pre-wrap font-sans">
                                    {proposal.comments}
                                  </pre>
                                </AlertDescription>
                              </Alert>
                            </TableCell>
                          </TableRow>
                        )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-8 text-center">
                <FileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <h3 className="mb-2 text-lg font-medium">No Proposals Yet</h3>
                <p className="text-gray-500">
                  You haven&apos;t submitted any proposals yet.
                </p>
                {canApply && (
                  <p className="mt-2 text-gray-500">
                    Click &quot;Submit New Proposal&quot; to get started.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resubmit Dialog */}
        <Dialog
          open={!!proposalToResubmit}
          onOpenChange={() => setProposalToResubmit(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Resubmit Proposal</DialogTitle>
              <DialogDescription>
                You are resubmitting:{" "}
                <strong>{proposalToResubmit?.title}</strong>. Please upload the
                revised documents.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="title-resubmit">Proposal Title</Label>
                <Input
                  id="title-resubmit"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="abstract-resubmit">
                  New Abstract File (PDF) *
                </Label>
                <Input
                  id="abstract-resubmit"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setAbstractFile(e.target.files?.[0] || null)}
                />
              </div>
              <div>
                <Label htmlFor="proposal-resubmit">
                  New Proposal File (PDF) *
                </Label>
                <Input
                  id="proposal-resubmit"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setProposalFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setProposalToResubmit(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleFormSubmit(true)}
                disabled={resubmitMutation.isLoading}
              >
                {resubmitMutation.isLoading ? "Submitting..." : "Resubmit"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default StudentProposal;
