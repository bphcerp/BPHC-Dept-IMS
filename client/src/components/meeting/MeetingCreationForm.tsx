// client/src/components/meeting/MeetingCreationForm.tsx
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/ui/spinner";
import { z } from "zod";
import { MultiSelectCombobox } from "../ui/multi-select-combobox";
import { DateTimePicker } from "../ui/date-time-picker";
import { meetingSchemas } from "lib";

type MeetingFormData = z.infer<typeof meetingSchemas.createMeetingSchema>;
type FormValues = Omit<MeetingFormData, "timeSlots">;

interface MeetingCreationFormProps {
  onSubmit: (data: FormValues) => void;
  isSubmitting: boolean;
  facultyList: { value: string; label: string }[];
}

export const MeetingCreationForm: React.FC<MeetingCreationFormProps> = ({
  onSubmit,
  isSubmitting,
  facultyList,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<FormValues>({
    resolver: zodResolver(
      meetingSchemas.createMeetingObjectSchema.omit({ timeSlots: true })
    ),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="title">Meeting Title</Label>
        <Input id="title" {...register("title")} />
        {errors.title && (
          <p className="mt-1 text-xs text-destructive">
            {errors.title.message}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="purpose">Purpose (Optional)</Label>
        <Textarea id="purpose" {...register("purpose")} />
      </div>
      <div>
        <Label>Participants</Label>
        <MultiSelectCombobox
          control={control}
          name="participants"
          options={facultyList}
          placeholder="Select participants..."
          searchPlaceholder="Search faculty..."
          emptyPlaceholder="No faculty found."
        />
        {errors.participants && (
          <p className="mt-1 text-xs text-destructive">
            {errors.participants.message}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="duration">Duration (in minutes)</Label>
        <Input
          id="duration"
          type="number"
          {...register("duration", { valueAsNumber: true })}
        />
        {errors.duration && (
          <p className="mt-1 text-xs text-destructive">
            {errors.duration.message}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="deadline">Response Deadline</Label>
        <DateTimePicker control={control} name="deadline" />
        {errors.deadline && (
          <p className="mt-1 text-xs text-destructive">
            {errors.deadline.message}
          </p>
        )}
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <LoadingSpinner className="mr-2 h-4 w-4" />}
        Next: Select Time Slots
      </Button>
    </form>
  );
};
