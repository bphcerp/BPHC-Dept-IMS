import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface IPhdPassedQuery {
  success: boolean;
  students: {
    name: string;
    email: string;
    qualifyingExam1: boolean;
    qualifyingExam2: boolean;
    qualifyingExam1Date: string | null;
    qualifyingExam2Date: string | null;
  }[];
}

const UpdateQualifyingExamPassingDates: React.FC = () => {
  const queryClient = useQueryClient();

  // Fetch students who have passed the qualifying exam
  const { data, isLoading } = useQuery({
    queryKey: ["phd-passed-students"],
    queryFn: async () => {
      const response = await api.get<IPhdPassedQuery>(
        "/phd/drcMember/getPhdThatPassedRecently"
      );
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });

  // Store qualification dates for each student
  const [qualificationDates, setQualificationDates] = useState<
    { email: string; qualificationDate: string }[]
  >([]);

  const updateQualificationDatesMutation = useMutation({
    mutationFn: async () => {
      return await api.patch(
        "/phd/drcMember/updatePassingDatesOfPhd",
        qualificationDates
      );
    },
    onMutate: async () => {
      await queryClient.cancelQueries(["phd-passed-students"]);
      const previousData = queryClient.getQueryData<IPhdPassedQuery>([
        "phd-passed-students",
      ]);
      return { previousData };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(["phd-passed-students"], context?.previousData);
      toast.error("Failed to update qualification dates");
    },
    onSuccess: () => {
      toast.success("Qualification dates updated successfully");
    },
    onSettled: () => {
      void queryClient.invalidateQueries(["phd-passed-students"]);
    },
  });

  if (isLoading) {
    return <LoadingSpinner className="mx-auto mt-10" />;
  }

  const handleDateChange = (email: string, date: string) => {
    setQualificationDates((prev) => {
      const updatedResults = prev.filter((entry) => entry.email !== email);
      updatedResults.push({
        email,
        qualificationDate: new Date(date).toISOString(), // Store in ISO format
      });
      return updatedResults;
    });
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-[1000px]">
        <CardContent className="p-6">
          <h2 className="mb-4 text-xl font-bold">Update Qualification Dates</h2>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/4">Student Name</TableHead>
                <TableHead className="w-1/4">Email</TableHead>
                <TableHead className="w-1/4">Previous Exam Date</TableHead>
                <TableHead className="w-1/4">Qualification Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.students.length ? (
                data.students.map((student) => (
                  <TableRow key={student.email}>
                    <TableCell className="font-medium">
                      {student.name}
                    </TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>
                      {student.qualifyingExam2Date ??
                        student.qualifyingExam1Date ??
                        "N/A"}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="datetime-local"
                        defaultValue={
                          student.qualifyingExam2Date ??
                          student.qualifyingExam1Date ??
                          ""
                        }
                        onChange={(e) =>
                          handleDateChange(student.email, e.target.value)
                        }
                        className="w-full"
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No students found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <Button
            className="mt-4 bg-green-600 text-white hover:bg-green-700"
            onClick={() => updateQualificationDatesMutation.mutate()}
            disabled={updateQualificationDatesMutation.isLoading}
          >
            {updateQualificationDatesMutation.isLoading
              ? "Updating..."
              : "Submit Dates"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpdateQualifyingExamPassingDates;
