// client/src/components/meeting/MeetingDetails.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Users, X, Edit, PlusCircle } from "lucide-react";
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
import { Checkbox } from "../ui/checkbox";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { MultiSelectCombobox } from "../ui/multi-select-combobox";

type FinalizeFormData = z.infer<typeof meetingSchemas.finalizeMeetingSchema>;
type UpdateSlotFormData = z.infer<
  typeof meetingSchemas.updateMeetingSlotSchema
>;
type AddInviteesFormData = z.infer<typeof meetingSchemas.addInviteesSchema>;

interface MeetingDetailsProps {
  meeting: any;
  onFinalize: (variables: Omit<FinalizeFormData, "meetingId">) => void;
  isFinalizing: boolean;
  onUpdateSlot: (variables: {
    slotId: number;
    data: UpdateSlotFormData;
  }) => void;
  isUpdating: boolean;
  onAddInvitees: (variables: Omit<AddInviteesFormData, "meetingId">) => void;
  isAddingInvitees: boolean;
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
  onUpdateSlot,
  isUpdating,
  onAddInvitees,
  isAddingInvitees,
  isOrganizer,
}) => {
  const [selectedSlotsToFinalize, setSelectedSlotsToFinalize] = useState<
    number[]
  >([]);
  const [finalizeDetails, setFinalizeDetails] = useState<
    Record<number, { venue?: string; googleMeetLink?: string }>
  >({});
  const [isFinalizeDialogOpen, setIsFinalizeDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<any | null>(null);
  const [isAddInviteesOpen, setIsAddInviteesOpen] = useState(false);

  // Form for updating a single slot
  const {
    register: registerUpdate,
    handleSubmit: handleUpdateSubmit,
    reset: resetUpdateForm,
  } = useForm<UpdateSlotFormData>({
    resolver: zodResolver(meetingSchemas.updateMeetingSlotSchema),
  });

  // Form for adding new invitees
  const {
    control: addInviteesControl,
    handleSubmit: handleAddInviteesSubmit,
    reset: resetAddInviteesForm,
  } = useForm<Omit<AddInviteesFormData, "meetingId">>({
    resolver: zodResolver(
      meetingSchemas.addInviteesSchema.omit({ meetingId: true })
    ),
  });

  const { data: userList } = useQuery({
    queryKey: ["allUsersForMeeting", meeting.id],
    queryFn: () =>
      api
        .get(`/meeting/all-users?meetingId=${meeting.id}`)
        .then((res) => res.data),
    enabled: isOrganizer && isAddInviteesOpen,
  });
  const userListOptions = useMemo(
    () =>
      userList?.map((u: any) => ({
        value: u.email,
        label: `${u.name || u.email.split("@")[0]} (${u.email})`,
      })) || [],
    [userList]
  );

  useEffect(() => {
    if (editingSlot) {
      resetUpdateForm({
        venue: editingSlot.venue || "",
        googleMeetLink: editingSlot.googleMeetLink || "",
      });
    }
  }, [editingSlot, resetUpdateForm]);

  const handleToggleFinalizeSlot = (slotId: number) => {
    setSelectedSlotsToFinalize((prev) =>
      prev.includes(slotId)
        ? prev.filter((id) => id !== slotId)
        : [...prev, slotId]
    );
  };

  const handleFinalizeDetailsChange = (
    slotId: number,
    field: "venue" | "googleMeetLink",
    value: string
  ) => {
    setFinalizeDetails((prev) => ({
      ...prev,
      [slotId]: { ...prev[slotId], [field]: value },
    }));
  };

  const onFinalizeSubmit = () => {
    const finalSlots = selectedSlotsToFinalize.map((slotId) => ({
      timeSlotId: slotId,
      ...finalizeDetails[slotId],
    }));
    onFinalize({ finalSlots });
  };

  const onUpdateSlotSubmit = (data: UpdateSlotFormData) => {
    if (editingSlot) {
      onUpdateSlot({ slotId: editingSlot.id, data });
      setEditingSlot(null);
    }
  };

  const onAddInviteesSubmit = (
    data: Omit<AddInviteesFormData, "meetingId">
  ) => {
    onAddInvitees(data);
    resetAddInviteesForm({ participants: [] });
    setIsAddInviteesOpen(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{meeting.title}</CardTitle>
              <CardDescription>{meeting.purpose}</CardDescription>
            </div>
            {isOrganizer && meeting.status === "scheduled" && (
              <Dialog
                open={isAddInviteesOpen}
                onOpenChange={setIsAddInviteesOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Invitees
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleAddInviteesSubmit(onAddInviteesSubmit)}>
                    <DialogHeader>
                      <DialogTitle>Add More Invitees</DialogTitle>
                      <DialogDescription>
                        Select additional faculty or staff to invite. They will
                        be notified of the scheduled times.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <MultiSelectCombobox
                        control={addInviteesControl}
                        name="participants"
                        options={userListOptions}
                        placeholder="Select new invitees..."
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAddInviteesOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isAddingInvitees}>
                        {isAddingInvitees && (
                          <LoadingSpinner className="mr-2 h-4 w-4" />
                        )}
                        Add & Notify
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p>
            <strong>Organizer:</strong> {meeting.organizerEmail}
          </p>
          <p>
            <strong>Status:</strong> <Badge>{meeting.status}</Badge>
          </p>
          {meeting.status === "scheduled" &&
            meeting.finalizedSlots.length > 0 && (
              <div className="mt-4 space-y-3">
                <h4 className="font-semibold">Scheduled Time(s):</h4>
                {meeting.finalizedSlots.map((slot: any) => (
                  <div key={slot.id} className="rounded-md border p-3">
                    <p>
                      <strong>Time:</strong>{" "}
                      {new Date(slot.startTime).toLocaleString()}
                    </p>
                    {slot.venue && (
                      <p>
                        <strong>Venue:</strong> {slot.venue}
                      </p>
                    )}
                    {slot.googleMeetLink && (
                      <p>
                        <strong>Meet Link:</strong>{" "}
                        <a
                          href={slot.googleMeetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          {slot.googleMeetLink}
                        </a>
                      </p>
                    )}
                    {isOrganizer && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => setEditingSlot(slot)}
                      >
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Participants ({meeting.participants.length})</CardTitle>
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
                <div className="flex items-center gap-4">
                  {isOrganizer &&
                    meeting.status === "awaiting_finalization" && (
                      <Checkbox
                        id={`cb-${slot.id}`}
                        checked={selectedSlotsToFinalize.includes(slot.id)}
                        onCheckedChange={() =>
                          handleToggleFinalizeSlot(slot.id)
                        }
                      />
                    )}
                  <label htmlFor={`cb-${slot.id}`} className="font-semibold">
                    {new Date(slot.startTime).toLocaleString()}
                  </label>
                </div>
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
                </div>
              </div>
            </div>
          ))}
          {isOrganizer &&
            meeting.status === "awaiting_finalization" &&
            selectedSlotsToFinalize.length > 0 && (
              <Button onClick={() => setIsFinalizeDialogOpen(true)}>
                Finalize ({selectedSlotsToFinalize.length}) Selected Slot(s)
              </Button>
            )}
        </CardContent>
      </Card>

      {/* Finalize Dialog */}
      <Dialog
        open={isFinalizeDialogOpen}
        onOpenChange={setIsFinalizeDialogOpen}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Finalize Meeting Slots</DialogTitle>
            <DialogDescription>
              Provide a venue, a Google Meet link, or both for each selected
              time slot.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedSlotsToFinalize.map((slotId) => {
              const slot = meeting.timeSlots.find((s: any) => s.id === slotId);
              return (
                <div key={slotId} className="rounded-md border p-3">
                  <p className="mb-2 font-semibold">
                    {new Date(slot.startTime).toLocaleString()}
                  </p>
                  <div className="space-y-2">
                    <div>
                      <Label htmlFor={`venue-${slotId}`}>Venue</Label>
                      <Input
                        id={`venue-${slotId}`}
                        onChange={(e) =>
                          handleFinalizeDetailsChange(
                            slotId,
                            "venue",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor={`link-${slotId}`}>Meet Link</Label>
                      <Input
                        id={`link-${slotId}`}
                        placeholder="https://meet.google.com/..."
                        onChange={(e) =>
                          handleFinalizeDetailsChange(
                            slotId,
                            "googleMeetLink",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFinalizeDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={onFinalizeSubmit} disabled={isFinalizing}>
              {isFinalizing && <LoadingSpinner className="mr-2 h-4 w-4" />}
              Confirm Meeting
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Slot Dialog */}
      <Dialog
        open={!!editingSlot}
        onOpenChange={(open) => !open && setEditingSlot(null)}
      >
        <DialogContent>
          <form onSubmit={handleUpdateSubmit(onUpdateSlotSubmit)}>
            <DialogHeader>
              <DialogTitle>Update Meeting Details</DialogTitle>
              <DialogDescription>
                Edit the location for the meeting. Participants will be
                notified.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-1">
                <Label htmlFor="venue-update">Venue</Label>
                <Input id="venue-update" {...registerUpdate("venue")} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="link-update">Meet Link</Label>
                <Input id="link-update" {...registerUpdate("googleMeetLink")} />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingSlot(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating && <LoadingSpinner className="mr-2 h-4 w-4" />}
                Update Slot
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
