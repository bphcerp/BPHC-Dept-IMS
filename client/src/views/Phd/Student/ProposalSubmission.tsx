import api from "@/lib/axios-instance";
import { useQuery } from "@tanstack/react-query";
import ExamDateDisplay from "@/components/phd/ExamDateDisplay";
import ProposalSubmissionForm from "@/components/phd/ProposalSubmissionForm";
const ProposalSubmission: React.FC = () => {
  const { data, isFetching } = useQuery({
    queryKey: ["phd-student-exams"],
    queryFn: async () => {
      const response = await api.get<{ status: any }>(
        "/phd/student/getQualifyingExamStatus"
      );
      console.log(response.data);
      return response.data?.status;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });

  const { data: proposalDeadline, isFetching: isFetchingProposalDeadline } =
    useQuery({
      queryKey: ["phd-students"],
      queryFn: async () => {
        const response = await api.get<{ deadline: string }>(
          "/phd/student/getProposalDeadline"
        );
        console.log(response.data);
        return response.data;
      },
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    });

  const { data: passingDate, isFetching: isFetchingPassingDate } = useQuery({
    queryKey: ["phd-qualifying-exam-passing-date"],
    queryFn: async () => {
      const response = await api.get<{
        email: string;
        qualificationDate: string;
      }>("/phd/student/getQualifyingExamPassingDate");
      console.log(response.data);
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });

  return (
    <main className="min-h-screen w-full bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-center text-3xl font-bold">
        Proposal Submission
      </h1>
      {data == "pass" ? (
        <div></div>
      ) : (
        <div>Not applicable for proposal submission.</div>
      )}
      <div className="flex flex-col gap-8">
        {isFetchingProposalDeadline && <p>Loading...</p>}
        {proposalDeadline?.deadline ? (
          <ExamDateDisplay
            examDate={proposalDeadline?.deadline}
            title="Proposal Document Submission Deadline"
          />
        ) : (
          <span>No Deadline has been set yet</span>
        )}
        {isFetchingPassingDate && <p>Loading...</p>}
        {passingDate?.qualificationDate ? (
          <ExamDateDisplay
            examDate={passingDate?.qualificationDate}
            title="Qualifying Exam Passing Date"
          />
        ) : (
          <span>No Passing Date has been set yet</span>
        )}
        <ProposalSubmissionForm />
      </div>
    </main>
  );
};

export default ProposalSubmission;
