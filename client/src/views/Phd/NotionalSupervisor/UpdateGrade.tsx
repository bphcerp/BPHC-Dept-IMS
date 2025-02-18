import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { LoadingSpinner } from "@/components/ui/spinner";
import { CourseList } from "@/components/phd/CourseList";
import { AddCourseForm } from "@/components/phd/AddCourseForm";
import { Button } from "@/components/ui/button";
interface PhdStudent {
  name: string;
  email: string;
}
const UpdateGrade: React.FC = () => {
  const [selected, setSelected] = React.useState<PhdStudent | null>(null);
  const { data: students, isFetching } = useQuery({
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
  interface Course {
    id: string;
    name: string;
    units: number;
    grade: string;
  }
  const initialCourses: Course[] = [
    {
      id: "CS101",
      name: "Introduction to Computer Science",
      units: 3,
      grade: "A",
    },
    { id: "MATH201", name: "Linear Algebra", units: 4, grade: "B+" },
    { id: "PHYS101", name: "Physics I", units: 4, grade: "A-" },
  ];
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
              <CourseList courses={initialCourses} />
            </div>
            <div className="bg-white p-6 shadow sm:rounded-lg">
              <h2 className="mb-4 text-xl font-semibold">Add New Course</h2>
              <AddCourseForm />
            </div>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-8 text-center text-3xl font-bold text-gray-900">
            PhD Students
          </h1>
          {isFetching ? <LoadingSpinner className="mx-auto" /> : <div></div>}
          {students && (
            <ul className="overflow-hidden bg-white shadow hover:cursor-pointer sm:rounded-xl">
              {students?.map((student, index) => (
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
          )}
        </div>
      )}
    </div>
  );
};

export default UpdateGrade;
