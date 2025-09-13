// client/src/views/Meeting/MeetingDashboardView.tsx
import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { LoadingSpinner } from "@/components/ui/spinner";
import { MeetingDashboard } from "@/components/meeting/MeetingDashboard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { isAxiosError } from "axios";

// Define a type for the API response
interface MeetingsData {
  organized: any[]; // Replace 'any' with a proper Meeting type if available
  invited: any[];
}

const MeetingDashboardView: React.FC = () => {
  const { data, isLoading, isError, error } = useQuery<MeetingsData>({
    queryKey: ["meetings"],
    queryFn: () => api.get("/meeting/all").then((res) => res.data),
  });

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    // Corrected Error Handling Logic
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
    />
  );
};

export default MeetingDashboardView;
