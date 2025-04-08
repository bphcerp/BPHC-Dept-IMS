import api from "@/lib/axios-instance";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useParams } from "react-router-dom";
import { conferenceSchemas } from "lib";
import { cn } from "@/lib/utils";
import { File, MessageSquareMore } from "lucide-react";
import { ProgressStatus } from "@/components/conference/StateProgressBar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import useReviewFieldMutation from "@/hooks/Conference/use-review-field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import BackButton from "@/components/BackButton";
import { useAuth } from "@/hooks/Auth";
import ReviewApplicationDialog from "@/components/conference/ReviewApplicationDialog";

interface FieldProps {
  applId: number;
  fieldId: number;
  fieldType: string;
  label: string;
  value?: string | number;
  file?: {
    originalName: string;
    filePath: string;
  };
  status?: {
    status: boolean;
    comments?: string;
    timestamp: string;
  }[];
  canReview?: boolean;
  canOverwrite?: boolean;
}

const FieldDisplay = ({
  applId,
  fieldId,
  fieldType,
  label,
  value,
  file,
  status,
  canReview = false,
  canOverwrite = false,
}: FieldProps) => {
  const latestStatus = status?.length ? status[0] : null;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [comments, setComments] = useState<string>("");
  const [reviewAction, setReviewAction] = useState<boolean>(true);
  const reviewFieldMutation = useReviewFieldMutation();

  return (
    <div className="flex justify-evenly rounded-lg border p-4 shadow-sm">
      <div className="flex min-w-28 flex-1 flex-col gap-2">
        <strong className="text-base font-semibold uppercase text-muted-foreground">
          {label}
        </strong>
        <div
          className={cn(
            "relative flex gap-2 overflow-clip overflow-ellipsis rounded-md border bg-gray-100 p-2",
            file ? "cursor-pointer pl-10 hover:bg-muted/50" : undefined
          )}
          onClick={() => {
            if (file) {
              window.open(file.filePath, "_blank");
            }
          }}
        >
          {file && <File className="absolute left-2" />}
          {(value && label === "date"
            ? new Date(value).toLocaleDateString()
            : value) || (file ? file.originalName : "N/A")}
        </div>
      </div>
      <div className="mt-2 flex w-44 flex-col items-center justify-center gap-2 pl-5">
        {latestStatus ? (
          <div className="flex flex-col text-sm">
            <div className="flex items-center gap-1">
              <strong>Status:</strong>{" "}
              {latestStatus.status ? (
                <span className="text-success">Accepted</span>
              ) : (
                <span className="text-destructive">Rejected</span>
              )}
              {latestStatus.comments && (
                <Popover>
                  <PopoverTrigger>
                    <MessageSquareMore className="w-5" />
                  </PopoverTrigger>
                  <PopoverContent>
                    <p className="py-1 text-center text-sm font-semibold text-muted-foreground">
                      COMMENTS
                    </p>
                    {latestStatus.comments}
                  </PopoverContent>
                </Popover>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {new Date(latestStatus.timestamp).toLocaleString()}
            </span>
          </div>
        ) : (
          <div className="text-sm">
            <strong>Status:</strong>{" "}
            <span className="text-secondary">Pending Review</span>
          </div>
        )}

        {canReview ? (
          <div className="flex gap-2">
            {latestStatus && canOverwrite ? (
              latestStatus.status ? (
                <Button
                  variant="destructive"
                  onClick={() => {
                    setDialogOpen(true);
                    setReviewAction(false);
                  }}
                >
                  Overwrite to Reject
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    setDialogOpen(true);
                    setReviewAction(true);
                  }}
                >
                  Overwrite to Accept
                </Button>
              )
            ) : !latestStatus ? (
              <>
                <Button
                  onClick={() => {
                    setDialogOpen(true);
                    setReviewAction(true);
                  }}
                >
                  Accept
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setDialogOpen(true);
                    setReviewAction(false);
                  }}
                >
                  Reject
                </Button>
              </>
            ) : null}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                }}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {reviewAction ? "Accept" : "Reject"} Field
                    </DialogTitle>
                    <DialogDescription>
                      Are you sure you want to{" "}
                      {reviewAction ? "accept" : "reject"} this field?
                    </DialogDescription>
                  </DialogHeader>

                  <Textarea
                    name="comments"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder={
                      "Add comments " +
                      (reviewAction ? "(optional)" : "(required)")
                    }
                  />

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      onClick={() => {
                        reviewFieldMutation.mutate(
                          {
                            applId,
                            fieldId,
                            fieldType,
                            status: reviewAction,
                            comments: comments.length ? comments : undefined,
                          },
                          {
                            onSuccess: () => {
                              setDialogOpen(false);
                            },
                          }
                        );
                      }}
                    >
                      {reviewAction ? "Accept" : "Reject"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </form>
            </Dialog>
          </div>
        ) : null}
      </div>
    </div>
  );
};

const ConferenceViewApplicationView = () => {
  const { id } = useParams<{ id: string }>();
  const { checkAccess } = useAuth();
  const canReviewAsHod = checkAccess(
    "conference:application:review-application-hod"
  );
  const canReviewAsConvener = checkAccess(
    "conference:application:review-application-convener"
  );
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewDialogStatus, setReviewDialogStatus] = useState(false);

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

  return (
    <div className="relative flex min-h-screen w-full flex-col gap-6 bg-gray-50 p-8">
      <BackButton />
      {isLoading && <p>Loading...</p>}
      {isError && <p>Error loading application</p>}
      {data && (
        <>
          <h2
            className="self-start text-3xl"
            onClick={() => console.log(data.conferenceApplication)}
          >
            Application No. {data.id}
          </h2>
          <div className="flex flex-col gap-4">
            <ProgressStatus
              currentStage={data.conferenceApplication.state}
              currentStatus={data.status}
            />
            {Object.entries(data.conferenceApplication).map(([key, value]) =>
              value && typeof value === "object" ? (
                <FieldDisplay
                  key={key}
                  applId={data.id}
                  fieldId={value.id}
                  fieldType={
                    conferenceSchemas.textFieldNames.includes(
                      key as (typeof conferenceSchemas.textFieldNames)[number]
                    )
                      ? "text"
                      : conferenceSchemas.fileFieldNames.includes(
                            key as (typeof conferenceSchemas.fileFieldNames)[number]
                          )
                        ? "file"
                        : conferenceSchemas.dateFieldNames.includes(
                              key as (typeof conferenceSchemas.dateFieldNames)[number]
                            )
                          ? "date"
                          : "number"
                  }
                  label={key.replace(/([A-Z])/g, " $1")}
                  value={"value" in value ? value.value : undefined}
                  file={"file" in value ? value.file : undefined}
                  status={"statuses" in value ? value.statuses : []}
                  canOverwrite={checkAccess(
                    "conference:application:overwrite-field-review"
                  )}
                  canReview={
                    checkAccess("conference:application:review-fields") &&
                    data.status === "pending"
                  }
                />
              ) : null
            )}
            {data.status === "pending" &&
            (canReviewAsHod ||
              (conferenceSchemas.states.indexOf(
                data.conferenceApplication.state
              ) < 2 &&
                canReviewAsConvener)) ? (
              <div className="flex gap-4">
                <ReviewApplicationDialog
                  applId={data.id}
                  status={reviewDialogStatus}
                  dialogOpen={reviewDialogOpen}
                  setDialogOpen={setReviewDialogOpen}
                />
                <Button
                  onClick={() => {
                    setReviewDialogStatus(true);
                    setReviewDialogOpen(true);
                  }}
                >
                  {canReviewAsHod
                    ? "Accept application"
                    : "Approve and send to HoD"}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setReviewDialogStatus(false);
                    setReviewDialogOpen(true);
                  }}
                >
                  Reject application
                </Button>
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
};

export default ConferenceViewApplicationView;
