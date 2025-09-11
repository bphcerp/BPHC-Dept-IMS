// client/src/components/phd/proposal/SeminarDetailsForm.tsx
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { phdSchemas } from "lib";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/spinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SeminarDetailsFormProps {
  onSubmit: (data: phdSchemas.SetSeminarDetailsBody) => void;
  isSubmitting: boolean;
}

export const SeminarDetailsForm: React.FC<SeminarDetailsFormProps> = ({
  onSubmit,
  isSubmitting,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<phdSchemas.SetSeminarDetailsBody>({
    resolver: zodResolver(phdSchemas.setSeminarDetailsSchema),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedule Student Seminar</CardTitle>
        <CardDescription>
          Enter the date, time, and venue for the proposal seminar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="seminarDate">Seminar Date</Label>
              <Input
                id="seminarDate"
                type="date"
                {...register("seminarDate")}
              />
              {errors.seminarDate && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.seminarDate.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="seminarTime">Seminar Time</Label>
              <Input
                id="seminarTime"
                type="time"
                {...register("seminarTime")}
              />
              {errors.seminarTime && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.seminarTime.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="seminarVenue">Seminar Venue</Label>
              <Input id="seminarVenue" {...register("seminarVenue")} />
              {errors.seminarVenue && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.seminarVenue.message}
                </p>
              )}
            </div>
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <LoadingSpinner className="mr-2 h-4 w-4" />}
            Save Seminar Details
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
