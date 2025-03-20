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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface IPhdExamQuery {
  success: boolean;
  students: {
    name: string;
    email: string;
    idNumber: string;
    area1: string;
    area2: string;
  }[];
}

const QualifyingExamStudents: React.FC = () => {
  const queryClient = useQueryClient();

  // Fetch students eligible for the qualifying exam
  const { data, isLoading } = useQuery({
    queryKey: ["phd-qualifying-exam-students"],
    queryFn: async () => {
      const response = await api.get<IPhdExamQuery>(
        "/phd/drcMember/getPhdToGenerateQualifyingExamForm"
      );
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });

  // Store Pass/Fail selections
  const [examResults, setExamResults] = useState<
    { email: string; ifPass: boolean }[]
  >([]);

  const updateExamResultsMutation = useMutation({
    mutationFn: async () => {
      return await api.post(
        "/phd/drcMember/updateQualifyingExamResultsOfAllStudents",
        examResults
      );
    },
    onMutate: async () => {
      await queryClient.cancelQueries(["phd-qualifying-exam-students"]);
      const previousData = queryClient.getQueryData<IPhdExamQuery>([
        "phd-qualifying-exam-students",
      ]);
      return { previousData };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(
        ["phd-qualifying-exam-students"],
        context?.previousData
      );
      toast.error("Failed to update exam results");
    },
    onSuccess: () => {
      toast.success("Exam results updated successfully");
    },
    onSettled: () => {
      void queryClient.invalidateQueries(["phd-qualifying-exam-students"]);
    },
  });

  if (isLoading) {
    return <LoadingSpinner className="mx-auto mt-10" />;
  }

  const handleUpdate = (email: string, result: string) => {
    setExamResults(
      (prev) => (prev.push({ email, ifPass: result === "pass" }), prev)
    );
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-[1000px]">
        <CardContent className="p-6">
          <h2 className="mb-4 text-xl font-bold">
            Update Qualifying Exam Results
          </h2>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/4">Student Name</TableHead>
                <TableHead className="w-1/4">Email</TableHead>
                <TableHead className="w-1/4">Qualifying Areas</TableHead>
                <TableHead className="w-1/4">Result</TableHead>
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
                      {student.area1} / {student.area2}
                    </TableCell>
                    <TableCell>
                      <Select
                        onValueChange={(value) =>
                          handleUpdate(student.email, value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Result" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pass">Pass</SelectItem>
                          <SelectItem value="fail">Fail</SelectItem>
                        </SelectContent>
                      </Select>
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
            onClick={() => updateExamResultsMutation.mutate()}
            disabled={updateExamResultsMutation.isLoading}
          >
            {updateExamResultsMutation.isLoading
              ? "Updating..."
              : "Submit Results"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default QualifyingExamStudents;
