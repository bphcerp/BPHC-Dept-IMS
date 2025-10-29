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
import { useMemo, useState, useCallback } from "react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { isAxiosError } from "axios";

const MemberReview = ({ id }: { id?: string }) => {
  const [action, setAction] = useState<boolean | null>(null);
  const [comments, setComments] = useState("");
  const navigate = useNavigate();

  const reviewMemberMutation = useMutation({
    mutationFn: async (data: conferenceSchemas.ReviewApplicationBody) => {
      return await api.post(
        `/conference/applications/reviewMember/${id}`,
        data
      );
    },
    onSuccess: () => {
      toast.success("Review submitted successfully");
      navigate("/conference/pending");
    },
  });

  const handleActionChange = useCallback((value: string) => {
    setAction(value === "accept" ? true : value === "reject" ? false : null);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <span className="text-primary">Choose an action:</span>
      <ToggleGroup
        type="single"
        value={
          action === true ? "accept" : action === false ? "reject" : undefined
        }
        onValueChange={handleActionChange}
        className="flex gap-4 bg-transparent"
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
      <Textarea
        placeholder={action ? "Add comments... (optional)" : "Add comments..."}
        value={comments}
        onChange={(e) => setComments(e.target.value)}
      />
      <Button
        onClick={() =>
          reviewMemberMutation.mutate({
            status: action!,
            comments,
          })
        }
        disabled={action === null || (action === false && !comments.trim())}
      >
        Send to Convener
      </Button>
    </div>
  );
};

const ConvenerReview = ({
  isDirect,
  reviews,
  id,
  onGenerateForm,
  isGeneratingForm,
}: {
  isDirect?: boolean;
  reviews: conferenceSchemas.ViewApplicationResponse["reviews"];
  id?: string;
  onGenerateForm: () => void;
  isGeneratingForm: boolean;
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
        queryKey: ["conference", "applications", parseInt(id!)],
      });

      if (variables.status && isDirect) {
        onGenerateForm();
      }
    },
  });

  return (
    <div className="flex flex-col items-start gap-4">
      <div>
        <h3 className="pb-4 text-lg font-semibold">
          {isDirect ? "Current flow: DIRECT" : "Member Reviews"}
        </h3>
        <ol className="list-decimal pl-5">
          {reviews.map((review, index) => (
            <li key={index} className="pl-2 text-sm">
              <p>
                <strong>Status:</strong>{" "}
                {review.status ? "Accepted" : "Revision Requested"}
              </p>
              <p>
                <strong>Comments:</strong> {review.comments || "No comments"}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(review.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ol>
      </div>
      <Button
        onClick={() =>
          reviewConvenerMutation.mutate({
            status: true,
          })
        }
        disabled={reviewConvenerMutation.isLoading || isGeneratingForm}
      >
        {isDirect ? "Accept" : "Send to HoD"}
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive">Push Back to Faculty</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Provide Comments</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Add comments..."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
          />
          <DialogFooter>
            <Button
              onClick={() => {
                reviewConvenerMutation.mutate({
                  status: false,
                  comments,
                });
                setIsDialogOpen(false);
              }}
              disabled={!comments.trim()}
            >
              Push back to Faculty
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const HodReview = ({
  id,
  onGenerateForm,
  isGeneratingForm,
}: {
  id?: string;
  onGenerateForm: () => void;
  isGeneratingForm: boolean;
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
        queryKey: ["conference", "applications", parseInt(id!)],
      });

      if (variables.status) {
        onGenerateForm();
      }
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <Button
        onClick={() =>
          reviewHodMutation.mutate({
            status: true,
          })
        }
        disabled={reviewHodMutation.isLoading || isGeneratingForm}
      >
        Accept
      </Button>
      <Button variant="destructive" onClick={() => setIsDialogOpen(true)}>
        Push Back to Faculty
      </Button>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Provide Comments</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Add comments..."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
          />
          <DialogFooter>
            <Button
              onClick={() => {
                reviewHodMutation.mutate({
                  status: false,
                  comments,
                });
                setIsDialogOpen(false);
              }}
              disabled={!comments.trim()}
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

  const handleGenerateForm = () => {
    generateFormMutation.mutate();
  };

  return (
    <div className="relative flex min-h-screen w-full max-w-4xl flex-col gap-6 p-8">
      <BackButton />
      {isLoading && <p>Loading...</p>}
      {isError && <p>Error loading application</p>}
      {data && (
        <>
          <h2 className="self-start text-3xl">
            Application No. {data.application.id}
          </h2>
          <ViewApplication data={data} />
          <Separator />
          {canReviewAsMember && data.application.state === "DRC Member" && (
            <MemberReview id={id} />
          )}
          {canReviewAsConvener && data.application.state === "DRC Convener" && (
            <ConvenerReview
              id={id}
              isDirect={isDirect}
              reviews={data.reviews}
              onGenerateForm={handleGenerateForm}
              isGeneratingForm={generateFormMutation.isLoading}
            />
          )}
          {canReviewAsHod && data.application.state === "HoD" && (
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
