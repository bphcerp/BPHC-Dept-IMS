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
import { useMemo, useState, useCallback, FC, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { AxiosError, isAxiosError } from "axios";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Users, Clock, User, FileText } from "lucide-react";

interface StatusLogEntry {
  applicationId: number;
  userEmail: string;
  action: string;
  timestamp: string;
  comments: string | null;
}

interface StatusLogProps {
  statusLog: StatusLogEntry[];
}

const StatusLog: FC<StatusLogProps> = ({ statusLog }) => {
  const getActionIcon = (action: string) => {
    if (action.toLowerCase().includes("reject")) {
      return <FileText className="h-4 w-4 text-red-500" />;
    }
    if (action.toLowerCase().includes("approve")) {
      return <FileText className="h-4 w-4 text-green-500" />;
    }
    return <FileText className="h-4 w-4 text-blue-500" />;
  };

  const getActionBadgeColor = (action: string) => {
    if (action.toLowerCase().includes("reject")) {
      return "bg-red-100 text-red-800 border-red-200";
    }
    if (action.toLowerCase().includes("approve")) {
      return "bg-green-100 text-green-800 border-green-200";
    }
    return "bg-blue-100 text-blue-800 border-blue-200";
  };

  const formatTimestamp = (timestamp: Date | string) => {
    const date =
      typeof timestamp === "string" ? new Date(timestamp) : timestamp;
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  };

  if (!statusLog || statusLog.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Application Status History
        </CardTitle>
        <CardDescription>
          Complete timeline of all actions taken on this application
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {statusLog.map((entry, index) => (
            <div
              key={`${entry.applicationId}-${entry.userEmail}-${entry.timestamp}`}
              className="relative flex gap-4 pb-4"
            >
              {/* Timeline line */}
              {index < statusLog.length - 1 && (
                <div className="absolute left-5 top-8 h-full w-px bg-border" />
              )}

              {/* Icon */}
              <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-muted/10">
                {getActionIcon(entry.action)}
              </div>

              {/* Content */}
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${getActionBadgeColor(entry.action)}`}
                  >
                    {entry.action}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    <User className="mr-1 inline-block h-3 w-3" />
                    {entry.userEmail}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatTimestamp(entry.timestamp)}
                </div>

                {entry.comments && (
                  <div className="rounded-md bg-muted/20 p-3 text-sm">
                    <p className="font-medium text-foreground">Comments:</p>
                    <p className="mt-1 text-muted-foreground">
                      {entry.comments}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

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
  const navigate = useNavigate();

  const reviewConvenerMutation = useMutation({
    mutationFn: async (data: conferenceSchemas.ReviewApplicationBody) => {
      return await api.post(
        `/conference/applications/reviewConvener/${id}`,
        data
      );
    },
    onSuccess: (_, variables) => {
      toast.success("Review submitted successfully");
      void queryClient.invalidateQueries({
        queryKey: ["conference", "applications", parseInt(id)],
      });

      if (variables.status && isDirect) {
        onGenerateForm();
      }
      navigate("/conference/pending");
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

// Assign Members Component (for Conveners in DRC Member state)
interface AssignMembersProps {
  id: string;
  onSuccess?: () => void;
}

const AssignMembers: FC<AssignMembersProps> = ({ id }) => {
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
    new Set()
  );
  const [initialMembers, setInitialMembers] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const { data: membersData, isLoading: isLoadingMembers } = useQuery({
    queryKey: ["conference", "members", parseInt(id)],
    queryFn: async () => {
      return (
        await api.get<conferenceSchemas.GetMembersResponse>(
          `/conference/applications/getMembers/${id}`
        )
      ).data;
    },
  });

  // Initialize selected members when data is loaded
  useEffect(() => {
    if (membersData?.members) {
      const memberSet = new Set(membersData.members);
      setSelectedMembers(memberSet);
      setInitialMembers(memberSet);
    }
  }, [membersData]);

  const setMembersMutation = useMutation({
    mutationFn: async (memberEmails: string[]) => {
      return await api.post(`/conference/applications/setMembers/${id}`, {
        memberEmails,
      });
    },
    onSuccess: () => {
      toast.success("Members assigned successfully");
      setInitialMembers(new Set(selectedMembers));
      void queryClient.invalidateQueries({
        queryKey: ["conference", "members", parseInt(id)],
      });
    },
    onError: (error) => {
      const errorMessage =
        isAxiosError(error) && typeof error.response?.data === "string"
          ? error.response.data
          : "Failed to assign members. Please try again.";
      toast.error(errorMessage);
    },
  });

  const handleToggleMember = useCallback((email: string) => {
    setSelectedMembers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(email)) {
        newSet.delete(email);
      } else {
        newSet.add(email);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedMembers.size === membersData?.allMembers.length) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(
        new Set(membersData?.allMembers.map((m) => m.email) || [])
      );
    }
  }, [selectedMembers.size, membersData?.allMembers]);

  const handleSubmit = useCallback(() => {
    if (selectedMembers.size === 0) {
      toast.error("Please select at least one member");
      return;
    }
    setMembersMutation.mutate(Array.from(selectedMembers));
  }, [selectedMembers, setMembersMutation]);

  const hasChanges = useMemo(() => {
    if (initialMembers.size !== selectedMembers.size) return true;
    return !Array.from(selectedMembers).every((email) =>
      initialMembers.has(email)
    );
  }, [initialMembers, selectedMembers]);

  const allSelected =
    membersData?.allMembers.length === selectedMembers.size &&
    selectedMembers.size > 0;

  if (isLoadingMembers) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assign Members
          </CardTitle>
          <CardDescription>Loading available members...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!membersData?.allMembers.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assign Members
          </CardTitle>
          <CardDescription className="text-destructive">
            No DRC members available for assignment
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Assign Members for Review
        </CardTitle>
        <CardDescription>
          Select DRC members who will review this application (
          {selectedMembers.size} selected)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Select All Checkbox */}
        <div className="flex items-center space-x-2 rounded-lg border bg-muted/50 p-3">
          <Checkbox
            id="select-all"
            checked={allSelected}
            onCheckedChange={handleSelectAll}
            disabled={setMembersMutation.isLoading}
          />
          <Label
            htmlFor="select-all"
            className="flex-1 cursor-pointer font-medium"
          >
            {allSelected ? "Deselect All" : "Select All"}
          </Label>
        </div>

        {/* Member List */}
        <div className="space-y-2 rounded-lg border p-4">
          <p className="mb-3 text-sm font-medium text-muted-foreground">
            Available Members
          </p>
          <div className="max-h-[300px] space-y-2 overflow-y-auto">
            {membersData.allMembers.map((member) => (
              <div
                key={member.email}
                className="flex items-center space-x-2 rounded-md p-2 transition-colors hover:bg-muted/50"
              >
                <Checkbox
                  id={member.email}
                  checked={selectedMembers.has(member.email)}
                  onCheckedChange={() => handleToggleMember(member.email)}
                  disabled={setMembersMutation.isLoading}
                />
                <Label
                  htmlFor={member.email}
                  className="flex flex-1 cursor-pointer flex-col"
                >
                  <span className="font-medium">
                    {member.name || "Unknown"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {member.email}
                  </span>
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            {hasChanges && (
              <span className="text-orange-600">Unsaved changes</span>
            )}
          </p>
          <Button
            onClick={handleSubmit}
            disabled={
              !hasChanges ||
              selectedMembers.size === 0 ||
              setMembersMutation.isLoading
            }
          >
            {setMembersMutation.isLoading ? "Assigning..." : "Assign Members"}
          </Button>
        </div>
      </CardContent>
    </Card>
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

  // Show member assignment for conveners when state is DRC Member
  const shouldShowMemberAssignment = useMemo(() => {
    if (!data) return false;
    return data.application.state === "DRC Member" && canReviewAsConvener;
  }, [data, canReviewAsConvener]);

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

          {/* Member Assignment - Show to conveners when state is DRC Member */}
          {shouldShowMemberAssignment && <AssignMembers id={id} />}

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

          {/* Status Log - Show for HoD when available */}
          {canReviewAsHod &&
            data.statusLog &&
            Array.isArray(data.statusLog) &&
            data.statusLog.length > 0 && (
              <>
                <Separator />
                <StatusLog statusLog={data.statusLog} />
              </>
            )}
        </>
      )}
    </div>
  );
};

export default ConferenceViewApplicationView;
