import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { LoadingSpinner } from "@/components/ui/spinner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, FileText } from "lucide-react";

interface FinalThesisRequest {
  id: number;
  status: string;
  requestType: string;
  updatedAt: string;
}

const FinalThesisDashboard: React.FC = () => {
  const { data: requests, isLoading } = useQuery<FinalThesisRequest[]>({
    queryKey: ["student-final-thesis-requests"],
    queryFn: async () => {
      const res = await api.get("/phd-request/history/me"); // Assuming an endpoint that gets requests for logged-in user
      return res.data.filter(
        (req: FinalThesisRequest) =>
          req.requestType === "final_thesis_submission"
      );
    },
  });

  const activeRequest = requests?.find((req) => req.status !== "completed");

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Final Thesis Submission</h1>
        <p className="mt-2 text-gray-600">
          Manage and track your final thesis submission process.
        </p>
      </div>

      {activeRequest ? (
        <Card>
          <CardHeader>
            <CardTitle>Your Active Submission</CardTitle>
            <CardDescription>
              Your final thesis submission process has been initiated. Click
              below to view details and take necessary actions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>
                Current Status:{" "}
                {activeRequest.status.replace(/_/g, " ").toUpperCase()}
              </AlertTitle>
              <AlertDescription>
                Last updated:{" "}
                {new Date(activeRequest.updatedAt).toLocaleString()}
              </AlertDescription>
            </Alert>
            <Button asChild>
              <Link to={`/phd/requests/${activeRequest.id}`}>
                View Submission Details
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Active Submission</CardTitle>
          </CardHeader>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="mx-auto h-12 w-12" />
            <p className="mt-4">
              The final thesis submission process has not been initiated by your
              supervisor yet.
            </p>
            <p>Please contact your supervisor to begin the process.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FinalThesisDashboard;
