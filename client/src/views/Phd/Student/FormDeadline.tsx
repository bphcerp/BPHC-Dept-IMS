import api from "@/lib/axios-instance";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import ExamForm from "@/components/phd/QualifyingExamForm";
import ExamDateDisplay from "@/components/phd/ExamDateDisplay";
import { AxiosError } from "axios";

interface Exam {
  id: number;
  examName: string;
  deadline: string;
  examStartDate: string;
  examEndDate: string;
  vivaDate?: string;
  semesterYear?: string;
  semesterNumber?: number;
}

interface BackendResponse {
  success: boolean;
  exams: Exam[];
}

interface GradeStatusResponse {
  allCoursesGraded: boolean;
  totalCourses: number;
  gradedCourses: number;
}

interface QeApplicationResponse {
  success: boolean;
  nextQeApplicationNumber: number;
}

interface QualifyingExamStatusResponse {
  success: boolean;
  status: string;
}

interface AxiosErrorResponse {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
}

const FormDeadline: React.FC = () => {
  // Fetch exam deadlines
  const { data: examData, isLoading: isExamLoading } = useQuery<
    BackendResponse,
    Error
  >({
    queryKey: ["get-qualifying-exam-deadline"],
    queryFn: async () => {
      try {
        const response = await api.get<BackendResponse>(
          "/phd/student/getQualifyingExamDeadLine",
          {
            params: {
              name: "Regular Qualifying Exam",
            },
          }
        );
        return response.data;
      } catch (err) {
        console.error("Error fetching exam deadline:", err);
        throw err;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch grade status
  const { data: gradeStatusData, isLoading: isGradeStatusLoading } = useQuery<
    GradeStatusResponse & { noCourseFound?: boolean },
    Error
  >({
    queryKey: ["get-grade-status"],
    queryFn: async () => {
      try {
        const response = await api.get<GradeStatusResponse>(
          "/phd/student/getGradeStatus"
        );
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<unknown, AxiosErrorResponse>;
        if (axiosError.response?.status === 404) {
          // Custom handling for 404 (Not Found) error
          return {
            allCoursesGraded: false,
            totalCourses: 0,
            gradedCourses: 0,
            noCourseFound: true,
          };
        }
        throw error;
      }
    },
    refetchOnWindowFocus: false,
  });

  // Fetch QE application number
  const { data: qeApplicationData, isLoading: isQeApplicationLoading } =
    useQuery<QeApplicationResponse, Error>({
      queryKey: ["get-qe-application-number"],
      queryFn: async () => {
        try {
          const response = await api.get<QeApplicationResponse>(
            "/phd/student/getNoOfQeApplication"
          );
          return response.data;
        } catch (error) {
          const axiosError = error as AxiosError<AxiosErrorResponse>;
          if (
            axiosError.response?.status === 400 &&
            (
              axiosError.response.data as { message?: string }
            )?.message?.includes("Maximum number")
          ) {
            // When student has reached max attempts
            return {
              success: false,
              nextQeApplicationNumber: 3, // Indicating max reached
            };
          }
          throw error;
        }
      },
      refetchOnWindowFocus: false,
    });

  // Fetch qualifying exam status
  const {
    data: qualifyingExamStatusData,
    isLoading: isQualifyingExamStatusLoading,
  } = useQuery<QualifyingExamStatusResponse, Error>({
    queryKey: ["get-qualifying-exam-status"],
    queryFn: async () => {
      const response = await api.get<QualifyingExamStatusResponse>(
        "/phd/student/getQualifyingExamStatus"
      );
      return response.data;
    },
    refetchOnWindowFocus: false,
  });

  // Determine if exam form should be shown
  const shouldShowExamForm = (() => {
    // Check if grades are complete
    const gradeCheck = gradeStatusData?.allCoursesGraded === true;

    // Check if within allowed application attempts (1 or 2)
    const qeApplicationCheck =
      qeApplicationData?.nextQeApplicationNumber === 1 ||
      qeApplicationData?.nextQeApplicationNumber === 2;

    // Check exam status - can only apply if pending or failed
    const qualifyingExamStatusCheck =
      qualifyingExamStatusData?.status === "fail" ||
      qualifyingExamStatusData?.status === "pending";

    // Student must meet all criteria
    return gradeCheck && qeApplicationCheck && qualifyingExamStatusCheck;
  })();

  // Loading state
  if (
    isExamLoading ||
    isGradeStatusLoading ||
    isQeApplicationLoading ||
    isQualifyingExamStatusLoading
  ) {
    return (
      <div className="min-h-screen w-full bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-8 text-center text-3xl font-bold text-gray-900">
            Qualifying Exam Registration
          </h1>
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-center text-lg">Loading application status...</p>
          </div>
        </div>
      </div>
    );
  }

  // No active exam deadlines
  if (!examData?.exams || examData.exams.length === 0) {
    return (
      <div className="min-h-screen w-full bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-8 text-center text-3xl font-bold text-gray-900">
            Qualifying Exam Registration
          </h1>
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-center text-lg">
              There are currently no active qualifying exam deadlines.
            </p>
            <p className="mt-2 text-center text-gray-500">
              Registration will open when the next exam deadline is announced.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen w-full bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-center text-3xl font-bold">
        Qualifying Exam Registration
      </h1>

      <div className="flex flex-col gap-8">
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <ExamDateDisplay
            examDate={examData.exams[0].deadline}
            title={`Registration Deadline: ${examData.exams[0].examName}`}
          />
        </div>

        {gradeStatusData && "noCourseFound" in gradeStatusData && (
          <div className="rounded-lg bg-yellow-100 p-6 shadow">
            <p className="text-center text-lg text-yellow-800">
              Your notional supervisor has not added any courses for you yet.
            </p>
            <p className="mt-2 text-center text-yellow-600">
              Please contact your supervisor to update your course information.
            </p>
          </div>
        )}

        {/* Show attempt number information */}
        {qeApplicationData && (
          <div className="rounded-lg bg-blue-50 p-4 shadow">
            <p className="text-center text-blue-800">
              {qeApplicationData.nextQeApplicationNumber > 2
                ? "You have used all your qualifying exam attempts."
                : `This will be your attempt #${
                    qeApplicationData.nextQeApplicationNumber < 3 ? 1 : 2
                  } out of 2 allowed attempts.`}
            </p>
          </div>
        )}

        {shouldShowExamForm ? (
          <div className="overflow-hidden rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">
              Exam Application Form
            </h2>
            <p className="mb-6">
              Please complete the registration form below before the deadline.
            </p>
            <ExamForm exam={examData.exams[0]} />
          </div>
        ) : (
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-center text-lg">
              You are not eligible to register for the Qualifying Exam at this
              time.
            </p>
            <div className="mt-4 space-y-2 text-center text-gray-500">
              <h3 className="font-semibold">Eligibility Requirements:</h3>
              <div>
                <span className="font-medium">Course Completion: </span>
                {gradeStatusData?.allCoursesGraded ? (
                  <span className="text-green-600">✓ Complete</span>
                ) : (
                  <span className="text-red-600">✗ Incomplete</span>
                )}
                {!gradeStatusData?.allCoursesGraded && (
                  <p className="text-sm text-red-500">
                    ({gradeStatusData?.gradedCourses} of{" "}
                    {gradeStatusData?.totalCourses} courses graded)
                  </p>
                )}
              </div>
              <div>
                <span className="font-medium">Application Limit: </span>
                {(qeApplicationData?.nextQeApplicationNumber ?? 0) <= 2 ? (
                  <span className="text-green-600">✓ Available</span>
                ) : (
                  <span className="text-red-600">
                    ✗ Maximum attempts reached
                  </span>
                )}
              </div>
              <div>
                <span className="font-medium">Current Status: </span>
                {qualifyingExamStatusData?.status === "pass" ? (
                  <span className="text-green-600">✓ Already Passed</span>
                ) : (
                  <span>{qualifyingExamStatusData?.status}</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default FormDeadline;
