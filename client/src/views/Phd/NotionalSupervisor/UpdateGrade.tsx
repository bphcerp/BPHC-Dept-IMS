import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { LoadingSpinner } from "@/components/ui/spinner";
import { CourseList } from "@/components/phd/CourseList";
import { AddCourseForm } from "@/components/phd/AddCourseForm";
import { Button } from "@/components/ui/button";
import { Course } from "@/components/phd/CourseList";
interface PhdStudent {
  name: string;
  email: string;
}

const UpdateGrade: React.FC = () => {
  const [selected, setSelected] = React.useState<PhdStudent | null>(null);
  const { data: students, isFetching: isStudentsFetching } = useQuery({
    queryKey: ["phd-students"],
    queryFn: async () => {
      const response = await api.get<{ phdRecords: PhdStudent[] }>(
        "/phd/notionalSupervisor/getPhd"
      );
      console.log(response.data);
      return response.data?.phdRecords;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });

  const { data: studentDetails, isFetching } = useQuery({
    queryKey: ["phd-student-details", selected?.email],
    queryFn: async () => {
      if (!selected) return null;
      const response = await api.get<{ courses: Course[] }>(
        `/phd/notionalSupervisor/getPhdCourseDetails`,
        { params: { studentEmail: selected.email } }
      );
      console.log(response.data);
      return response.data?.courses;
    },
    enabled: !!selected, // Only fetch when a student is selected
  });

  return (
    <div className="min-h-screen w-full bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      {selected ? (
        <div className="min-h-screen bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl space-y-8">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900">
                Student Courses
              </h1>
              <Button onClick={() => setSelected(null)} variant="outline">
                Back
              </Button>
            </div>
            <div className="bg-white p-6 shadow sm:rounded-lg">
              <h2 className="mb-4 text-xl font-semibold">Current Courses</h2>
              {isFetching ? (
                <LoadingSpinner className="mx-auto" />
              ) : studentDetails && studentDetails.length > 0 ? (
                <CourseList
                  courses={studentDetails}
                  studentEmail={selected.email}
                />
              ) : (
                <p className="text-center text-gray-500">No courses taken</p>
              )}
            </div>
            <div className="bg-white p-6 shadow sm:rounded-lg">
              <h2 className="mb-4 text-xl font-semibold">Add New Course</h2>
              <AddCourseForm studentEmail={selected.email} />
            </div>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-8 text-center text-3xl font-bold text-gray-900">
            PhD Students
          </h1>
          {isStudentsFetching ? (
            <LoadingSpinner className="mx-auto" />
          ) : (
            <div></div>
          )}
          {students && students.length > 0 ? (
            <ul className="overflow-hidden bg-white shadow hover:cursor-pointer sm:rounded-xl">
              {students.map((student, index) => (
                <li
                  key={index}
                  className={index > 0 ? "border-t border-gray-200" : ""}
                  onClick={() => setSelected(student)}
                >
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-xl font-medium leading-6 text-gray-900">
                      {student.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {student.email}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-500">
              No PhD students under your supervision
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default UpdateGrade;
