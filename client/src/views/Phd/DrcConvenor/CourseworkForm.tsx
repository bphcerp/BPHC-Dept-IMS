import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { phdSchemas } from "lib";
import { LoadingSpinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface IPhdCourseworkQuery {
  success: boolean;
  formData: {
    name: string;
    email: string;
    courses: {
      name: string;
      units: string;
    }[];
  }[];
  formLink: string;
}



const StudentsSittingForQualifyingExam: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["phd-students-coursework"],
    queryFn: async () => {
      const response = await api.get<IPhdCourseworkQuery>(
        "/phd/drcMember/generateCourseworkForm"
      );
      const modifiedData: IPhdCourseworkQuery = {
        ...response.data,
        formData: response.data.formData.map((student) => ({
          name: student.name,
          email: student.email,
          courses: student.courses.map(({ name, units }) => ({
            name,
            units,
          })),
        })),
      };
      return modifiedData;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return <LoadingSpinner className="mx-auto mt-10" />;
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-[1000px]">
        <CardContent className="p-6">
          <h2 className="mb-4 text-xl font-bold">
            PhD Students Coursework
            <Button
              disabled
              onClick={() => window.print()}
              className="m-2 ml-3 bg-blue-600 text-white hover:bg-blue-700"
            >
              <Printer className="inline-block h-6 w-6" />
            </Button>
          </h2>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/4">Student Name</TableHead>
                <TableHead className="w-1/4">Course</TableHead>
                <TableHead className="w-1/4">Units</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.formData.map((student) => (
                <React.Fragment key={student.email}>
                  {student.courses.length > 0 ? (
                    student.courses.map((course, index) => (
                      <TableRow key={`${student.email}-${index}`}>
                        {index === 0 && (
                          <TableCell
                            rowSpan={student.courses.length}
                            className="font-medium"
                          >
                            {student.name}
                          </TableCell>
                        )}
                        <TableCell>{course.name}</TableCell>
                        <TableCell>{course.units ?? "N/A"}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell className="font-medium">
                        {student.name}
                      </TableCell>
                      <TableCell colSpan={3} className="text-center">
                        No coursework available
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentsSittingForQualifyingExam;
