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
import { z } from "zod"; // Corrected: Added zod import

type AvailabilityStatus = z.infer<typeof meetingSchemas.availabilityStatusEnum>;

interface TimeSlot {
  id: number;
  startTime: string;
}

interface AvailabilityResponseFormProps {
  timeSlots: TimeSlot[];
  onSubmit: (
    availability: { timeSlotId: number; status: AvailabilityStatus }[]
  ) => void;
  isSubmitting: boolean;
}

export const AvailabilityResponseForm: React.FC<
  AvailabilityResponseFormProps
> = ({ timeSlots, onSubmit, isSubmitting }) => {
  const [responses, setResponses] = useState<
    Record<number, AvailabilityStatus>
  >({});

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
          Please mark your availability for the suggested time slots.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {timeSlots.map((slot) => (
          <div key={slot.id} className="rounded-md border p-4">
            <p className="font-semibold">
              {new Date(slot.startTime).toLocaleString()}
            </p>
            <RadioGroup
              onValueChange={(value) =>
                handleValueChange(slot.id, value as AvailabilityStatus)
              }
              className="mt-2 flex flex-col gap-4 sm:flex-row"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="best_available" id={`best-${slot.id}`} />
                <Label htmlFor={`best-${slot.id}`}>Best Available</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="tentative" id={`tentative-${slot.id}`} />
                <Label htmlFor={`tentative-${slot.id}`}>Tentative</Label>
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
        ))}
        <Button
          onClick={handleSubmit}
          disabled={
            isSubmitting || Object.keys(responses).length !== timeSlots.length
          }
        >
          {isSubmitting && <LoadingSpinner className="mr-2 h-4 w-4" />}
          Submit Availability
        </Button>
      </CardContent>
    </Card>
  );
};
