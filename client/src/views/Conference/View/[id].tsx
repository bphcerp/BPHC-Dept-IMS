import api from "@/lib/axios-instance";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useParams } from "react-router-dom";
import { conferenceSchemas } from "lib";
import { cn } from "@/lib/utils";
import { File } from "lucide-react";
import { ProgressStatus } from "@/components/conference/StateProgressBar";
import { useMemo, useState } from "react";
import BackButton from "@/components/BackButton";
import { useAuth } from "@/hooks/Auth";
import ReviewApplicationDialog from "@/components/conference/ReviewApplicationDialog";

interface FieldProps {
  label: string;
  value?: string | number;
  file?: {
    originalName: string;
    filePath: string;
  };
}

const FieldDisplay = ({ label, value, file }: FieldProps) => {
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
          {(value &&
          conferenceSchemas.dateFieldNames.includes(
            label as (typeof conferenceSchemas.dateFieldNames)[number]
          )
            ? new Date(value).toLocaleDateString()
            : value || (file ? file.originalName : "N/A")) ?? "N/A"}
        </div>
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

  const isPending = useMemo(
    () => (data ? conferenceSchemas.states.indexOf(data.state) < 4 : false),
    [data]
  );

  return (
    <div className="relative flex min-h-screen w-full flex-col gap-6 bg-gray-50 p-8">
      <BackButton />
      {isLoading && <p>Loading...</p>}
      {isError && <p>Error loading application</p>}
      {data && (
        <>
          <h2 className="self-start text-3xl">Application No. {data.id}</h2>
          <div className="flex flex-col gap-4">
            <ProgressStatus
              currentStage={data.state}
              currentStatus={isPending ? "pending" : "accepted"}
            />
            {[
              ...conferenceSchemas.textFieldNames,
              ...conferenceSchemas.dateFieldNames,
              ...conferenceSchemas.numberFieldNames,
              ...conferenceSchemas.fileFieldNames,
            ].map((k) =>
              data[k] ? (
                <FieldDisplay
                  key={k}
                  label={k.replace(/([A-Z])/g, " $1")}
                  value={typeof data[k] !== "object" ? data[k] : undefined}
                  file={
                    typeof data[k] === "object" && "file" in data[k]
                      ? data[k].file
                      : undefined
                  }
                />
              ) : null
            )}
            {isPending &&
            (canReviewAsHod ||
              (conferenceSchemas.states.indexOf(data.state) < 2 &&
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
