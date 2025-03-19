import { ExamStatusList } from "@/components/phd/ExamStatusList";
import api from "@/lib/axios-instance";
import { useQuery } from "@tanstack/react-query";

export default function AnotherExamplePage() {
  const { data } = useQuery({
    queryKey: ["phd-student-exams"],
    queryFn: async () => {
      const response = await api.get<{ status: string }>(
        "/phd/student/getQualifyingExamStatus"
      );
      console.log(response.data);
      return response.data?.status;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-gray-100 p-4 md:p-24">
      <div className="w-full max-w-2xl">
        <h1 className="mb-8 text-center text-3xl font-bold">Exam Status</h1>
        {data == "pass" || data == "fail" ? (
          <ExamStatusList status={data === "pass" ? "Pass" : "Fail"} />
        ) : (
          <div>No result has been set yet.</div>
        )}
      </div>
    </main>
  );
}
