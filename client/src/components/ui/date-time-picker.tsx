import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Control, Controller } from "react-hook-form";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "./input";
import { Label } from "./label";

interface DateTimePickerProps {
  control: Control<any>;
  name: string;
}

export function DateTimePicker({ control, name }: DateTimePickerProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const selectedDate = field.value ? new Date(field.value) : null;

        const handleDateSelect = (day: Date | undefined) => {
          if (!day) return;
          const newDate = new Date(
            day.getFullYear(),
            day.getMonth(),
            day.getDate(),
            selectedDate?.getHours() || 0,
            selectedDate?.getMinutes() || 0
          );
          field.onChange(newDate.toISOString());
        };

        const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const [hours, minutes] = e.target.value.split(":").map(Number);
          const newDate = selectedDate || new Date();
          newDate.setHours(hours, minutes);
          field.onChange(newDate.toISOString());
        };

        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !field.value && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {field.value ? (
                  format(new Date(field.value), "PPPp")
                ) : (
                  <span>Pick a date and time</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate || undefined}
                onSelect={handleDateSelect}
                initialFocus
              />
              <div className="border-t border-border p-3">
                <Label>Time</Label>
                <Input
                  type="time"
                  defaultValue={
                    selectedDate ? format(selectedDate, "HH:mm") : "00:00"
                  }
                  onChange={handleTimeChange}
                />
              </div>
            </PopoverContent>
          </Popover>
        );
      }}
    />
  );
}
