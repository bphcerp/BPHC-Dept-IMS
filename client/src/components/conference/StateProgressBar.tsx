import { conferenceSchemas, formSchemas } from "lib";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const statusStages = ["Filled", ...conferenceSchemas.states] as const;

export const ProgressStatus = ({
  currentStage,
  currentStatus,
}: {
  currentStage: (typeof statusStages)[number];
  currentStatus: (typeof formSchemas.applicationStatuses)[number];
}) => {
  const currentStep = statusStages.indexOf(currentStage);
  const progressValue = (currentStep / (statusStages.length - 1)) * 100;

  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-white p-4 shadow-md">
      <div className="flex gap-2">
        <strong className="text-lg font-medium">Application Status</strong>
        <Badge
          variant={
            currentStatus === "pending"
              ? "secondary"
              : currentStatus === "rejected"
                ? "destructive"
                : "default"
          }
        >
          {currentStatus === "pending"
            ? "In progress"
            : currentStatus === "rejected"
              ? "Rejected"
              : "Accepted"}
        </Badge>
      </div>
      <Progress value={progressValue} className="h-3" />
      <div className="flex justify-between text-sm text-gray-500">
        {statusStages.map((stage, index) => (
          <span
            key={index}
            className={
              index === currentStep
                ? "font-bold text-foreground"
                : index < currentStep
                  ? "font-bold"
                  : ""
            }
          >
            {stage}
          </span>
        ))}
      </div>
    </div>
  );
};
