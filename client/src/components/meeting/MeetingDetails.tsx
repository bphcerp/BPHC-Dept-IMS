// client/src/components/meeting/MeetingDetails.tsx
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { meetingSchemas } from "lib";
import { z } from "zod";
import { LoadingSpinner } from "../ui/spinner";

type FinalizeFormData = z.infer<typeof meetingSchemas.finalizeMeetingSchema>;
type FormValues = Omit<FinalizeFormData, "meetingId" | "finalTimeSlotId">;

interface MeetingDetailsProps {
  meeting: any;
  onFinalize: (variables: Omit<FinalizeFormData, "meetingId">) => void;
  isFinalizing: boolean;
  isOrganizer: boolean;
}

export const MeetingDetails: React.FC<MeetingDetailsProps> = ({
  meeting,
  onFinalize,
  isFinalizing,
  isOrganizer,
}) => {
  const [finalizeSlot, setFinalizeSlot] = useState<any | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(
      meetingSchemas.finalizeMeetingObjectSchema.omit({
        meetingId: true,
        finalTimeSlotId: true,
      })
    ),
  });

  const handleFinalizeSubmit = (data: FormValues) => {
    if (finalizeSlot) {
      onFinalize({
        finalTimeSlotId: finalizeSlot.id,
        ...data,
      });
    }
  };

  const renderTooltipContent = (
    availabilityList: { participantEmail: string }[]
  ) => (
    <div>
      {availabilityList.length > 0 ? (
        availabilityList.map((avail) => (
          <p key={avail.participantEmail}>{avail.participantEmail}</p>
        ))
      ) : (
        <p>No one</p>
      )}
    </div>
  );

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Component content remains the same */}
        <Card>
          <CardHeader>
            <CardTitle>{meeting.title}</CardTitle>
            <CardDescription>{meeting.purpose}</CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              <strong>Organizer:</strong> {meeting.organizerEmail}
            </p>
            <p>
              <strong>Status:</strong> <Badge>{meeting.status}</Badge>
            </p>
            {meeting.finalizedTime && (
              <>
                <p className="mt-2">
                  <strong>Scheduled Time:</strong>{" "}
                  {new Date(meeting.finalizedTime).toLocaleString()}
                </p>
                {meeting.venue && (
                  <p>
                    <strong>Venue:</strong> {meeting.venue}
                  </p>
                )}
                {meeting.googleMeetLink && (
                  <p>
                    <strong>Meet Link:</strong>{" "}
                    <a
                      href={meeting.googleMeetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {meeting.googleMeetLink}
                    </a>
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Participants</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5">
              {meeting.participants.map((p: any) => (
                <li key={p.participantEmail}>{p.participantEmail}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Suggested Time Slots & Availability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {meeting.timeSlots.map((slot: any) => (
              <div key={slot.id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">
                    {new Date(slot.startTime).toLocaleString()}
                  </p>
                  <div className="flex items-center gap-4">
                    <Tooltip>
                      <TooltipTrigger className="flex cursor-default items-center gap-1">
                        <Check className="h-5 w-5 text-green-500" />
                        <span>{slot.availableCount}</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {renderTooltipContent(
                          slot.availability.filter(
                            (a: any) => a.availability === "available"
                          )
                        )}
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger className="flex cursor-default items-center gap-1">
                        <X className="h-5 w-5 text-red-500" />
                        <span>{slot.unavailableCount}</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {renderTooltipContent(
                          slot.availability.filter(
                            (a: any) => a.availability === "unavailable"
                          )
                        )}
                      </TooltipContent>
                    </Tooltip>
                    {isOrganizer &&
                      meeting.status === "awaiting_finalization" && (
                        <Button size="sm" onClick={() => setFinalizeSlot(slot)}>
                          Select this time
                        </Button>
                      )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!finalizeSlot} onOpenChange={() => setFinalizeSlot(null)}>
        <DialogContent>
          <form onSubmit={handleSubmit(handleFinalizeSubmit)}>
            <DialogHeader>
              <DialogTitle>Finalize Meeting</DialogTitle>
              <DialogDescription>
                Confirm location for{" "}
                {finalizeSlot
                  ? new Date(finalizeSlot.startTime).toLocaleString()
                  : ""}
                . Provide a venue, a Google Meet link, or both.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="venue" className="text-right">
                  Venue
                </Label>
                <Input
                  id="venue"
                  {...register("venue")}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="googleMeetLink" className="text-right">
                  Meet Link
                </Label>
                <Input
                  id="googleMeetLink"
                  {...register("googleMeetLink")}
                  placeholder="https://meet.google.com/..."
                  className="col-span-3"
                />
              </div>
              {errors.venue?.message && (
                <p className="col-span-4 text-center text-sm text-destructive">
                  {errors.venue.message}
                </p>
              )}
              {errors.googleMeetLink?.message && (
                <p className="col-span-4 text-center text-sm text-destructive">
                  {errors.googleMeetLink.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFinalizeSlot(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isFinalizing}>
                {isFinalizing && <LoadingSpinner className="mr-2 h-4 w-4" />}
                Confirm Meeting
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};
