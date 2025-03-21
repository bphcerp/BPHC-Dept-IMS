import { ExamStatusList } from "@/components/phd/ExamStatusList";
import ExamDateDisplay from "@/components/phd/ExamDateDisplay";
import ProposalSubmissionForm from "@/components/phd/ProposalSubmissionForm";
import api from "@/lib/axios-instance";
import { useQuery } from "@tanstack/react-query";

export default function CombinedExamAndProposalPage() {
  // Get exam status
  const { 
    data: examData, 
    isLoading: isLoadingExamStatus, 
    error: examError 
  } = useQuery({
    queryKey: ["phd-student-exams"],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; status: string }>(
        "/phd/student/getQualifyingExamStatus"
      );
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });

  // Get proposal deadline - only needed if exam is passed
  const { data: proposalDeadline, isLoading: isLoadingProposalDeadline } = useQuery({
    queryKey: ["phd-students"],
    queryFn: async () => {
      const response = await api.get<{ deadline: string }>(
        "/phd/student/getProposalDeadline"
      );
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
    enabled: examData?.status === "pass", // Only fetch if exam is passed
  });

  // Get passing date - only needed if exam is passed
  const { data: passingDate, isLoading: isLoadingPassingDate } = useQuery({
    queryKey: ["phd-qualifying-exam-passing-date"],
    queryFn: async () => {
      const response = await api.get<{
        email: string;
        qualificationDate: string;
      }>("/phd/student/getQualifyingExamPassingDate");
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
    enabled: examData?.status === "pass", // Only fetch if exam is passed
  });

  return (
    <main className="min-h-screen w-full bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-center text-3xl font-bold">
          PhD Qualifying Exam Status
        </h1>
        
        {/* Exam Status Section */}
        <div className="mb-10 rounded-lg bg-white p-6 shadow-md">
          {isLoadingExamStatus ? (
            <div className="text-center">Loading your exam status...</div>
          ) : examError ? (
            <div className="rounded-md bg-red-50 p-4 text-red-700">
              An error occurred while retrieving your exam status. Please try again later.
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
            <ExamStatusList status={examData.status === "pass" ? "Pass" : "Fail"} />
          )}
        </div>
        
        {/* Proposal Submission Section - Only shown if exam is passed */}
        {examData?.success && examData.status === "pass" && (
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-6 text-2xl font-semibold">Proposal Submission</h2>
            
            <div className="flex flex-col gap-8">
              {isLoadingProposalDeadline ? (
                <p>Loading deadline information...</p>
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
                <p>Loading qualifying exam passing date...</p>
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
              
              <ProposalSubmissionForm />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}