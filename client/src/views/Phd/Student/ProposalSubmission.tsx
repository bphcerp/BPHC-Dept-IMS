import { ExamStatusList } from "@/components/phd/ExamStatusList";
import ExamDateDisplay from "@/components/phd/ExamDateDisplay";
import ProposalSubmissionForm from "@/components/phd/ProposalSubmissionForm";
import { LoadingSpinner } from "@/components/ui/spinner";
import api from "@/lib/axios-instance";
import { useQuery } from "@tanstack/react-query";

// Define types for API responses
interface ExamStatusResponse {
  success: boolean;
  status: "pending" | "pass" | "fail";
}

interface ProposalDeadlineResponse {
  deadline: string;
}

interface PassingDateResponse {
  qualificationDate: string;
}

interface ProposalStatusResponse {
  success: boolean;
  showProposal: boolean;
  documents: {
    proposal: Array<{
      status: "pending" | "approved" | "rejected";
      comment: string;
    }>;
  };
}

export default function CombinedExamAndProposalPage() {
  const {
    data: examData,
    isLoading: isLoadingExamStatus,
    error: examError,
  } = useQuery({
    queryKey: ["phd-student-exams"],
    queryFn: async () => {
      const response = await api.get<ExamStatusResponse>(
        "/phd/student/getQualifyingExamStatus"
      );
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });

  const { data: proposalDeadline, isLoading: isLoadingProposalDeadline } =
    useQuery({
      queryKey: ["phd-students"],
      queryFn: async () => {
        const response = await api.get<ProposalDeadlineResponse>(
          "/phd/student/getProposalDeadline"
        );
        return response.data;
      },
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
      enabled: examData?.status === "pass",
    });

  const { data: passingDate, isLoading: isLoadingPassingDate } = useQuery({
    queryKey: ["phd-qualifying-exam-passing-date"],
    queryFn: async () => {
      const response = await api.get<PassingDateResponse>(
        "/phd/student/getQualifyingExamPassingDate"
      );
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
    enabled: examData?.status === "pass",
  });

  const { data: proposalStatus } = useQuery({
    queryKey: ["phd-proposal-status"],
    queryFn: async () => {
      const response = await api.get<ProposalStatusResponse>(
        "/phd/student/getProposalStatus"
      );
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
    enabled: examData?.status === "pass",
  });

  const showProposalSubmissionForm =
    examData?.status === "pass" && proposalStatus?.showProposal;
  const proposalStatusValue = proposalStatus?.documents.proposal[0]?.status;
  const proposalComment = proposalStatus?.documents.proposal[0]?.comment || "";

  if (
    isLoadingExamStatus ||
    isLoadingProposalDeadline ||
    isLoadingPassingDate
  ) {
    return (
      <div className="min-h-screen w-full bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-8 text-center text-3xl font-bold text-gray-900">
            PhD Proposal Submission
          </h1>
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-center text-lg">
              You are not eligible to submit your proposal yet
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 text-center text-3xl font-bold text-gray-900">
          PhD Qualifying Exam Status
        </h1>

        <div className="mb-8 overflow-hidden rounded-lg bg-white p-6 shadow">
          {isLoadingExamStatus ? (
            <LoadingSpinner className="mx-auto" />
          ) : examError ? (
            <div className="rounded-md bg-red-50 p-4 text-red-700">
              An error occurred while retrieving your exam status. Please try
              again later.
            </div>
          ) : !examData?.success ? (
            <div className="rounded-md bg-red-50 p-4 text-red-700">
              {examData?.status || "Failed to retrieve exam status"}
            </div>
          ) : examData.status === "pending" ? (
            <div className="rounded-md bg-yellow-50 p-4 text-yellow-700">
              Your qualifying exam results have not been finalized yet.
            </div>
          ) : (
            <ExamStatusList
              status={examData.status === "pass" ? "Pass" : "Fail"}
            />
          )}
        </div>

        {examData?.success && examData.status === "pass" && (
          <div className="mb-8 overflow-hidden rounded-lg bg-white p-6 shadow">
            <h2 className="mb-6 text-xl font-semibold">Proposal Submission</h2>
            <div className="flex flex-col gap-6">
              {isLoadingProposalDeadline ? (
                <LoadingSpinner className="mx-auto" />
              ) : proposalDeadline?.deadline ? (
                <ExamDateDisplay
                  examDate={proposalDeadline.deadline}
                  title="Proposal Document Submission Deadline"
                />
              ) : (
                <div className="rounded-md bg-blue-50 p-4 text-blue-700">
                  No proposal submission deadline has been set yet.
                </div>
              )}

              {isLoadingPassingDate ? (
                <LoadingSpinner className="mx-auto" />
              ) : passingDate?.qualificationDate ? (
                <ExamDateDisplay
                  examDate={passingDate.qualificationDate}
                  title="Qualifying Exam Passing Date"
                />
              ) : (
                <div className="rounded-md bg-blue-50 p-4 text-blue-700">
                  No qualifying exam passing date has been recorded yet.
                </div>
              )}

              {showProposalSubmissionForm && (
                <div className="mt-4">
                  <ProposalSubmissionForm />
                </div>
              )}
            </div>
          </div>
        )}

        {proposalStatusValue === "approved" && (
          <div className="overflow-hidden rounded-lg bg-white p-6 text-center shadow">
            <h2 className="text-xl font-semibold text-green-600">
              Proposal Approved
            </h2>
            {proposalComment && (
              <p className="mt-4 text-gray-600">Comment: {proposalComment}</p>
            )}
          </div>
        )}

        {proposalStatusValue === "rejected" && showProposalSubmissionForm && (
          <div className="overflow-hidden rounded-lg bg-white p-6 shadow">
            <h2 className="text-center text-xl font-semibold text-red-600">
              Proposal Rejected
            </h2>
            <p className="mt-4 text-center text-gray-600">
              Your previous proposal was rejected. Please resubmit.
            </p>
            {proposalComment && (
              <p className="mt-2 text-center text-gray-600">
                Feedback: {proposalComment}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
