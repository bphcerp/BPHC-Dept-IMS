import api from "@/lib/axios-instance";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import ExamForm from "@/components/phd/QualifyingExamForm";
import ExamDateDisplay from "@/components/phd/ExamDateDisplay";
const FormDeadline: React.FC = () => {
  const formDeadlineOld = new Date("2022-12-31T23:59:59");
  const { data: formDeadline, isFetching } = useQuery({
    queryKey: ["phd-students"],
    queryFn: async () => {
      const response = await api.get<{ deadline: string }>(
        "/phd/student/getQualifyingExamDeadLine"
      );
      console.log(response.data);
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });

  return (
    <main className="min-h-screen w-full bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-center text-3xl font-bold">
        Qualifying Exam Form Deadline
      </h1>

      <div className="flex flex-col gap-8">
        {isFetching && <p>Loading...</p>}
        {formDeadline?.deadline ? (
          <ExamDateDisplay examDate={formDeadline?.deadline} />
        ) : (
          <span>No Deadline has been set yet</span>
        )}
        {formDeadline?.deadline ? (
          <div>
            <h2 className="mb-4 text-xl font-semibold">Exam Registration</h2>
            <p className="mb-6">
              Please fill out the form below to register for the exam. You can
              also access the
              <a
                href="https://www.bits-pilani.ac.in/wp-content/uploads/1.-Format-for-application-to-DRC-for-Ph.D-Qualifying-Examination.pdf"
                className="mx-1 font-medium text-blue-600 hover:underline"
              >
                external registration form
              </a>
              if needed.
            </p>

            <ExamForm />
          </div>
        ) : (
          <span>Registration is closed</span>
        )}
      </div>
    </main>
  );
};

export default FormDeadline;
