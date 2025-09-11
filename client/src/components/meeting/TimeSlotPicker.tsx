// client/src/components/meeting/TimeSlotPicker.tsx
import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { X, Clock } from "lucide-react";

interface TimeSlotPickerProps {
  selectedSlots: Date[];
  onSlotSelect: (slots: Date[]) => void;
  duration: number; // in minutes
}

export const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  selectedSlots,
  onSlotSelect,
  duration,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );

  // Generate time slots for the selected day (e.g., 9 AM to 5 PM, every 30 mins)
  const timeSlotsForDay = useMemo(() => {
    if (!selectedDate) return [];
    const slots = [];
    const startHour = 9;
    const endHour = 17;
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slot = new Date(selectedDate);
        slot.setHours(hour, minute, 0, 0);
        slots.push(slot);
      }
    }
    return slots;
  }, [selectedDate]);

  const handleTimeSelect = (slot: Date) => {
    // Prevent adding duplicate slots
    if (selectedSlots.some((s) => s.getTime() === slot.getTime())) return;

    const newSelectedSlots = [...selectedSlots, slot].sort(
      (a, b) => a.getTime() - b.getTime()
    );
    onSlotSelect(newSelectedSlots);
  };

  const handleRemoveSlot = (slotToRemove: Date) => {
    const newSelectedSlots = selectedSlots.filter(
      (s) => s.getTime() !== slotToRemove.getTime()
    );
    onSlotSelect(newSelectedSlots);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Suggest Meeting Time Slots</CardTitle>
        <CardDescription>
          Select a day, then choose one or more available time slots for the
          meeting.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Calendar for Date Selection */}
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
            disabled={(date) =>
              date < new Date(new Date().setDate(new Date().getDate() - 1))
            } // Disable past dates
          />
        </div>

        {/* Time Slot Selection and Display */}
        <div className="space-y-4">
          <div>
            <h4 className="mb-2 font-semibold">
              Available slots for{" "}
              {selectedDate ? selectedDate.toLocaleDateString() : "..."}
            </h4>
            <div className="grid max-h-48 grid-cols-3 gap-2 overflow-y-auto pr-2 sm:grid-cols-4">
              {timeSlotsForDay.length > 0 ? (
                timeSlotsForDay.map((slot, index) => {
                  const isSelected = selectedSlots.some(
                    (s) => s.getTime() === slot.getTime()
                  );
                  return (
                    <Button
                      key={index}
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => handleTimeSelect(slot)}
                      disabled={isSelected}
                    >
                      {slot.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Button>
                  );
                })
              ) : (
                <p className="col-span-4 text-sm text-muted-foreground">
                  Please select a date.
                </p>
              )}
            </div>
          </div>
          <div>
            <h4 className="mb-2 flex items-center gap-2 font-semibold">
              <Clock className="h-4 w-4" />
              Selected Slots ({selectedSlots.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {selectedSlots.length > 0 ? (
                selectedSlots.map((slot, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="py-1 text-base"
                  >
                    {slot.toLocaleString([], {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                    <button
                      onClick={() => handleRemoveSlot(slot)}
                      className="ml-2 rounded-full p-0.5 hover:bg-destructive/20"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No slots selected yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
