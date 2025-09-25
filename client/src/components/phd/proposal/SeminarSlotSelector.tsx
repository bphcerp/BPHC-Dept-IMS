// client/src/components/phd/proposal/SeminarSlotSelector.tsx
import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/spinner";
import { Calendar, Clock, MapPin } from "lucide-react";

interface SeminarSlot {
  id: number;
  venue: string;
  startTime: string;
  endTime: string;
}

interface SeminarSlotSelectorProps {
  proposalId: number;
  onSuccess: () => void;
}

const SeminarSlotSelector: React.FC<SeminarSlotSelectorProps> = ({
  proposalId,
  onSuccess,
}) => {
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  const { data: availableSlots = [], isLoading } = useQuery<SeminarSlot[]>({
    queryKey: ["available-seminar-slots"],
    queryFn: async () => {
      const res = await api.get("/phd/proposal/supervisor/getAvailableSlots");
      return res.data;
    },
  });

  const bookSlotMutation = useMutation({
    mutationFn: (slotId: number) =>
      api.post(`/phd/proposal/supervisor/setSeminarDetails/${proposalId}`, {
        slotId,
      }),
    onSuccess: () => {
      toast.success("Seminar slot booked successfully!");
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to book slot.");
    },
  });

  const handleSubmit = () => {
    if (!selectedSlotId) {
      toast.error("Please select a time slot.");
      return;
    }
    bookSlotMutation.mutate(Number(selectedSlotId));
  };

  const groupedSlots = availableSlots.reduce(
    (acc, slot) => {
      const date = new Date(slot.startTime).toLocaleDateString("en-CA"); // YYYY-MM-DD
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(slot);
      return acc;
    },
    {} as Record<string, SeminarSlot[]>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Book Seminar Slot</CardTitle>
        <CardDescription>
          Select an available date, time, and venue for the student's proposal
          seminar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {availableSlots.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No seminar slots are currently available. Please check back later or
            contact the DRC Convenor.
          </div>
        ) : (
          <RadioGroup
            value={selectedSlotId ?? undefined}
            onValueChange={setSelectedSlotId}
          >
            <div className="space-y-6">
              {Object.entries(groupedSlots).map(([date, slots]) => (
                <div key={date}>
                  <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold">
                    <Calendar className="h-5 w-5" />
                    {new Date(date).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {slots.map((slot) => (
                      <Label
                        key={slot.id}
                        htmlFor={`slot-${slot.id}`}
                        className="block cursor-pointer rounded-lg border p-4 hover:bg-accent has-[:checked]:bg-primary has-[:checked]:text-primary-foreground"
                      >
                        <div className="flex items-start gap-4">
                          <RadioGroupItem
                            value={slot.id.toString()}
                            id={`slot-${slot.id}`}
                          />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 font-medium">
                              <Clock className="h-4 w-4" />
                              {new Date(slot.startTime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}{" "}
                              -
                              {new Date(slot.endTime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-4 w-4" />
                              {slot.venue}
                            </div>
                          </div>
                        </div>
                      </Label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </RadioGroup>
        )}
        {availableSlots.length > 0 && (
          <Button
            onClick={handleSubmit}
            disabled={bookSlotMutation.isLoading || !selectedSlotId}
            className="mt-6"
          >
            {bookSlotMutation.isLoading && (
              <LoadingSpinner className="mr-2 h-4 w-4" />
            )}
            Book Selected Slot
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default SeminarSlotSelector;
