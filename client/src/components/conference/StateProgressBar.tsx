import { conferenceSchemas } from "lib";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

export const ProgressStatus = ({
  currentStage,
  currentStatus,
  approvalForm,
  membersAssigned,
}: {
  currentStage: (typeof conferenceSchemas.states)[number];
  currentStatus: "pending" | "accepted";
  approvalForm?: string;
  membersAssigned?: boolean;
}) => {
  // Create modified states array based on whether we need to show extra DRC Convener
  const states = [...conferenceSchemas.states];
  let currentStep = states.indexOf(currentStage);

  // If current stage is DRC Member but members not assigned, insert extra DRC Convener
  if (currentStage === "DRC Member" && membersAssigned === false) {
    const drcMemberIndex = states.indexOf("DRC Member");
    // Insert "DRC Convener" before "DRC Member"
    states.splice(drcMemberIndex, 0, "DRC Convener");
    // Current step is now at the inserted DRC Convener position
    currentStep = drcMemberIndex;
  }

  const progressValue = (currentStep / (states.length - 1)) * 100;
  const isCompleted =
    currentStatus === "accepted" && currentStep === states.length - 1;

  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-white p-4 shadow-md">
      <div className="flex gap-2">
        <strong className="text-lg font-medium">Application Status</strong>
        <Badge variant={currentStatus === "pending" ? "secondary" : "default"}>
          {currentStatus === "pending" ? "In progress" : "Accepted"}
        </Badge>
        {isCompleted && approvalForm && (
          <a
            href={approvalForm}
            className="flex flex-1 items-center justify-end gap-1 text-sm text-green-600"
          >
            <CheckCircle2 className="h-5 w-5 pb-1" />
            Form Generated
          </a>
        )}
        {isCompleted && !approvalForm && (
          <div className="flex flex-1 items-center justify-end gap-1 text-sm text-orange-600">
            <CheckCircle2 className="h-5 w-5 pb-1" />
            Pending Form
          </div>
        )}
      </div>
      <Progress value={progressValue} className="h-3" />
      <div className="flex justify-between text-sm text-gray-500">
        {states.map((stage, index) => (
          <span
            key={`${stage}-${index}`}
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
