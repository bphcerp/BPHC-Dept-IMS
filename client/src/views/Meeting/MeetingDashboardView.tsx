// client/src/views/Meeting/MeetingDashboardView.tsx
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { LoadingSpinner } from "@/components/ui/spinner";
import { MeetingDashboard } from "@/components/meeting/MeetingDashboard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { isAxiosError } from "axios";
import { toast } from "sonner";

interface MeetingsData {
  organized: any[];
  invited: any[];
}

const MeetingDashboardView: React.FC = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useQuery<MeetingsData>({
    queryKey: ["meetings"],
    queryFn: () => api.get("/meeting/all").then((res) => res.data),
  });

  const remindMutation = useMutation({
    mutationFn: (meetingId: number) =>
      api.post("/meeting/remind", { meetingId }),
    onSuccess: (res) => {
      toast.success(res.data.message);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to send reminders.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (meetingId: number) =>
      api.delete(`/meeting/delete/${meetingId}`),
    onSuccess: (res) => {
      toast.success(res.data.message);
      void queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to cancel meeting.");
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    let errorMessage = "An unexpected error occurred.";
    if (isAxiosError(error)) {
      errorMessage = error.response?.data?.message || error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Could not fetch meetings: {errorMessage}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <MeetingDashboard
      organizedMeetings={data?.organized || []}
      invitedMeetings={data?.invited || []}
      onRemind={remindMutation.mutate}
      onDelete={deleteMutation.mutate}
      isReminding={remindMutation.isLoading}
      isDeleting={deleteMutation.isLoading}
    />
  );
};

export default MeetingDashboardView;
