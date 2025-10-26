import React, { useState, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/spinner";

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
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");

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

  const groupedSlots = useMemo(() => {
    return availableSlots.reduce(
      (acc, slot) => {
        const date = new Date(slot.startTime).toISOString().split("T")[0];
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(slot);
        return acc;
      },
      {} as Record<string, SeminarSlot[]>
    );
  }, [availableSlots]);

  const availableDates = Object.keys(groupedSlots);
  const slotsForSelectedDate = selectedDate ? groupedSlots[selectedDate] : [];

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
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date-select">Select Date</Label>
              <Select
                value={selectedDate}
                onValueChange={(date) => {
                  setSelectedDate(date);
                  setSelectedSlotId("");
                }}
              >
                <SelectTrigger id="date-select">
                  <SelectValue placeholder="Choose a date..." />
                </SelectTrigger>
                <SelectContent>
                  {availableDates.map((date) => (
                    <SelectItem key={date} value={date}>
                      {new Date(date).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedDate && (
              <div className="space-y-2">
                <Label htmlFor="slot-select">Select Time & Venue</Label>
                <Select
                  value={selectedSlotId}
                  onValueChange={setSelectedSlotId}
                >
                  <SelectTrigger id="slot-select">
                    <SelectValue placeholder="Choose a time slot..." />
                  </SelectTrigger>
                  <SelectContent>
                    {slotsForSelectedDate.map((slot) => (
                      <SelectItem key={slot.id} value={slot.id.toString()}>
                        {new Date(slot.startTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        -{" "}
                        {new Date(slot.endTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        ({slot.venue})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

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
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SeminarSlotSelector;
