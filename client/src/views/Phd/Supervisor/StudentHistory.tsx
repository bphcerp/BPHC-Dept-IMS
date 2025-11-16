import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { LoadingSpinner } from "@/components/ui/spinner";
import BackButton from "@/components/BackButton";
import { RequestDetailsCard } from "@/components/phd/phd-request/RequestDetailsCard";
import { RequestStatusStepper } from "@/components/phd/phd-request/RequestStatusStepper";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { phdRequestSchemas } from "lib";
import { Button } from "@/components/ui/button";
import { Edit, FileCheck2, ShieldAlert } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface PhdRequestDetails {
  id: number;
  requestType: string;
  status: (typeof phdRequestSchemas.phdRequestStatuses)[number];
  comments: string | null;
  createdAt: string;
  student: { name: string; email: string };
  supervisor: { name: string; email: string };
  canRequestEdit: boolean;
  documents: Array<{
    id: number;
    documentType: string;
    isPrivate: boolean;
    file: { originalName: string; id: number };
  }>;
  reviews: Array<{
    reviewer: { name: string; email: string };
    approved: boolean;
    comments: string | null;
    studentComments: string | null;
    supervisorComments: string | null;
    createdAt: string;
    status_at_review: string | null;
    reviewerDisplayName: string;
    reviewerRole: string;
  }>;
  drcAssignments: Array<{ drcMemberEmail: string; status: string }>;
}

const StudentHistory: React.FC = () => {
  const { studentEmail } = useParams<{ studentEmail: string }>();
  const [editRequestTarget, setEditRequestTarget] = useState<number | null>(
    null
  );
  const [editRequestComments, setEditRequestComments] = useState("");
  const queryClient = useQueryClient();

  const {
    data: requests = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<PhdRequestDetails[]>({
    queryKey: ["student-request-history", studentEmail],
    queryFn: async () => {
      const res = await api.get(`/phd-request/history/${studentEmail}`);
      return res.data;
    },
    enabled: !!studentEmail,
  });

  const requestEditMutation = useMutation({
    mutationFn: (data: { requestId: number; comments?: string }) =>
      api.post(`/phd-request/supervisor/request-edit/${data.requestId}`, {
        comments: data.comments,
      }),
    onSuccess: () => {
      toast.success("Edit request submitted to DRC Convener.");
      setEditRequestTarget(null);
      setEditRequestComments("");
      void refetch();
      void queryClient.invalidateQueries({
        queryKey: ["supervisor-my-students"],
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to submit request.");
    },
  });

  const handleConfirmEditRequest = () => {
    if (editRequestTarget) {
      requestEditMutation.mutate({
        requestId: editRequestTarget,
        comments: editRequestComments,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center text-destructive">
        Failed to load request history.
      </div>
    );
  }

  const revertableStatuses: (typeof phdRequestSchemas.phdRequestStatuses)[number][] =
    ["reverted_by_drc_convener", "reverted_by_drc_member", "reverted_by_hod"];

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="text-center">
        <h1 className="text-3xl font-bold">Student Request Status</h1>
        <p className="mt-2 text-gray-600">
          Showing all past and present requests for{" "}
          {requests[0]?.student.name || studentEmail}.
        </p>
      </div>
      {requests.length > 0 ? (
        <Accordion
          type="single"
          collapsible
          className="w-full"
          defaultValue="item-0"
        >
          {requests.map((request, index) => (
            <AccordionItem value={`item-${index}`} key={request.id}>
              <AccordionTrigger>
                <div className="flex w-full items-center justify-between pr-4">
                  <div className="text-left">
                    <p className="font-semibold">
                      {request.requestType
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Created on:{" "}
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge
                    variant={
                      request.status === "pending_edit_approval"
                        ? "destructive"
                        : "outline"
                    }
                  >
                    {request.status.replace(/_/g, " ").toUpperCase()}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 border-t pt-4">
                  <div className="flex justify-end gap-2">
                    {revertableStatuses.includes(request.status) && (
                      <Button variant="destructive" size="sm" asChild>
                        <Link to={`/phd/requests/${request.id}`}>
                          <Edit className="mr-2 h-4 w-4" /> Resubmit Request
                        </Link>
                      </Button>
                    )}
                    {request.status === "supervisor_review_final_thesis" && (
                      <Button variant="default" size="sm" asChild>
                        <Link to={`/phd/requests/${request.id}`}>
                          <FileCheck2 className="mr-2 h-4 w-4" /> Review Final
                          Thesis
                        </Link>
                      </Button>
                    )}
                    {request.canRequestEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditRequestTarget(request.id)}
                      >
                        <ShieldAlert className="mr-2 h-4 w-4" /> Request Edit
                      </Button>
                    )}
                  </div>
                  <RequestDetailsCard request={request} />
                  <RequestStatusStepper
                    reviews={request.reviews}
                    request={request}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <div className="p-8 text-center text-muted-foreground">
          No request history found for this student.
        </div>
      )}

      <AlertDialog
        open={!!editRequestTarget}
        onOpenChange={(open) => {
          if (!open) {
            setEditRequestTarget(null);
            setEditRequestComments("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request Edit Access?</AlertDialogTitle>
            <AlertDialogDescription>
              This will send a request to the DRC Convener. If approved, the
              submission will be reverted to an editable state.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="edit-comments">Comments (Optional)</Label>
            <Textarea
              id="edit-comments"
              placeholder="Provide a reason or comments for the DRC Convener..."
              value={editRequestComments}
              onChange={(e) => setEditRequestComments(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmEditRequest}
              disabled={requestEditMutation.isLoading}
            >
              {requestEditMutation.isLoading && (
                <LoadingSpinner className="mr-2 h-4 w-4" />
              )}
              Send Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StudentHistory;
