import api from "@/lib/axios-instance";
import { useQuery } from "@tanstack/react-query";
import React, { useEffect } from "react";
import ExamForm from "@/components/phd/QualifyingExamForm";
import ExamDateDisplay from "@/components/phd/ExamDateDisplay";

import { AxiosError } from "axios";

interface Exam {
  id: number;
  examName: string;
  deadline: string;
  semesterYear?: number;
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
  const {
    data: gradeStatusData,
    isLoading: isGradeStatusLoading,
    error: gradeStatusError,
  } = useQuery<GradeStatusResponse, Error>({
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
  const {
    data: qeApplicationData,
    isLoading: isQeApplicationLoading,
    error: qeApplicationError,
  } = useQuery<QeApplicationResponse, Error>({
    queryKey: ["get-qe-application-number"],
    queryFn: async () => {
      const response = await api.get<QeApplicationResponse>(
        "/phd/student/getNoOfQeApplication"
      );
      return response.data;
    },
    refetchOnWindowFocus: false,
  });

  // Fetch qualifying exam status
  const {
    data: qualifyingExamStatusData,
    isLoading: isQualifyingExamStatusLoading,
    error: qualifyingExamStatusError,
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

  // Debug logging
  useEffect(() => {
    console.log("Debug - Grade Status:", {
      allCoursesGraded: gradeStatusData?.allCoursesGraded,
      totalCourses: gradeStatusData?.totalCourses,
      gradedCourses: gradeStatusData?.gradedCourses,
      gradeStatusError: gradeStatusError,
    });

    console.log("Debug - QE Application:", {
      nextQeApplicationNumber: qeApplicationData?.nextQeApplicationNumber,
      qeApplicationError: qeApplicationError,
    });

    console.log("Debug - Qualifying Exam Status:", {
      status: qualifyingExamStatusData?.status,
      qualifyingExamStatusError: qualifyingExamStatusError,
    });
  }, [
    gradeStatusData,
    qeApplicationData,
    qualifyingExamStatusData,
    gradeStatusError,
    qeApplicationError,
    qualifyingExamStatusError,
  ]);

  // Determine if exam form should be shown with detailed logging
  const shouldShowExamForm = (() => {
    const gradeCheck = gradeStatusData?.allCoursesGraded === true;
    const qeApplicationCheck =
      qeApplicationData?.nextQeApplicationNumber === 1 ||
      qeApplicationData?.nextQeApplicationNumber === 2;
    const qualifyingExamStatusCheck =
      qualifyingExamStatusData?.status === "fail" ||
      qualifyingExamStatusData?.status === "pending";

    console.log("Debug - Exam Form Conditions:", {
      gradeCheck,
      qeApplicationCheck,
      qualifyingExamStatusCheck,
    });

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
        {examData?.exams && examData.exams.length > 0 ? (
          <>
            <div className="overflow-hidden rounded-lg bg-white shadow">
              <ExamDateDisplay
                examDate={examData.exams[0].deadline}
                title={`Registration Deadline: ${examData.exams[0].examName}`}
              />
            </div>

            {gradeStatusData && "noCourseFound" in gradeStatusData && (
              <div className="rounded-lg bg-yellow-100 p-6 shadow">
                <p className="text-center text-lg text-yellow-800">
                  Your notional supervisor has not added any courses for you
                  yet.
                </p>
                <p className="mt-2 text-center text-yellow-600">
                  Please contact your supervisor to update your course
                  information.
                </p>
              </div>
            )}
            {shouldShowExamForm ? (
              <div className="overflow-hidden rounded-lg bg-white p-6 shadow">
                <h2 className="mb-4 text-xl font-semibold">
                  Exam Registration
                </h2>
                <p className="mb-6">
                  Please complete the registration form below before the
                  deadline.
                  <ExamForm />
                </p>
              </div>
            ) : (
              <div className="rounded-lg bg-white p-6 shadow">
                <p className="text-center text-lg">
                  You are not eligible to register for the Qualifying Exam at
                  this time.
                </p>
                <div className="mt-2 space-y-2 text-center text-gray-500">
                  <h3 className="font-semibold">Detailed Eligibility Check:</h3>
                  <div>
                    Courses Graded:{" "}
                    {gradeStatusData?.allCoursesGraded ? "✓" : "✗"}
                    {!gradeStatusData?.allCoursesGraded && (
                      <p className="text-red-500">
                        Total Courses: {gradeStatusData?.totalCourses}, Graded
                        Courses: {gradeStatusData?.gradedCourses}
                      </p>
                    )}
                  </div>
                  <div>
                    QE Application Number:{" "}
                    {qeApplicationData?.nextQeApplicationNumber}
                    {qeApplicationData?.nextQeApplicationNumber === 3 && (
                      <p className="text-red-500">Maximum attempts reached</p>
                    )}
                  </div>
                  <div>
                    Qualifying Exam Status: {qualifyingExamStatusData?.status}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div></div>
        )}
      </div>
    </main>
  );
};

export default FormDeadline;
