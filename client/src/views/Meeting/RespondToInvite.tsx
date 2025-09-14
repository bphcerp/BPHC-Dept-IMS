// client/src/views/Meeting/RespondToInvite.tsx
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/axios-instance";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/spinner";
import { AvailabilityResponseForm } from "@/components/meeting/AvailabilityResponseForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const RespondToInvite: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const meetingId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: meeting,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["meeting-response", meetingId],
    queryFn: () =>
      api.get(`/meeting/details/${meetingId}`).then((res) => res.data.meeting),
    enabled: !!meetingId,
  });

  const mutation = useMutation({
    mutationFn: (availability: any[]) =>
      api.post("/meeting/respond", { meetingId, availability }),
    onSuccess: () => {
      toast.success("Your availability has been submitted.");
      void queryClient.invalidateQueries({ queryKey: ["meetings"] });
      void queryClient.invalidateQueries({
        queryKey: ["meeting-response", meetingId],
      });
      navigate("/meeting");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to submit availability."
      );
    },
  });

  if (isLoading)
    return (
      <div className="flex justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  if (isError || !meeting) return <p>Could not load invitation.</p>;

  const canRespond =
    meeting.status === "pending_responses" ||
    meeting.status === "awaiting_finalization";

  if (!canRespond) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Response Not Possible</CardTitle>
          <CardDescription>
            This meeting is no longer accepting availability responses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            Current Status: <strong>{meeting.status}</strong>
          </p>
          {meeting.finalizedTime && (
            <p className="mt-2">
              Scheduled for:{" "}
              <strong>
                {new Date(meeting.finalizedTime).toLocaleString()}
              </strong>
            </p>
          )}
          {meeting.venue && (
            <p className="mt-2">
              <strong>Venue:</strong> {meeting.venue}
            </p>
          )}
          {meeting.googleMeetLink && (
            <p className="mt-2">
              <strong>Google Meet:</strong>{" "}
              <a
                href={meeting.googleMeetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                {meeting.googleMeetLink}
              </a>
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <AvailabilityResponseForm
      timeSlots={meeting.timeSlots}
      onSubmit={mutation.mutate}
      isSubmitting={mutation.isLoading}
    />
  );
};

export default RespondToInvite;
