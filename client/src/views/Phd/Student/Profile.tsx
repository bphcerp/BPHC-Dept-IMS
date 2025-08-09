import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { LoadingSpinner } from "@/components/ui/spinner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

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
  qualificationDate: string | null;
  courses: Course[];
}

interface ApplicationHistory {
    applicationId: number;
    examEventName: string;
    attemptNumber: number;
    status: string;
    appliedAt: string;
    results: {
        subArea: string;
        passed: boolean;
        comments: string | null;
    }[];
}

const StudentProfile: React.FC = () => {
  const { data: profileData, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["student-profile"],
    queryFn: async () => {
      const response = await api.get<{
        success: boolean;
        student: StudentProfile;
      }>("/phd/student/getProfileDetails");
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });

  const { data: applicationsData, isLoading: isLoadingApplications } = useQuery({
    queryKey: ["student-applications"],
    queryFn: async () => {
        const response = await api.get<{
            success: boolean;
            applications: ApplicationHistory[];
        }>("/phd/student/applications");
        return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });

  const isLoading = isLoadingProfile || isLoadingApplications;

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center">
        <LoadingSpinner className="h-10 w-10" />
        <p className="mt-4 text-gray-500">Loading profile data...</p>
      </div>
    );
  }

  if (!profileData?.success || !profileData.student) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
        <Card className="w-full max-w-4xl">
          <CardContent className="p-6">
            <p className="text-center text-gray-500">
              No profile data available
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const student = profileData.student;
  const applications = applicationsData?.applications || [];

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-5xl space-y-8">
        <h1 className="text-center text-3xl font-bold">My Profile</h1>

        {/* Personal Information */}
        <Card>
            <CardHeader> <CardTitle className="text-xl font-semibold"> Personal Information </CardTitle> </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                        <div className="flex justify-between"> <span className="font-medium text-gray-500">Name</span> <span>{student.name}</span> </div>
                        <div className="flex justify-between"> <span className="font-medium text-gray-500">Email</span> <span>{student.email}</span> </div>
                        <div className="flex justify-between"> <span className="font-medium text-gray-500"> Institute Email </span> <span>{student.instituteEmail || "N/A"}</span> </div>
                        <div className="flex justify-between"> <span className="font-medium text-gray-500"> Personal Email </span> <span>{student.personalEmail || "N/A"}</span> </div>
                        <div className="flex justify-between"> <span className="font-medium text-gray-500">Department</span> <span>{student.department || "N/A"}</span> </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between"> <span className="font-medium text-gray-500">Phone</span> <span>{student.phone || "N/A"}</span> </div>
                        <div className="flex justify-between"> <span className="font-medium text-gray-500">Mobile</span> <span>{student.mobile || "N/A"}</span> </div>
                        <div className="flex justify-between"> <span className="font-medium text-gray-500">ID Number</span> <span>{student.idNumber || "N/A"}</span> </div>
                        <div className="flex justify-between"> <span className="font-medium text-gray-500">ERP ID</span> <span>{student.erpId || "N/A"}</span> </div>
                        <div className="flex justify-between"> <span className="font-medium text-gray-500"> Nature of PhD </span> <span>{student.natureOfPhD || "N/A"}</span> </div>
                    </div>
                </div>
            </CardContent>
        </Card>
        
        {/* Academic Information */}
        <Card>
            <CardHeader> <CardTitle className="text-xl font-semibold"> Academic Information </CardTitle> </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                        <div className="flex justify-between"> <span className="font-medium text-gray-500"> Notional Supervisor </span> <span>{student.notionalSupervisorEmail || "Not Assigned"}</span> </div>
                        <div className="flex justify-between"> <span className="font-medium text-gray-500">Supervisor</span> <span>{student.supervisorEmail || "Not Assigned"}</span> </div>
                        <div className="flex justify-between"> <span className="font-medium text-gray-500"> Co-Supervisor </span> <span>{student.coSupervisorEmail || "Not Assigned"}</span> </div>
                        <div className="flex justify-between"> <span className="font-medium text-gray-500"> Co-Supervisor 2 </span> <span>{student.coSupervisorEmail2 || "Not Assigned"}</span> </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between"> <span className="font-medium text-gray-500"> DAC Member 1 </span> <span>{student.dac1Email || "Not Assigned"}</span> </div>
                        <div className="flex justify-between"> <span className="font-medium text-gray-500"> DAC Member 2 </span> <span>{student.dac2Email || "Not Assigned"}</span> </div>
                        <div className="flex justify-between"> <span className="font-medium text-gray-500"> Qualification Date </span> <span>{student.qualificationDate ? new Date(student.qualificationDate).toLocaleDateString() : "Not Qualified Yet"}</span> </div>
                    </div>
                </div>
            </CardContent>
        </Card>
        
        {/* QE History */}
        <Card>
            <CardHeader>
                <CardTitle className="text-xl font-semibold">Qualifying Exam History</CardTitle>
            </CardHeader>
            <CardContent>
                {applications.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Exam Event</TableHead>
                                <TableHead>Attempt</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Applied On</TableHead>
                                <TableHead>Results</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {applications.map(app => (
                                <TableRow key={app.applicationId}>
                                    <TableCell>{app.examEventName}</TableCell>
                                    <TableCell>{app.attemptNumber}</TableCell>
                                    <TableCell><Badge>{app.status}</Badge></TableCell>
                                    <TableCell>{format(new Date(app.appliedAt), "PPP")}</TableCell>
                                    <TableCell>
                                        {app.results.length > 0 ? (
                                            <ul className="list-disc pl-4">
                                                {app.results.map(res => (
                                                    <li key={res.subArea}>
                                                        {res.subArea}: <span className={res.passed ? "text-green-600" : "text-red-600"}>{res.passed ? "Pass" : "Fail"}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : "Pending"}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <p className="py-4 text-center text-gray-500">No qualifying exam applications found.</p>
                )}
            </CardContent>
        </Card>

        {/* Courses */}
        <Card>
            <CardHeader> <CardTitle className="text-xl font-semibold"> Courses and Grades </CardTitle> </CardHeader>
            <CardContent>
                {student.courses && student.courses.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Course ID</TableHead>
                                <TableHead>Course Name</TableHead>
                                <TableHead className="text-center">Units</TableHead>
                                <TableHead className="text-center">Grade</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {student.courses.map((course, index) => (
                                <TableRow key={index}>
                                    <TableCell>{course.courseId || "N/A"}</TableCell>
                                    <TableCell>{course.courseName}</TableCell>
                                    <TableCell className="text-center">{course.courseUnits || "N/A"}</TableCell>
                                    <TableCell className="text-center">{course.courseGrade || "N/A"}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <p className="py-4 text-center text-gray-500">No courses taken yet</p>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentProfile;