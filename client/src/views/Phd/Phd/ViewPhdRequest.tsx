// client/src/views/Phd/ViewPhdRequest.tsx
import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { useAuth } from "@/hooks/Auth";
import { LoadingSpinner } from "@/components/ui/spinner";
import BackButton from "@/components/BackButton";
import { RequestDetailsCard } from "@/components/phd/phd-request/RequestDetailsCard";
import { RequestStatusStepper } from "@/components/phd/phd-request/RequestStatusStepper";
import { DrcConvenerReviewPanel } from "@/components/phd/phd-request/DrcConvenerReviewPanel";
import { DrcMemberReviewPanel } from "@/components/phd/phd-request/DrcMemberReviewPanel";
import { HodReviewPanel } from "@/components/phd/phd-request/HodReviewPanel";
import { StudentFinalThesisForm } from "@/components/phd/phd-request/StudentFinalThesisForm";
import { SupervisorFinalThesisForm } from "@/components/phd/phd-request/SupervisorFinalThesisForm";

// A comprehensive type for the detailed request view
interface PhdRequestDetails {
  id: number;
  requestType: string;
  status: string;
  comments: string | null;
  student: { name: string; email: string };
  supervisor: { name: string; email: string };
  documents: Array<{
    id: number;
    documentType: string;
    file: { originalName: string; id: number };
  }>;
  reviews: Array<{
    reviewer: { name: string };
    approved: boolean;
    comments: string;
    createdAt: string;
  }>;
  drcAssignments: Array<{ drcMemberEmail: string; status: string }>;
}

const ViewPhdRequest: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { authState, checkAccess } = useAuth();
  const queryKey = ["phd-request-details", id];

  const {
    data: request,
    isLoading,
    isError,
    refetch,
  } = useQuery<PhdRequestDetails>({
    queryKey,
    queryFn: async () => {
      // This endpoint needs to be created, joining all related tables
      const res = await api.get(`/phd/request/details/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const renderActionPanel = () => {
    if (!request) return null;

    // DRC Convener
    if (
      checkAccess("phd-request:drc-convener:view") &&
      ["supervisor_submitted", "drc_convener_review"].includes(request.status)
    ) {
      return <DrcConvenerReviewPanel request={request} onSuccess={refetch} />;
    }
    // DRC Member
    if (
      checkAccess("phd-request:drc-member:view") &&
      request.status === "drc_member_review"
    ) {
      return <DrcMemberReviewPanel request={request} onSuccess={refetch} />;
    }
    // HOD
    if (
      checkAccess("phd-request:hod:view") &&
      request.status === "hod_review"
    ) {
      return <HodReviewPanel request={request} onSuccess={refetch} />;
    }
    // Student (Final Thesis)
    if (
      request.student.email === authState?.email &&
      request.status === "student_review"
    ) {
      return <StudentFinalThesisForm request={request} onSuccess={refetch} />;
    }
    // Supervisor (Final Thesis)
    if (
      request.supervisor.email === authState?.email &&
      request.status === "supervisor_review_final_thesis"
    ) {
      return (
        <SupervisorFinalThesisForm request={request} onSuccess={refetch} />
      );
    }

    return null;
  };

  if (isLoading)
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  if (isError || !request)
    return (
      <div className="p-8 text-center text-destructive">
        Failed to load request details.
      </div>
    );

  return (
    <div className="space-y-6">
      <BackButton />
      <RequestDetailsCard request={request} />
      <RequestStatusStepper
        reviews={request.reviews}
        currentStatus={request.status}
      />
      <div className="mt-6">{renderActionPanel()}</div>
    </div>
  );
};

export default ViewPhdRequest;
