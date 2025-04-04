import api from "@/lib/axios-instance";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useParams } from "react-router-dom";
import { conferenceSchemas } from "lib";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { File } from "lucide-react";

interface FieldProps {
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
  showActionButtons?: boolean;
}

const statusStages = [
  "Filled",
  "DRC Member",
  "DRC Convener",
  "HOD",
  "Completed",
];

const FieldDisplay = ({
  label,
  value,
  file,
  status,
  showActionButtons = false,
}: FieldProps) => {
  const [action, setAction] = useState<string | null>(null);
  const hasStatus = status && status.length > 0;

  return (
    <div className="flex gap-4 rounded-lg border p-4 shadow-sm">
      <div className="flex flex-1 flex-col gap-2">
        <strong className="text-base font-semibold uppercase text-muted-foreground">
          {label}
        </strong>
        <div
          className={cn(
            "flex gap-2 rounded-md border bg-gray-100 p-2",
            file ? "cursor-pointer hover:brightness-110" : undefined
          )}
          onClick={() => {
            if (file) {
              window.open(file.filePath, "_blank");
            }
          }}
        >
          {file && <File />}
          {(value && label === "date"
            ? new Date(value).toLocaleDateString()
            : value) || (file ? file.originalName : "N/A")}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-4">
        {(value || file) && showActionButtons ? (
          hasStatus ? (
            action ? (
              <>
                <Button onClick={() => setAction("accepted")}>Accept</Button>
                <Button
                  variant="destructive"
                  onClick={() => setAction("rejected")}
                >
                  Reject
                </Button>
              </>
            ) : (
              <Button onClick={() => setAction("overwrite")}>Overwrite</Button>
            )
          ) : (
            <>
              <Button onClick={() => setAction("accepted")}>Accept</Button>
              <Button
                variant="destructive"
                onClick={() => setAction("rejected")}
              >
                Reject
              </Button>
            </>
          )
        ) : null}
      </div>
    </div>
  );
};

const ProgressStatus = ({ currentStep }: { currentStep: number }) => {
  const progressValue = (currentStep / (statusStages.length - 1)) * 100;

  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-white p-4 shadow-md">
      <strong className="text-lg font-medium">Application Status</strong>
      <Progress value={progressValue} className="h-3" />
      <div className="flex justify-between text-sm text-gray-500">
        {statusStages.map((stage, index) => (
          <span key={index} className={index <= currentStep ? "font-bold" : ""}>
            {stage}
          </span>
        ))}
      </div>
    </div>
  );
};

const ConferenceSubmittedApplicationView = () => {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["conference", "submittedApplications", id],
    queryFn: async () => {
      if (!id) throw new Error("No application ID provided");
      return (
        await api.get<conferenceSchemas.ViewApplicationResponse>(
          `/conference/applications/view/${id}`
        )
      ).data;
    },
    enabled: !!id,
  });

  return (
    <div className="relative flex min-h-screen w-full flex-col gap-6 bg-gray-50 p-8">
      {isLoading && <p>Loading...</p>}
      {isError && <p>Error loading applications</p>}
      {data && (
        <>
          <h2 className="self-start text-3xl font-semibold">
            Application No. {data.id}
          </h2>
          <div className="flex flex-col gap-4">
            <ProgressStatus
              currentStep={statusStages.indexOf(
                data.conferenceApplication.state
              )}
            />
            {Object.entries(data.conferenceApplication).map(([key, value]) =>
              key !== "state" ? (
                <FieldDisplay
                  key={key}
                  label={key.replace(/([A-Z])/g, " $1")}
                  value={
                    value && typeof value === "object" && "value" in value
                      ? value.value
                      : undefined
                  }
                  file={
                    value && typeof value === "object" && "file" in value
                      ? value.file
                      : undefined
                  }
                  status={
                    value && typeof value === "object" && "status" in value
                      ? value.statuses
                      : []
                  }
                />
              ) : null
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ConferenceSubmittedApplicationView;
