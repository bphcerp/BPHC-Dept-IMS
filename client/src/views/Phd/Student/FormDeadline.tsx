import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QualifyingExamForm } from "@/components/phd/QualifyingExamForm";
import api from "@/lib/axios-instance";
import { format } from "date-fns";
import { LoadingSpinner } from "@/components/ui/spinner";

interface ActiveExamResponse {
  success: boolean;
  examEvent: {
    id: number;
    name: string;
    registrationDeadline: string;
    examStartDate?: string;
    examEndDate?: string;
  } | null;
  canApply: boolean;
  message: string;
  attemptsMade: number;
  remainingAttempts: number;
}

const FormDeadline: React.FC = () => {
  const { data, isLoading, error } = useQuery<ActiveExamResponse>({
    queryKey: ["active-qualifying-exam"],
    queryFn: async () => {
      const response = await api.get("/phd/student/active-qualifying-exam");
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
        <span className="ml-2 text-lg">Loading exam information...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load exam information. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (!data?.examEvent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Qualifying Exam Application</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              No active qualifying exam registration is currently available.
              Please check back later or contact the DRC for more information.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const { examEvent, canApply, message, attemptsMade, remainingAttempts } = data;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Qualifying Exam Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">{examEvent.name}</h3>
              <p className="text-sm text-muted-foreground">
                Registration Deadline:{" "}
                {format(new Date(examEvent.registrationDeadline), "PPP 'at' pp")}
              </p>
              {examEvent.examStartDate && examEvent.examEndDate && (
                <p className="text-sm text-muted-foreground">
                  Exam Period:{" "}
                  {format(new Date(examEvent.examStartDate), "PPP")} to{" "}
                  {format(new Date(examEvent.examEndDate), "PPP")}
                </p>
              )}
            </div>
            <div className="flex gap-4">
              <div className="text-sm">
                <span className="font-medium">Attempts Made:</span> {attemptsMade}
                /2
              </div>
              <div className="text-sm">
                <span className="font-medium">Remaining Attempts:</span>{" "}
                {remainingAttempts}
              </div>
            </div>
            <Alert variant={canApply ? "default" : "destructive"}>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
      {canApply && <QualifyingExamForm examEvent={examEvent} />}
    </div>
  );
};

export default FormDeadline;