import React from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { SupervisorFinalThesisReviewForm } from "@/components/phd/phd-request/SupervisorFinalThesisForm";
import { SupervisorResubmitForm } from "@/components/phd/phd-request/SupervisorResubmitForm";
import { DrcConvenerFinalThesisForm } from "@/components/phd/phd-request/DrcConvenerFinalThesisForm";
import { HodFinalThesisForm } from "@/components/phd/phd-request/HodFinalThesisForm";
import { phdRequestSchemas } from "lib";

interface PhdRequestDetails {
  id: number;
  requestType: string;
  status: (typeof phdRequestSchemas.phdRequestStatuses)[number];
  comments: string | null;
  student: { name: string; email: string };
  supervisor: { name: string; email: string };
  documents: Array<{
    id: number;
    documentType: string;
    isPrivate: boolean;
    file: { originalName: string; id: number };
  }>;
  reviews: Array<{
    reviewer: { name: string; email: string };
    approved: boolean;
    comments: string | null;
    createdAt: string;
    status_at_review: string | null;
    reviewerDisplayName: string; // This line was missing or incorrect
  }>;
  drcAssignments: Array<{ drcMemberEmail: string; status: string }>;
}

const ViewPhdRequest: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { authState, checkAccess } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["phd-request-details", id];

  const {
    data: request,
    isLoading,
    isError,
  } = useQuery<PhdRequestDetails>({
    queryKey,
    queryFn: async () => {
      const res = await api.get(`/phd-request/details/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const handleSuccess = async () => {
    await queryClient.invalidateQueries({ queryKey });
    await queryClient.invalidateQueries({
      queryKey: ["drc-convener-requests"],
    });
    await queryClient.invalidateQueries({ queryKey: ["drc-member-requests"] });
    await queryClient.invalidateQueries({ queryKey: ["hod-requests"] });
    await queryClient.invalidateQueries({
      queryKey: ["supervisor-my-students"],
    });
  };

  const renderActionPanel = () => {
    if (!request || !authState) return null;

    const revertableStatuses: (typeof phdRequestSchemas.phdRequestStatuses)[number][] =
      ["reverted_by_drc_convener", "reverted_by_drc_member", "reverted_by_hod"];

    if (
      authState.email === request.supervisor.email &&
      revertableStatuses.includes(request.status)
    ) {
      return (
        <SupervisorResubmitForm
          requestId={request.id}
          onSuccess={handleSuccess}
        />
      );
    }

    // Final Thesis Submission specific forms
    if (request.requestType === "final_thesis_submission") {
      if (
        checkAccess("phd-request:drc-convener:review") &&
        [
          "supervisor_review_final_thesis",
          "drc_convener_review",
          "drc_member_review",
        ].includes(request.status)
      ) {
        return (
          <DrcConvenerFinalThesisForm
            request={request}
            onSuccess={handleSuccess}
          />
        );
      }
      if (
        checkAccess("phd-request:hod:review") &&
        request.status === "hod_review"
      ) {
        return (
          <HodFinalThesisForm request={request} onSuccess={handleSuccess} />
        );
      }
    } else {
      // Generic forms for other requests
      if (
        checkAccess("phd-request:drc-convener:review") &&
        ["supervisor_submitted", "drc_convener_review"].includes(request.status)
      ) {
        return (
          <DrcConvenerReviewPanel request={request} onSuccess={handleSuccess} />
        );
      }
      if (
        checkAccess("phd-request:hod:review") &&
        request.status === "hod_review"
      ) {
        return <HodReviewPanel request={request} onSuccess={handleSuccess} />;
      }
    }

    if (
      checkAccess("phd-request:drc-member:review") &&
      request.status === "drc_member_review"
    ) {
      return (
        <DrcMemberReviewPanel request={request} onSuccess={handleSuccess} />
      );
    }
    if (
      request.student.email === authState.email &&
      request.status === "student_review"
    ) {
      if (request.requestType === "final_thesis_submission") {
        return (
          <StudentFinalThesisForm request={request} onSuccess={handleSuccess} />
        );
      }
    }
    if (
      request.supervisor.email === authState.email &&
      request.status === "supervisor_review_final_thesis"
    ) {
      return (
        <SupervisorFinalThesisReviewForm
          request={request}
          onSuccess={handleSuccess}
        />
      );
    }

    return null;
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError || !request) {
    return (
      <div className="p-8 text-center text-destructive">
        Failed to load request details.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton />
      <RequestDetailsCard request={request} />
      <RequestStatusStepper reviews={request.reviews} request={request} />
      <div className="mt-6">{renderActionPanel()}</div>
    </div>
  );
};

export default ViewPhdRequest;
