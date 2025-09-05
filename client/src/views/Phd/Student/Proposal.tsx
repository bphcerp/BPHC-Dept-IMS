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
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { FileText, Plus } from "lucide-react";

interface Proposal {
  id: number;
  title: string;
  status: string;
  updatedAt: string;
  active: boolean;
}

const StudentProposal: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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

  const submitMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await api.post<{ submittedProposalId: number }>(
        "/phd/proposal/student/submitProposal",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    },
    onSuccess: (res) => {
      toast.success(
        "Proposal submitted successfully with ID " + res.submittedProposalId
      );
      setIsDialogOpen(false);
      setTitle("");
      setAbstractFile(null);
      setProposalFile(null);
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

  const handleSubmit = () => {
    if (!title.trim() || !abstractFile || !proposalFile) {
      toast.error("Please fill all fields and upload both files");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("abstractFile", abstractFile);
    formData.append("proposalFile", proposalFile);

    submitMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner className="h-10 w-10" />
          <p className="ml-4 text-gray-500">Loading proposals...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardContent className="p-12">
              <div className="text-center">
                <div className="mb-4 text-red-500">
                  <svg
                    className="mx-auto h-12 w-12"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-medium text-gray-900">
                  Error Loading Proposals
                </h3>
                <p className="text-gray-500">{(error as Error).message}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { proposals = [], canApply = false } = data || {};

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
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Submit New Proposal
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Submit PhD Proposal</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Proposal Title</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter proposal title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="abstract">Abstract File (PDF)</Label>
                    <Input
                      id="abstract"
                      type="file"
                      accept=".pdf"
                      onChange={(e) =>
                        setAbstractFile(e.target.files?.[0] || null)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="proposal">Proposal File (PDF)</Label>
                    <Input
                      id="proposal"
                      type="file"
                      accept=".pdf"
                      onChange={(e) =>
                        setProposalFile(e.target.files?.[0] || null)
                      }
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={submitMutation.isLoading}
                    >
                      {submitMutation.isLoading ? "Submitting..." : "Submit"}
                    </Button>
                  </div>
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
                    <TableHead className="font-medium text-gray-700">
                      Title
                    </TableHead>
                    <TableHead className="font-medium text-gray-700">
                      Status
                    </TableHead>
                    <TableHead className="font-medium text-gray-700">
                      Last Updated
                    </TableHead>
                    <TableHead className="font-medium text-gray-700">
                      Active
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proposals.map((proposal) => (
                    <TableRow key={proposal.id} className="hover:bg-gray-50">
                      <TableCell className="text-gray-900">
                        {proposal.title}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            proposal.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : proposal.status === "supervisor_review"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-blue-100 text-blue-800"
                          }
                        >
                          {proposal.status.replace("_", " ").toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-900">
                        {new Date(proposal.updatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={proposal.active ? "default" : "secondary"}
                        >
                          {proposal.active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-8 text-center">
                <FileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <h3 className="mb-2 text-lg font-medium text-gray-900">
                  No Proposals Yet
                </h3>
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

        {!canApply && proposals.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="mb-4 text-yellow-500">
                  <svg
                    className="mx-auto h-12 w-12"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-medium text-gray-900">
                  Cannot Submit New Proposal
                </h3>
                <p className="text-gray-500">
                  You currently have an active proposal or are not eligible to
                  submit a new one.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default StudentProposal;
