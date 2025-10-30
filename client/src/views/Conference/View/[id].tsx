import api from "@/lib/axios-instance";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { conferenceSchemas } from "lib";
import BackButton from "@/components/BackButton";
import { useAuth } from "@/hooks/Auth";
import { ViewApplication } from "@/components/conference/ViewApplication";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Textarea } from "@/components/ui/textarea";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useMemo, useState, useCallback, FC } from "react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { AxiosError, isAxiosError } from "axios";

// Types for component props
interface ReviewComponentProps {
  id: string;
  onSuccess?: () => void;
}

interface ConvenerReviewProps extends ReviewComponentProps {
  isDirect?: boolean;
  reviews: conferenceSchemas.ViewApplicationResponse["reviews"];
  onGenerateForm: () => void;
  isGeneratingForm: boolean;
}

interface HodReviewProps extends ReviewComponentProps {
  onGenerateForm: () => void;
  isGeneratingForm: boolean;
}

// Member Review Component
const MemberReview: FC<ReviewComponentProps> = ({ id, onSuccess }) => {
  const [action, setAction] = useState<boolean | null>(null);
  const [comments, setComments] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const reviewMemberMutation = useMutation({
    mutationFn: async (data: conferenceSchemas.ReviewApplicationBody) => {
      return await api.post(
        `/conference/applications/reviewMember/${id}`,
        data
      );
    },
    onSuccess: () => {
      toast.success("Review submitted successfully");
      onSuccess?.();
      void queryClient.invalidateQueries({
        queryKey: ["conference"],
      });
      navigate("/conference/pending");
    },
    onError: (error) => {
      const errorMessage =
        isAxiosError(error) && typeof error.response?.data === "string"
          ? error.response.data
          : "Failed to submit review. Please try again.";
      toast.error(errorMessage);
    },
  });

  const handleActionChange = useCallback((value: string) => {
    setAction(value === "accept" ? true : value === "reject" ? false : null);
  }, []);

  const handleSubmit = useCallback(() => {
    if (action === null) return;
    reviewMemberMutation.mutate({
      status: action,
      comments,
    });
  }, [action, comments, reviewMemberMutation]);

  const isSubmitDisabled =
    action === null ||
    (action === false && !comments.trim()) ||
    reviewMemberMutation.isLoading;

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold">Member Review</h3>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-primary">
          Choose an action:
        </label>
        <ToggleGroup
          type="single"
          value={
            action === true ? "accept" : action === false ? "reject" : undefined
          }
          onValueChange={handleActionChange}
          className="flex justify-start gap-4 bg-transparent"
          disabled={reviewMemberMutation.isLoading}
        >
          <ToggleGroupItem
            value="accept"
            className={buttonVariants({ variant: "outline" })}
          >
            Accept
          </ToggleGroupItem>
          <ToggleGroupItem
            value="reject"
            className={buttonVariants({ variant: "outline" })}
          >
            Reject
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="member-comments" className="text-sm font-medium">
          Comments{" "}
          {action === false && <span className="text-destructive">*</span>}
        </label>
        <Textarea
          id="member-comments"
          placeholder={
            action === false
              ? "Comments are required for rejection"
              : "Add comments... (optional)"
          }
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          disabled={reviewMemberMutation.isLoading}
          className="min-h-[100px]"
        />
      </div>
      <Button
        onClick={handleSubmit}
        disabled={isSubmitDisabled}
        className="self-start"
      >
        {reviewMemberMutation.isLoading ? "Submitting..." : "Send to Convener"}
      </Button>
    </div>
  );
};

// Convener Review Component
const ConvenerReview: FC<ConvenerReviewProps> = ({
  isDirect,
  reviews,
  id,
  onGenerateForm,
  isGeneratingForm,
}) => {
  const [comments, setComments] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const reviewConvenerMutation = useMutation({
    mutationFn: async (data: conferenceSchemas.ReviewApplicationBody) => {
      return await api.post(
        `/conference/applications/reviewConvener/${id}`,
        data
      );
    },
    onSuccess: (_, variables) => {
      toast.success("Review submitted successfully");
      void queryClient.refetchQueries({
        queryKey: ["conference", "applications", parseInt(id)],
      });

      if (variables.status && isDirect) {
        onGenerateForm();
      }
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        toast.error(
          (error as AxiosError<string>)?.response?.data ||
            "Failed to submit review. Please try again."
        );
      } else {
        toast.error("An unexpected error occurred");
      }
    },
  });

  const handleAccept = useCallback(() => {
    reviewConvenerMutation.mutate({ status: true });
  }, [reviewConvenerMutation]);

  const handleReject = useCallback(() => {
    if (!comments.trim()) return;
    reviewConvenerMutation.mutate({
      status: false,
      comments,
    });
    setIsDialogOpen(false);
    setComments("");
  }, [comments, reviewConvenerMutation]);

  const validReviews = reviews.filter((review) => review.status !== null);
  const isProcessing = reviewConvenerMutation.isLoading || isGeneratingForm;

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold">
        Convener Review {isDirect && "(Direct Flow)"}
      </h3>

      {validReviews.length > 0 && (
        <div className="rounded-lg border p-4">
          <h4 className="mb-3 font-medium">Member Reviews</h4>
          <ol className="list-decimal space-y-3 pl-5">
            {validReviews.map((review, index) => (
              <li key={index} className="text-sm">
                <div className="space-y-1">
                  <p>
                    <strong>Status:</strong>{" "}
                    <span
                      className={
                        review.status ? "text-green-600" : "text-yellow-600"
                      }
                    >
                      {review.status ? "Accepted" : "Revision Requested"}
                    </span>
                  </p>
                  {review.comments && (
                    <p>
                      <strong>Comments:</strong> {review.comments}
                    </p>
                  )}
                  <p className="text-muted-foreground">
                    <strong>Date:</strong>{" "}
                    {new Date(review.createdAt).toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="flex gap-3">
        <Button onClick={handleAccept} disabled={isProcessing}>
          {isProcessing ? "Processing..." : isDirect ? "Accept" : "Send to HoD"}
        </Button>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" disabled={isProcessing}>
              Push Back to Faculty
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Provide Comments</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <label
                htmlFor="convener-comments"
                className="text-sm font-medium"
              >
                Comments <span className="text-destructive">*</span>
              </label>
              <Textarea
                id="convener-comments"
                placeholder="Enter reason for pushing back to faculty..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setComments("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={!comments.trim()}
              >
                Push Back to Faculty
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

// HoD Review Component
const HodReview: FC<HodReviewProps> = ({
  id,
  onGenerateForm,
  isGeneratingForm,
}) => {
  const [comments, setComments] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const reviewHodMutation = useMutation({
    mutationFn: async (data: conferenceSchemas.ReviewApplicationBody) => {
      return await api.post(`/conference/applications/reviewHod/${id}`, data);
    },
    onSuccess: (_, variables) => {
      toast.success("Review submitted successfully");
      void queryClient.refetchQueries({
        queryKey: ["conference", "applications", parseInt(id)],
      });

      if (variables.status) {
        onGenerateForm();
      }
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        toast.error(
          (error as AxiosError<string>)?.response?.data ||
            "Failed to submit review. Please try again."
        );
      } else {
        toast.error("An unexpected error occurred");
      }
    },
  });

  const handleAccept = useCallback(() => {
    reviewHodMutation.mutate({ status: true });
  }, [reviewHodMutation]);

  const handleReject = useCallback(() => {
    if (!comments.trim()) return;
    reviewHodMutation.mutate({
      status: false,
      comments,
    });
    setIsDialogOpen(false);
    setComments("");
  }, [comments, reviewHodMutation]);

  const isProcessing = reviewHodMutation.isLoading || isGeneratingForm;

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold">HoD Review</h3>

      <div className="flex gap-3">
        <Button onClick={handleAccept} disabled={isProcessing}>
          {isProcessing ? "Processing..." : "Accept"}
        </Button>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" disabled={isProcessing}>
              Push Back to Faculty
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Provide Comments</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <label htmlFor="hod-comments" className="text-sm font-medium">
                Comments <span className="text-destructive">*</span>
              </label>
              <Textarea
                id="hod-comments"
                placeholder="Enter reason for pushing back to faculty..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setComments("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={!comments.trim()}
              >
                Push Back to Faculty
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

const ConferenceViewApplicationView = () => {
  const { id } = useParams<{ id: string }>();
  const { checkAccess } = useAuth();
  const queryClient = useQueryClient();
  const canReviewAsMember = checkAccess("conference:application:member");
  const canReviewAsHod = checkAccess("conference:application:hod");
  const canReviewAsConvener = checkAccess("conference:application:convener");
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["conference", "applications", parseInt(id!)],
    queryFn: async () => {
      if (!id) throw new Error("No application ID provided");
      return (
        await api.get<conferenceSchemas.ViewApplicationResponse>(
          `/conference/applications/view/${id}`
        )
      ).data;
    },
    enabled: !!id,
    refetchOnWindowFocus: false,
  });

  const isDirect = useMemo(() => data?.isDirect, [data]);

  // Determine which review component to show based on state and permissions
  const shouldShowMemberReview = useMemo(() => {
    if (!data) return false;
    return (
      data.application.state === "DRC Member" &&
      data.pendingReviewAsMember === true &&
      canReviewAsMember
    );
  }, [data, canReviewAsMember]);

  const shouldShowConvenerReview = useMemo(() => {
    if (!data) return false;
    return data.application.state === "DRC Convener" && canReviewAsConvener;
  }, [data, canReviewAsConvener]);

  const shouldShowHodReview = useMemo(() => {
    if (!data) return false;
    return data.application.state === "HoD" && canReviewAsHod;
  }, [data, canReviewAsHod]);

  const generateFormMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error("No application ID provided");
      return await api.post(`/conference/applications/generateForm/${id}`);
    },
    onSuccess: () => {
      void queryClient.refetchQueries({
        queryKey: ["conference", "applications", parseInt(id!)],
      });
      toast.success("Approval form generated and mailed");
    },
    onError: (err) => {
      if (isAxiosError(err))
        toast.error("An error occurred while generating form");
    },
  });

  const handleGenerateForm = useCallback(() => {
    generateFormMutation.mutate();
  }, [generateFormMutation]);

  if (!id) {
    navigate("..");
    return null;
  }

  return (
    <div className="relative flex min-h-screen w-full max-w-4xl flex-col gap-6 p-8">
      <BackButton />
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Loading application...</p>
        </div>
      )}
      {isError && (
        <div className="flex items-center justify-center py-8">
          <p className="text-destructive">
            Error loading application. Please try again.
          </p>
        </div>
      )}
      {data && (
        <>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">
              Application No. {data.application.id}
            </h2>
            <p className="text-sm text-muted-foreground">
              Status:{" "}
              <span className="font-medium">{data.application.state}</span>
            </p>
          </div>
          <ViewApplication data={data} />
          <Separator />

          {/* Member Review - Show if user has pending review as member */}
          {shouldShowMemberReview && <MemberReview id={id} />}

          {/* Convener Review - Show if state is DRC Convener */}
          {shouldShowConvenerReview && (
            <ConvenerReview
              id={id}
              isDirect={isDirect}
              reviews={data.reviews}
              onGenerateForm={handleGenerateForm}
              isGeneratingForm={generateFormMutation.isLoading}
            />
          )}

          {/* HoD Review - Show if state is HoD */}
          {shouldShowHodReview && (
            <HodReview
              id={id}
              onGenerateForm={handleGenerateForm}
              isGeneratingForm={generateFormMutation.isLoading}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ConferenceViewApplicationView;
