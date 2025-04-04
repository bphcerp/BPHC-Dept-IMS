import { conferenceSchemas } from "lib";
import { Progress } from "@/components/ui/progress";

const statusStages = ["Filled", ...conferenceSchemas.states] as const;

export const ProgressStatus = ({
  currentStage,
}: {
  currentStage: (typeof statusStages)[number];
}) => {
  const currentStep = statusStages.indexOf(currentStage);
  const progressValue = (currentStep / (statusStages.length - 1)) * 100;

  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-white p-4 shadow-md">
      <strong className="text-lg font-medium">Application Status</strong>
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
