import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { LoadingSpinner } from "@/components/ui/spinner";
import BackButton from "@/components/BackButton";
import { RequestDetailsCard } from "@/components/phd/phd-request/RequestDetailsCard";
import { RequestStatusStepper } from "@/components/phd/phd-request/RequestStatusStepper";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { phdRequestSchemas } from "lib";

interface PhdRequestDetails {
  id: number;
  requestType: string;
  status: (typeof phdRequestSchemas.phdRequestStatuses)[number];
  comments: string | null;
  createdAt: string;
  student: { name: string; email: string };
  supervisor: { name: string; email: string };
  documents: Array<{
    id: number;
    documentType: string;
    isPrivate: boolean;
    file: { originalName: string; id: number };
  }>;
  reviews: Array<{
    reviewer: { name: string };
    approved: boolean;
    comments: string | null;
    createdAt: string;
  }>;
}

const StudentHistory: React.FC = () => {
  const { studentEmail } = useParams<{ studentEmail: string }>();

  const {
    data: requests = [],
    isLoading,
    isError,
  } = useQuery<PhdRequestDetails[]>({
    queryKey: ["student-request-history", studentEmail],
    queryFn: async () => {
      const res = await api.get(`/phd-request/history/${studentEmail}`);
      return res.data;
    },
    enabled: !!studentEmail,
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center text-destructive">
        Failed to load request history.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="text-center">
        <h1 className="text-3xl font-bold">Request History</h1>
        <p className="mt-2 text-gray-600">
          Showing all past and present requests for{" "}
          {requests[0]?.student.name || studentEmail}.
        </p>
      </div>

      {requests.length > 0 ? (
        <Accordion type="single" collapsible className="w-full">
          {requests.map((request, index) => (
            <AccordionItem value={`item-${index}`} key={request.id}>
              <AccordionTrigger>
                <div className="flex w-full items-center justify-between pr-4">
                  <div className="text-left">
                    <p className="font-semibold">
                      {request.requestType
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Created on:{" "}
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {request.status.replace(/_/g, " ").toUpperCase()}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 border-t pt-4">
                  <RequestDetailsCard request={request} />
                  <RequestStatusStepper reviews={request.reviews} />
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <div className="p-8 text-center text-muted-foreground">
          No request history found for this student.
        </div>
      )}
    </div>
  );
};

export default StudentHistory;
