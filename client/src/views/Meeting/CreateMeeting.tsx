// client/src/views/Meeting/CreateMeeting.tsx
import React, { useState, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { MeetingCreationForm } from "@/components/meeting/MeetingCreationForm";
import { TimeSlotPicker } from "@/components/meeting/TimeSlotPicker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { meetingSchemas } from "lib";
import { z } from "zod";
import { LoadingSpinner } from "@/components/ui/spinner";

type MeetingFormData = z.infer<typeof meetingSchemas.createMeetingSchema>;
interface User {
  name: string | null;
  email: string;
}

const CreateMeeting: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<
    Partial<Omit<MeetingFormData, "timeSlots">>
  >({});
  const [selectedSlots, setSelectedSlots] = useState<Date[]>([]);

  const { data: userData, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["allUsersForMeeting"],
    queryFn: () => api.get("/meeting/all-users").then((res) => res.data),
  });

  const userListOptions = useMemo(() => {
    if (!userData) return [];
    return userData.map((u) => ({
      value: u.email,
      label: `${u.name || u.email.split("@")[0]} (${u.email})`,
    }));
  }, [userData]);

  const mutation = useMutation({
    mutationFn: (fullData: MeetingFormData) =>
      api.post("/meeting/create", fullData),
    onSuccess: () => {
      toast.success("Meeting created and invites sent!");
      navigate("/meeting");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create meeting.");
    },
  });

  const handleFormSubmit = (data: Omit<MeetingFormData, "timeSlots">) => {
    setFormData(data);
    setStep(2);
  };

  const handleFinalSubmit = () => {
    if (selectedSlots.length === 0) {
      toast.error("Please select at least one time slot.");
      return;
    }
    const fullData = {
      ...formData,
      timeSlots: selectedSlots.map((d) => d.toISOString()),
    } as MeetingFormData;
    mutation.mutate(fullData);
  };

  if (isLoadingUsers) {
    return (
      <div className="flex justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {step === 1 && (
        <Card>
          <CardContent className="p-6">
            <MeetingCreationForm
              onSubmit={handleFormSubmit}
              isSubmitting={mutation.isLoading}
              facultyList={userListOptions}
            />
          </CardContent>
        </Card>
      )}
      {step === 2 && formData.deadline && (
        <div className="space-y-4">
          <TimeSlotPicker
            selectedSlots={selectedSlots}
            onSlotSelect={setSelectedSlots}
            deadline={formData.deadline}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button onClick={handleFinalSubmit} disabled={mutation.isLoading}>
              {mutation.isLoading && (
                <LoadingSpinner className="mr-2 h-4 w-4" />
              )}
              Create Meeting
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateMeeting;
