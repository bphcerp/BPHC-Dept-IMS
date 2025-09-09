import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/axios-instance";
import { LoadingSpinner } from "@/components/ui/spinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Download, CheckCircle, ThumbsDown, ThumbsUp } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { phdSchemas } from "lib";
import BackButton from "@/components/BackButton";

interface ProposalDetails {
  id: number;
  title: string;
  status: string;
  student: { email: string; name: string | null };
  supervisor: { email: string; name: string | null };
  coSupervisors: { coSupervisor: { name: string | null; email: string } }[];
  dacMembers: { dacMember: { name: string | null; email: string } }[];
  abstractFileUrl: string;
  proposalFileUrl: string;
  currentUserReview: { approved: boolean; comments: string } | null;
}

const DacViewProposal: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const proposalId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [reviewStatus, setReviewStatus] = useState<"approve" | "reject">();
  const [comments, setComments] = useState("");

  const {
    data: proposal,
    isLoading,
    isError,
  } = useQuery<ProposalDetails>({
    queryKey: ["dac-proposal-view", proposalId],
    queryFn: async () => {
      const response = await api.get(
        `/phd/proposal/dacMember/viewProposal/${proposalId}`
      );
      return response.data;
    },
    enabled: !!proposalId,
  });

  const submitReviewMutation = useMutation({
    mutationFn: (data: phdSchemas.SubmitDacReviewBody) =>
      api.post(`/phd/proposal/dacMember/submitReview/${proposalId}`, data),
    onSuccess: () => {
      toast.success("Review submitted successfully!");
      void queryClient.invalidateQueries({ queryKey: ["dac-proposals"] });
      void queryClient.invalidateQueries({ queryKey: ["todos"] });
      navigate("/phd/dac/proposals");
    },
    onError: () => {
      toast.error("Failed to submit review.");
    },
  });

  const handleSubmitReview = () => {
    if (!reviewStatus) {
      toast.error("Please select Approve or Reject.");
      return;
    }
    if (!comments.trim()) {
      toast.error("Comments are required.");
      return;
    }
    submitReviewMutation.mutate({
      approved: reviewStatus === "approve",
      comments,
    });
  };

  if (isLoading)
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  if (isError || !proposal)
    return (
      <Card>
        <CardContent>
          <p className="p-4 text-red-500">Could not load proposal details.</p>
        </CardContent>
      </Card>
    );

  const alreadyReviewed = !!proposal.currentUserReview;

  return (
    <div className="space-y-6">
      <BackButton />
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{proposal.title}</CardTitle>
              <CardDescription>
                Status:{" "}
                <Badge variant="outline">
                  {proposal.status.replace("_", " ").toUpperCase()}
                </Badge>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Button variant="outline" asChild>
              <a
                href={proposal.abstractFileUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download className="mr-2 h-4 w-4" /> Abstract
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a
                href={proposal.proposalFileUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download className="mr-2 h-4 w-4" /> Full Proposal
              </a>
            </Button>
          </div>
          <div>
            <h3 className="font-semibold">Supervisor</h3>
            <p>
              {proposal.supervisor.name} ({proposal.supervisor.email})
            </p>
          </div>
          <div>
            <h3 className="font-semibold">DAC Members</h3>
            <ul className="list-inside list-disc">
              {proposal.dacMembers.map((m) => (
                <li key={m.dacMember.email}>
                  {m.dacMember.name} ({m.dacMember.email})
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
      {alreadyReviewed ? (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" /> You Have
              Reviewed This Proposal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Your Decision:{" "}
              <span
                className={`font-semibold ${
                  proposal.currentUserReview?.approved
                    ? "text-green-700"
                    : "text-red-700"
                }`}
              >
                {proposal.currentUserReview?.approved ? "Approved" : "Rejected"}
              </span>
            </p>
            <p className="mt-2">
              <strong>Your Comments:</strong>
            </p>
            <p className="text-muted-foreground">
              {proposal.currentUserReview?.comments}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Your Evaluation</CardTitle>
            <CardDescription>
              Please provide your feedback on this proposal. Your comments are
              required.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              onValueChange={(val: "approve" | "reject") =>
                setReviewStatus(val)
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="approve" id="approve" />
                <Label htmlFor="approve" className="flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4 text-green-500" /> Approve
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="reject" id="reject" />
                <Label htmlFor="reject" className="flex items-center gap-2">
                  <ThumbsDown className="h-4 w-4 text-red-500" /> Reject
                </Label>
              </div>
            </RadioGroup>
            <div>
              <Label htmlFor="comments">Comments *</Label>
              <Textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Provide detailed feedback..."
                rows={6}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleSubmitReview}
              disabled={submitReviewMutation.isLoading}
            >
              {submitReviewMutation.isLoading && (
                <LoadingSpinner className="mr-2 h-4 w-4" />
              )}
              Submit Review
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default DacViewProposal;