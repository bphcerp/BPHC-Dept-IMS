// client/src/views/Meeting/ViewMeeting.tsx
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/axios-instance";
import { toast } from "sonner";
import { MeetingDetails } from "@/components/meeting/MeetingDetails";
import { LoadingSpinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/Auth";
import { meetingSchemas } from "lib";
import { z } from "zod";

type FinalizeFormData = z.infer<typeof meetingSchemas.finalizeMeetingSchema>;
type UpdateSlotFormData = z.infer<
  typeof meetingSchemas.updateMeetingSlotSchema
>;
type AddInviteesFormData = z.infer<typeof meetingSchemas.addInviteesSchema>;

const ViewMeeting: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const meetingId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { authState } = useAuth();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["meeting", meetingId],
    queryFn: () =>
      api.get(`/meeting/details/${meetingId}`).then((res) => res.data.meeting),
    enabled: !!meetingId,
  });

  const finalizeMutation = useMutation({
    mutationFn: (variables: Omit<FinalizeFormData, "meetingId">) =>
      api.post("/meeting/finalize", { meetingId, ...variables }),
    onSuccess: () => {
      toast.success("Meeting has been finalized!");
      void queryClient.invalidateQueries({ queryKey: ["meeting", meetingId] });
      void queryClient.invalidateQueries({ queryKey: ["meetings"] });
      navigate("/meeting");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to finalize meeting."
      );
    },
  });

  const updateSlotMutation = useMutation({
    mutationFn: (variables: { slotId: number; data: UpdateSlotFormData }) =>
      api.put(
        `/meeting/update-details/${meetingId}/slot/${variables.slotId}`,
        variables.data
      ),
    onSuccess: () => {
      toast.success("Meeting details have been updated!");
      void queryClient.invalidateQueries({ queryKey: ["meeting", meetingId] });
      void queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to update meeting details."
      );
    },
  });

  const addInviteesMutation = useMutation({
    mutationFn: (variables: Omit<AddInviteesFormData, "meetingId">) =>
      api.post("/meeting/add-invitees", { meetingId, ...variables }),
    onSuccess: () => {
      toast.success("New invitees have been added and notified.");
      void queryClient.invalidateQueries({ queryKey: ["meeting", meetingId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to add invitees.");
    },
  });

  if (isLoading)
    return (
      <div className="flex justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  if (isError || !data)
    return (
      <p className="text-center text-destructive">
        Could not load meeting details.
      </p>
    );

  const isOrganizer = authState?.email === data.organizerEmail;

  return (
    <MeetingDetails
      meeting={data}
      onFinalize={finalizeMutation.mutate}
      isFinalizing={finalizeMutation.isLoading}
      onUpdateSlot={updateSlotMutation.mutate}
      isUpdating={updateSlotMutation.isLoading}
      onAddInvitees={addInviteesMutation.mutate}
      isAddingInvitees={addInviteesMutation.isLoading}
      isOrganizer={isOrganizer}
    />
  );
};

export default ViewMeeting;
