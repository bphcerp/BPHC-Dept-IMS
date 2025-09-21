import React, { useState, useEffect } from "react";
import { phdSchemas } from "lib";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight, CornerDownLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";

type Role = "student" | "supervisor" | "drc" | "dac";

interface ProposalStatusTimelineProps {
  role: Role;
}

const statusFlow: Array<{
  status: (typeof phdSchemas.phdProposalStatuses)[number] | "revert_status";
  title: string;
  description: string; // Generic description for everyone
  roleSpecificDescription?: Partial<Record<Role, string>>; // Specific notes for each role
}> = [
  {
    status: "supervisor_review",
    title: "Supervisor Review",
    description:
      "The proposal is with the supervisor for initial review and to suggest a Doctoral Advisory Committee (DAC).",
    roleSpecificDescription: {
      student:
        "Your proposal has been submitted. You will be notified once your supervisor reviews it.",
      supervisor:
        "Please review the student's proposal. If you approve, suggest 2-4 DAC members to forward it to the DRC.",
      drc: "A student has submitted a proposal and it is currently under supervisor review.",
      dac: "A student has submitted a proposal and it is currently under supervisor review.",
    },
  },
  {
    status: "drc_review",
    title: "DRC Review",
    description:
      "The proposal is with the DRC Convener to finalize the DAC members from the supervisor's suggestions.",
    roleSpecificDescription: {
      student:
        "Your supervisor has approved the proposal. It is now with the DRC for committee finalization.",
      supervisor:
        "Your review is complete. The proposal is now with the DRC to finalize the DAC.",
      drc: "Please review the suggested DAC members and select exactly two to form the final committee.",
      dac: "A proposal is currently with the DRC for DAC finalization.",
    },
  },
  {
    status: "dac_review",
    title: "DAC Review",
    description:
      "The proposal is now under review by the finalized DAC members.",
    roleSpecificDescription: {
      student:
        "Your DAC has been formed and is now reviewing your proposal. You will be notified of their decision.",
      supervisor:
        "The DAC has been finalized and is now reviewing the proposal.",
      drc: "The proposal has been sent to the selected DAC members for their review and evaluation.",
      dac: "You have been assigned to review this proposal. Please submit your evaluation before the deadline.",
    },
  },
  {
    status: "dac_accepted",
    title: "DAC Accepted",
    description:
      "The DAC has approved the proposal. The next step is to schedule the proposal seminar.",
    roleSpecificDescription: {
      student:
        "Congratulations! Your DAC has approved the proposal. Your seminar will be scheduled shortly.",
      supervisor:
        "The DAC has approved the proposal. Please provide the seminar details (date, time, venue) when requested by the DRC.",
      drc: "The proposal has been approved by the DAC. You can now request seminar details from the supervisor.",
      dac: "You have completed your review and the proposal was approved.",
    },
  },
  {
    status: "seminar_pending",
    title: "Seminar Pending",
    description:
      "The supervisor or DRC needs to schedule the proposal seminar.",
    roleSpecificDescription: {
      student:
        "Your seminar is waiting to be scheduled by your supervisor or the DRC.",
      supervisor:
        "Please submit the seminar details for the student's presentation.",
      drc: "Awaiting seminar details from the supervisor. You may send a reminder if needed.",
      dac: "The seminar is pending scheduling.",
    },
  },
  {
    status: "finalising_documents",
    title: "Finalising Documents",
    description:
      "Seminar details are set. The DRC is preparing the final documents and seminar notice.",
    roleSpecificDescription: {
      student:
        "Your seminar details have been submitted. Final documents are being prepared.",
      supervisor:
        "You have submitted the seminar details. The DRC is handling the final documentation.",
      drc: "Please download the required forms and generate the seminar notice for circulation.",
      dac: "The seminar has been scheduled and documents are being finalized.",
    },
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

const ProposalStatusTimeline: React.FC<ProposalStatusTimelineProps> = ({
  role,
}) => {
  const [modalData, setModalData] = useState<
    (typeof statusFlow)[number] | null
  >(null);
  const [itemsPerRow, setItemsPerRow] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setItemsPerRow(1);
      } else if (width < 1024) {
        setItemsPerRow(2);
      } else {
        setItemsPerRow(3);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const statusRows = [];
  if (itemsPerRow > 0) {
    for (let i = 0; i < statusFlow.length; i += itemsPerRow) {
      statusRows.push(statusFlow.slice(i, i + itemsPerRow));
    }
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
            return (
              <div key={rowIndex}>
                <div
                  className={cn(
                    "flex items-center gap-4",
                    isReversed && "flex-row-reverse"
                  )}
                >
                  {row.map((step, stepIndex) => (
                    <React.Fragment key={step.status}>
                      <div className="flex-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => setModalData(step)}
                        >
                          {step.title}
                        </Button>
                      </div>
                      {stepIndex < row.length - 1 && (
                        <ArrowRight
                          className={cn(
                            "h-5 w-5 flex-shrink-0 text-muted-foreground",
                            isReversed && "rotate-180"
                          )}
                        />
                      )}
                    </React.Fragment>
                  ))}
                  {row.length < itemsPerRow &&
                    Array.from({ length: itemsPerRow - row.length }).map(
                      (_, i) => (
                        <React.Fragment key={`placeholder-${i}`}>
                          <div className="flex-1" />
                          <div className="h-5 w-5 flex-shrink-0" />
                        </React.Fragment>
                      )
                    )}
                </div>
                {rowIndex < statusRows.length - 1 && (
                  <div
                    className={cn(
                      "flex",
                      isReversed ? "justify-start" : "justify-end"
                    )}
                  >
                    <CornerDownLeft
                      className={cn(
                        "-mt-1 h-5 w-5 text-muted-foreground",
                        isReversed && "scale-x-[-1]"
                      )}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>

      <Dialog
        open={!!modalData}
        onOpenChange={(open) => !open && setModalData(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{modalData?.title}</DialogTitle>
            <DialogDescription>{modalData?.description}</DialogDescription>
          </DialogHeader>
          {modalData?.roleSpecificDescription?.[role] && (
            <>
              <Separator />
              <div className="space-y-2 rounded-lg border bg-blue-50/50 p-3 dark:bg-blue-900/20">
                <h4 className="font-semibold text-blue-800 dark:text-blue-300">
                  For Your Attention ({role})
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  {modalData.roleSpecificDescription[role]}
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ProposalStatusTimeline;
