// client/src/components/meeting/MeetingDetails.tsx
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Users, X, Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { meetingSchemas } from "lib";
import { z } from "zod";
import { LoadingSpinner } from "../ui/spinner";

type FinalizeFormData = z.infer<typeof meetingSchemas.finalizeMeetingSchema>;
type UpdateDetailsFormData = z.infer<
  typeof meetingSchemas.updateMeetingDetailsSchema
>;

interface MeetingDetailsProps {
  meeting: any;
  onFinalize: (variables: Omit<FinalizeFormData, "meetingId">) => void;
  isFinalizing: boolean;
  onUpdateDetails: (variables: UpdateDetailsFormData) => void;
  isUpdating: boolean;
  isOrganizer: boolean;
}

const AvailabilityDialog = ({ slot }: { slot: any }) => {
  const available = slot.availability.filter(
    (a: any) => a.availability === "available"
  );
  const unavailable = slot.availability.filter(
    (a: any) => a.availability === "unavailable"
  );
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Availability Details</DialogTitle>
        <DialogDescription>
          {new Date(slot.startTime).toLocaleString()}
        </DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="mb-2 font-semibold">Available ({available.length})</h4>
          {available.length > 0 ? (
            <ul className="list-disc pl-5 text-sm">
              {available.map((a: any) => (
                <li key={a.participantEmail}>{a.participantEmail}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">None</p>
          )}
        </div>
        <div>
          <h4 className="mb-2 font-semibold">
            Unavailable ({unavailable.length})
          </h4>
          {unavailable.length > 0 ? (
            <ul className="list-disc pl-5 text-sm">
              {unavailable.map((a: any) => (
                <li key={a.participantEmail}>{a.participantEmail}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">None</p>
          )}
        </div>
      </div>
    </DialogContent>
  );
};

export const MeetingDetails: React.FC<MeetingDetailsProps> = ({
  meeting,
  onFinalize,
  isFinalizing,
  onUpdateDetails,
  isUpdating,
  isOrganizer,
}) => {
  const [finalizeSlot, setFinalizeSlot] = useState<any | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const {
    register: registerFinalize,
    handleSubmit: handleFinalize,
    formState: { errors: finalizeErrors },
  } = useForm<Omit<FinalizeFormData, "meetingId" | "finalTimeSlotId">>({
    resolver: zodResolver(
      meetingSchemas.finalizeMeetingObjectSchema.omit({
        meetingId: true,
        finalTimeSlotId: true,
      })
    ),
  });

  const {
    register: registerUpdate,
    handleSubmit: handleUpdate,
    formState: { errors: updateErrors },
    reset,
  } = useForm<UpdateDetailsFormData>({
    resolver: zodResolver(meetingSchemas.updateMeetingDetailsSchema),
    defaultValues: {
      venue: meeting.venue || "",
      googleMeetLink: meeting.googleMeetLink || "",
    },
  });

  useEffect(() => {
    reset({
      venue: meeting.venue || "",
      googleMeetLink: meeting.googleMeetLink || "",
    });
  }, [meeting, reset]);

  const onFinalizeSubmit = (
    data: Omit<FinalizeFormData, "meetingId" | "finalTimeSlotId">
  ) => {
    if (finalizeSlot) {
      onFinalize({ finalTimeSlotId: finalizeSlot.id, ...data });
    }
  };

  const onUpdateSubmit = (data: UpdateDetailsFormData) => {
    onUpdateDetails(data);
    setIsEditDialogOpen(false);
  };

  return (
    <div className="space-y-6">
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
              <div className="flex items-center gap-4">
                <div>
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
                </div>
                {isOrganizer && meeting.status === "scheduled" && (
                  <Dialog
                    open={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Edit className="mr-2 h-4 w-4" /> Edit Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <form onSubmit={handleUpdate(onUpdateSubmit)}>
                        <DialogHeader>
                          <DialogTitle>Update Meeting Details</DialogTitle>
                          <DialogDescription>
                            Edit the location for the meeting. Participants will
                            be notified of the changes.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label
                              htmlFor="venue-update"
                              className="text-right"
                            >
                              Venue
                            </Label>
                            <Input
                              id="venue-update"
                              {...registerUpdate("venue")}
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label
                              htmlFor="googleMeetLink-update"
                              className="text-right"
                            >
                              Meet Link
                            </Label>
                            <Input
                              id="googleMeetLink-update"
                              {...registerUpdate("googleMeetLink")}
                              placeholder="https://meet.google.com/..."
                              className="col-span-3"
                            />
                          </div>
                          {updateErrors.venue?.message && (
                            <p className="col-span-4 text-center text-sm text-destructive">
                              {updateErrors.venue.message}
                            </p>
                          )}
                          {updateErrors.googleMeetLink?.message && (
                            <p className="col-span-4 text-center text-sm text-destructive">
                              {updateErrors.googleMeetLink.message}
                            </p>
                          )}
                        </div>
                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsEditDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={isUpdating}>
                            {isUpdating && (
                              <LoadingSpinner className="mr-2 h-4 w-4" />
                            )}
                            Update Meeting
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
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
                  <div className="flex items-center gap-1 text-green-600">
                    <Check className="h-5 w-5" />
                    <span>{slot.availableCount}</span>
                  </div>
                  <div className="flex items-center gap-1 text-red-600">
                    <X className="h-5 w-5" />
                    <span>{slot.unavailableCount}</span>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Users className="mr-2 h-4 w-4" /> View Details
                      </Button>
                    </DialogTrigger>
                    <AvailabilityDialog slot={slot} />
                  </Dialog>
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
      {/* Finalize Dialog */}
      <Dialog open={!!finalizeSlot} onOpenChange={() => setFinalizeSlot(null)}>
        <DialogContent>
          <form onSubmit={handleFinalize(onFinalizeSubmit)}>
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
                <Label htmlFor="venue-finalize" className="text-right">
                  Venue
                </Label>
                <Input
                  id="venue-finalize"
                  {...registerFinalize("venue")}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="googleMeetLink-finalize" className="text-right">
                  Meet Link
                </Label>
                <Input
                  id="googleMeetLink-finalize"
                  {...registerFinalize("googleMeetLink")}
                  placeholder="https://meet.google.com/..."
                  className="col-span-3"
                />
              </div>
              {finalizeErrors.venue?.message && (
                <p className="col-span-4 text-center text-sm text-destructive">
                  {finalizeErrors.venue.message}
                </p>
              )}
              {finalizeErrors.googleMeetLink?.message && (
                <p className="col-span-4 text-center text-sm text-destructive">
                  {finalizeErrors.googleMeetLink.message}
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
    </div>
  );
};
