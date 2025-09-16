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
  deadline: string;
}

export const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  selectedSlots,
  onSlotSelect,
  deadline,
}) => {
  const deadlineDate = new Date(deadline);

  // Set initial selected date to the day after the deadline
  const getInitialDate = () => {
    const nextDay = new Date(deadlineDate);
    nextDay.setDate(nextDay.getDate() + 1);
    nextDay.setHours(0, 0, 0, 0);
    return nextDay;
  };
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    getInitialDate()
  );

  const timeSlotsForDay = useMemo(() => {
    if (!selectedDate) return [];

    const slots: Date[] = [];
    const isSameDayAsDeadline =
      selectedDate.getFullYear() === deadlineDate.getFullYear() &&
      selectedDate.getMonth() === deadlineDate.getMonth() &&
      selectedDate.getDate() === deadlineDate.getDate();

    if (isSameDayAsDeadline) {
      // Start 30 minutes after the deadline
      const start = new Date(deadlineDate.getTime() + 30 * 60000);
      let currentHour = start.getHours();
      let currentMinute = start.getMinutes() >= 30 ? 30 : 0;

      // Adjust if starting minute is not a 30-min interval start
      if (start.getMinutes() > 0 && start.getMinutes() < 30) {
        currentMinute = 30;
      } else if (start.getMinutes() > 30) {
        currentHour += 1;
        currentMinute = 0;
      }

      const endHour = 18; // 6 PM
      for (let hour = currentHour; hour < endHour; hour++) {
        for (
          let minute = hour === currentHour ? currentMinute : 0;
          minute < 60;
          minute += 30
        ) {
          const slot = new Date(selectedDate);
          slot.setHours(hour, minute, 0, 0);
          slots.push(slot);
        }
      }
    } else {
      // Regular day from 8 AM to 6 PM
      const startHour = 8;
      const endHour = 18;
      for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const slot = new Date(selectedDate);
          slot.setHours(hour, minute, 0, 0);
          slots.push(slot);
        }
      }
    }
    return slots;
  }, [selectedDate, deadlineDate]);

  const handleTimeSelect = (slot: Date) => {
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
          Select a day on or after the response deadline, then choose one or
          more available time slots for the meeting.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
            disabled={(date) =>
              date.getTime() < deadlineDate.setHours(0, 0, 0, 0)
            }
          />
        </div>
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
                  Please select a valid date.
                </p>
              )}
            </div>
          </div>
          <div>
            <h4 className="mb-2 flex items-center gap-2 font-semibold">
              <Clock className="h-4 w-4" /> Selected Slots (
              {selectedSlots.length})
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
