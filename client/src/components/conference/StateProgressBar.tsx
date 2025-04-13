import { conferenceSchemas } from "lib";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export const ProgressStatus = ({
  currentStage,
  currentStatus,
}: {
  currentStage: (typeof conferenceSchemas.states)[number];
  currentStatus: "pending" | "accepted";
}) => {
  const currentStep = conferenceSchemas.states.indexOf(currentStage);
  const progressValue =
    (currentStep / (conferenceSchemas.states.length - 1)) * 100;
  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-white p-4 shadow-md">
      <div className="flex gap-2">
        <strong className="text-lg font-medium">Application Status</strong>
        <Badge variant={currentStatus === "pending" ? "secondary" : "default"}>
          {currentStatus === "pending" ? "In progress" : "Accepted"}
        </Badge>
      </div>
      <Progress value={progressValue} className="h-3" />
      <div className="flex justify-between text-sm text-gray-500">
        {conferenceSchemas.states.map((stage, index) => (
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
