// client/src/components/meeting/AvailabilityResponseForm.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { meetingSchemas } from "lib";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { LoadingSpinner } from "../ui/spinner";
import { z } from "zod";
import { Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

type AvailabilityStatus = z.infer<typeof meetingSchemas.availabilityStatusEnum>;

interface TimeSlot {
  id: number;
  startTime: string;
  availableCount: number;
  unavailableCount: number;
  availability: {
    participantEmail: string;
    availability: AvailabilityStatus;
  }[];
  userAvailability: AvailabilityStatus | null;
}

interface AvailabilityResponseFormProps {
  timeSlots: TimeSlot[];
  onSubmit: (
    availability: { timeSlotId: number; status: AvailabilityStatus }[]
  ) => void;
  isSubmitting: boolean;
}

const AvailabilityDialog = ({ slot }: { slot: TimeSlot }) => {
  const available = slot.availability.filter(
    (a) => a.availability === "available"
  );
  const unavailable = slot.availability.filter(
    (a) => a.availability === "unavailable"
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
              {available.map((a) => (
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
              {unavailable.map((a) => (
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

export const AvailabilityResponseForm: React.FC<
  AvailabilityResponseFormProps
> = ({ timeSlots, onSubmit, isSubmitting }) => {
  // This initialization function runs only once and pre-fills the state
  // with previously submitted availabilities.
  const [responses, setResponses] = useState<
    Record<number, AvailabilityStatus>
  >(() =>
    timeSlots.reduce(
      (acc, slot) => {
        if (slot.userAvailability) {
          acc[slot.id] = slot.userAvailability;
        }
        return acc;
      },
      {} as Record<number, AvailabilityStatus>
    )
  );

  const handleValueChange = (slotId: number, value: AvailabilityStatus) => {
    setResponses((prev) => ({ ...prev, [slotId]: value }));
  };

  const handleSubmit = () => {
    const formattedResponses = Object.entries(responses).map(
      ([timeSlotId, status]) => ({
        timeSlotId: parseInt(timeSlotId),
        status,
      })
    );
    onSubmit(formattedResponses);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Availability</CardTitle>
        <CardDescription>
          Please mark your availability for the suggested time slots. You can
          change your response until the deadline.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {timeSlots.map((slot) => (
          <Dialog key={slot.id}>
            <div className="rounded-md border p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="font-semibold">
                  {new Date(slot.startTime).toLocaleString()}
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex gap-2 text-sm text-muted-foreground">
                    <span>✅ {slot.availableCount} Available</span>
                    <span>❌ {slot.unavailableCount} Unavailable</span>
                  </div>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Users className="mr-2 h-4 w-4" /> View Details
                    </Button>
                  </DialogTrigger>
                </div>
              </div>
              <RadioGroup
                // The defaultValue is set from the initial state, pre-selecting the option.
                defaultValue={responses[slot.id]}
                onValueChange={(value) =>
                  handleValueChange(slot.id, value as AvailabilityStatus)
                }
                className="mt-4 flex flex-col gap-4 sm:flex-row"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="available"
                    id={`available-${slot.id}`}
                  />
                  <Label htmlFor={`available-${slot.id}`}>Available</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="unavailable"
                    id={`unavailable-${slot.id}`}
                  />
                  <Label htmlFor={`unavailable-${slot.id}`}>Unavailable</Label>
                </div>
              </RadioGroup>
            </div>
            <AvailabilityDialog slot={slot} />
          </Dialog>
        ))}
        <Button
          onClick={handleSubmit}
          disabled={
            isSubmitting || Object.keys(responses).length < timeSlots.length
          }
        >
          {isSubmitting && <LoadingSpinner className="mr-2 h-4 w-4" />}
          Submit Availability
        </Button>
      </CardContent>
    </Card>
  );
};
