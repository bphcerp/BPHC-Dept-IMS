import React, { useState } from "react";
import { phdSchemas } from "lib";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, CornerDownLeft } from "lucide-react";

// The complete status flow, including revert statuses for descriptive purposes
const statusFlow: Array<{
  status: (typeof phdSchemas.phdProposalStatuses)[number] | "revert_status";
  title: string;
  description: string;
}> = [
  {
    status: "supervisor_review",
    title: "Supervisor Review",
    description:
      "The student submits the proposal. It is now with the supervisor for initial review and to suggest a Doctoral Advisory Committee (DAC).",
  },
  {
    status: "drc_review",
    title: "DRC Review",
    description:
      "The supervisor approves the proposal and suggested DAC. It is now with the DRC Convener to finalize the DAC members.",
  },
  {
    status: "dac_review",
    title: "DAC Review",
    description:
      "The DRC has finalized the DAC. The proposal is now under review by the assigned DAC members.",
  },
  {
    status: "dac_accepted",
    title: "DAC Accepted",
    description:
      "The DAC has approved the proposal. The next step is to schedule the proposal seminar.",
  },
  {
    status: "seminar_pending",
    title: "Seminar Pending",
    description:
      "The system is waiting for the supervisor or DRC to schedule the proposal seminar after the DAC review deadline passes.",
  },
  {
    status: "finalising_documents",
    title: "Finalising Documents",
    description:
      "The seminar details have been set. The DRC is now preparing the final documents, including the seminar notice.",
  },
  {
    status: "completed",
    title: "Completed",
    description: "The proposal process is complete.",
  },
  {
    status: "revert_status",
    title: "Reverted Statuses",
    description:
      "If a proposal is reverted at any stage (by Supervisor, DRC, or DAC), it goes back to the student. The student must then make the required changes and resubmit the proposal, which restarts the process from the 'Supervisor Review' stage.",
  },
];

const ProposalStatusTimeline: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState<
    (typeof statusFlow)[number] | null
  >(statusFlow[0]);

  // Chunk the array for the S-shaped layout
  const itemsPerRow = 3;
  const statusRows = [];
  for (let i = 0; i < statusFlow.length; i += itemsPerRow) {
    statusRows.push(statusFlow.slice(i, i + itemsPerRow));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Proposal Status Flow</CardTitle>
        <CardDescription>
          This is the typical lifecycle of a PhD proposal. Click on a status to
          see its description.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {statusRows.map((row, rowIndex) => {
            const isReversed = rowIndex % 2 === 1;
            const finalRow = isReversed ? [...row].reverse() : row;
            return (
              <div key={rowIndex}>
                <div
                  className={cn(
                    "flex items-center gap-2",
                    isReversed && "justify-end"
                  )}
                >
                  {finalRow.map((step, stepIndex) => (
                    <React.Fragment key={step.status}>
                      <Button
                        variant={
                          selectedStatus?.status === step.status
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        className="flex-shrink-0"
                        onClick={() => setSelectedStatus(step)}
                      >
                        {step.title}
                      </Button>
                      {stepIndex < finalRow.length - 1 && (
                        <ArrowRight
                          className={cn(
                            "h-5 w-5 flex-shrink-0 text-muted-foreground",
                            isReversed && "rotate-180"
                          )}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </div>
                {rowIndex < statusRows.length - 1 && (
                  <div
                    className={cn(
                      "flex",
                      rowIndex % 2 === 1 ? "justify-start" : "justify-end"
                    )}
                  >
                    <CornerDownLeft
                      className={cn(
                        "-mt-1 h-5 w-5 text-muted-foreground",
                        rowIndex % 2 === 1 && "scale-x-[-1]"
                      )}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {selectedStatus && (
          <div className="mt-6 rounded-lg border bg-muted/50 p-4 transition-all">
            <h4 className="text-lg font-semibold">{selectedStatus.title}</h4>
            <p className="mt-1 text-muted-foreground">
              {selectedStatus.description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProposalStatusTimeline;
