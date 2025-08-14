// src/views/Phd/Student/Profile.tsx
import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { LoadingSpinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Course {
  courseName: string;
  courseGrade: string;
  courseUnits: number;
  courseId: string;
}

interface StudentProfile {
  name: string;
  email: string;
  department: string;
  phone: string;
  idNumber: string;
  erpId: string;
  instituteEmail: string;
  mobile: string;
  personalEmail: string;
  notionalSupervisorEmail: string | null;
  supervisorEmail: string | null;
  coSupervisorEmail: string | null;
  coSupervisorEmail2: string | null;
  dac1Email: string | null;
  dac2Email: string | null;
  natureOfPhD: string | null;
  qualifyingExam1: boolean | null;
  qualifyingExam2: boolean | null;
  qualifyingArea1: string | null;
  qualifyingArea2: string | null;
  numberOfQeApplication: number | null;
  qualificationDate: string | null;
  courses: Course[];
}

const StudentProfile: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["student-profile"],
    queryFn: async () => {
      const response = await api.get<{
        success: boolean;
        student: StudentProfile;
      }>("/phd/student/getProfileDetails");
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner className="h-10 w-10" />
          <p className="ml-4 text-gray-500">Loading profile data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardContent className="p-12">
              <div className="text-center">
                <div className="text-red-500 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Profile</h3>
                <p className="text-gray-500">{(error as Error).message}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!data?.success || !data.student) {
    return (
      <div className="min-h-screen w-full bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardContent className="p-12">
              <div className="text-center">
                <div className="text-gray-500 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Profile Data</h3>
                <p className="text-gray-500">No profile data available</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const student = data.student;

  return (
    <div className="min-h-screen w-full bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="mt-2 text-gray-600">View your academic and personal information</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-700">Name</span>
                  <span className="text-gray-900">{student.name}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-700">Email</span>
                  <span className="text-gray-900">{student.email}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-700">Institute Email</span>
                  <span className="text-gray-900">{student.instituteEmail || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-700">Personal Email</span>
                  <span className="text-gray-900">{student.personalEmail || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-700">Department</span>
                  <span className="text-gray-900">{student.department || "N/A"}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-700">Phone</span>
                  <span className="text-gray-900">{student.phone || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-700">Mobile</span>
                  <span className="text-gray-900">{student.mobile || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-700">ID Number</span>
                  <span className="text-gray-900">{student.idNumber || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-700">ERP ID</span>
                  <span className="text-gray-900">{student.erpId || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-700">Nature of PhD</span>
                  <span className="text-gray-900">{student.natureOfPhD || "N/A"}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Academic Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-700">Notional Supervisor</span>
                  <span className="text-gray-900">{student.notionalSupervisorEmail || "Not Assigned"}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-700">Supervisor</span>
                  <span className="text-gray-900">{student.supervisorEmail || "Not Assigned"}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-700">Co-Supervisor</span>
                  <span className="text-gray-900">{student.coSupervisorEmail || "Not Assigned"}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-700">Co-Supervisor 2</span>
                  <span className="text-gray-900">{student.coSupervisorEmail2 || "Not Assigned"}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-700">DAC Member 1</span>
                  <span className="text-gray-900">{student.dac1Email || "Not Assigned"}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-700">DAC Member 2</span>
                  <span className="text-gray-900">{student.dac2Email || "Not Assigned"}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-700">Number of QE Attempts</span>
                  <span className="text-gray-900">{student.numberOfQeApplication || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-700">Qualification Date</span>
                  <span className="text-gray-900">
                    {student.qualificationDate
                      ? new Date(student.qualificationDate).toLocaleDateString()
                      : "Not Qualified Yet"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Qualifying Exam Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-700">Qualifying Area 1</span>
                  <span className="text-gray-900">{student.qualifyingArea1 || "Not Selected"}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-700">Exam 1 Status</span>
                  <span>
                    {student.qualifyingExam1 === null ? (
                      <Badge variant="secondary">Not Attempted</Badge>
                    ) : (
                      <Badge className={student.qualifyingExam1 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {student.qualifyingExam1 ? "Passed" : "Failed"}
                      </Badge>
                    )}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-700">Qualifying Area 2</span>
                  <span className="text-gray-900">{student.qualifyingArea2 || "Not Selected"}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-700">Exam 2 Status</span>
                  <span>
                    {student.qualifyingExam2 === null ? (
                      <Badge variant="secondary">Not Attempted</Badge>
                    ) : (
                      <Badge className={student.qualifyingExam2 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {student.qualifyingExam2 ? "Passed" : "Failed"}
                      </Badge>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Courses and Grades</CardTitle>
          </CardHeader>
          <CardContent>
            {student.courses && student.courses.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-medium text-gray-700">Course ID</TableHead>
                    <TableHead className="font-medium text-gray-700">Course Name</TableHead>
                    <TableHead className="text-center font-medium text-gray-700">Units</TableHead>
                    <TableHead className="text-center font-medium text-gray-700">Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {student.courses.map((course, index) => (
                    <TableRow key={index} className="hover:bg-gray-50">
                      <TableCell className="text-gray-900">{course.courseId || "N/A"}</TableCell>
                      <TableCell className="text-gray-900">{course.courseName}</TableCell>
                      <TableCell className="text-center text-gray-900">
                        {course.courseUnits || "N/A"}
                      </TableCell>
                      <TableCell className="text-center text-gray-900">
                        {course.courseGrade || "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-500 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Courses Taken</h3>
                <p className="text-gray-500">No courses taken yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentProfile;
