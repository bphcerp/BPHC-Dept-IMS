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

interface IPhdDacQuery {
  success: boolean;
  students: {
    email: string;
    name: string;
    suggestedDacMembers: string[];
  }[];
}

interface IDacSuggestionResponse {
  success: boolean;
  topChoices: string[];
  message: string;
}

// Define mutation variable types
interface UpdateDacParams {
  email: string;
  dac1: string;
  dac2: string;
}

const AssignDacMembers: React.FC = () => {
  const queryClient = useQueryClient();

  // Fetch students & their suggested DAC members
  const { data, isLoading } = useQuery({
    queryKey: ["phd-suggested-dac"],
    queryFn: async () => {
      const response = await api.get<IPhdDacQuery>(
        "/phd/drcMember/getSuggestedDacMember"
      );
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Store selected DAC members per student
  const [selectedDac, setSelectedDac] = useState<
    Record<string, { dac1: string; dac2: string }>
  >({});

  // Track which student is currently getting suggestions
  const [suggestingFor, setSuggestingFor] = useState<string | null>(null);

  // Fetch recommended DAC members based on workload
  const getDacSuggestionsMutation = useMutation({
    mutationFn: async (email: string) => {
      setSuggestingFor(email);

      // Find the student to get their suggested DAC members
      const student = data?.students.find((s) => s.email === email);
      if (!student) {
        throw new Error("Student not found");
      }

      const response = await api.post<IDacSuggestionResponse>(
        "/phd/drcMember/suggestTwoBestDacMember",
        {
          email,
          selectedDacMembers: student.suggestedDacMembers || [],
        }
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      if (data.topChoices && data.topChoices.length >= 2) {
        setSelectedDac((prev) => ({
          ...prev,
          [variables]: {
            dac1: data.topChoices[0] || "",
            dac2: data.topChoices[1] || "",
          },
        }));
        toast.success("Received DAC suggestions based on faculty workload");
      } else {
        toast.error("Insufficient DAC suggestions received");
      }
      setSuggestingFor(null);
    },
    onError: () => {
      toast.error("Failed to fetch DAC suggestions");
      setSuggestingFor(null);
    },
  });

  // Submit final DAC members for assignment
  const updateFinalDacMutation = useMutation<unknown, unknown, UpdateDacParams>({
    mutationFn: async ({ email, dac1, dac2 }: UpdateDacParams) => {
      return await api.post("/phd/drcMember/updateFinalDac", {
        email,
        finalDacMembers: [dac1, dac2],
      });
    },
    onSuccess: (_data, variables) => {
      toast.success(`DAC members assigned successfully for ${variables.email}!`);
      queryClient.invalidateQueries({ queryKey: ["phd-suggested-dac"] });
    },
    onError: (_error, variables) => {
      toast.error(`Failed to update DAC members for ${variables.email}`);
    },
  });

  // Handle input change for DAC members
  const handleDacChange = (
    email: string,
    field: "dac1" | "dac2",
    value: string
  ) => {
    setSelectedDac((prev) => ({
      ...prev,
      [email]: {
        ...(prev[email] || { dac1: "", dac2: "" }),
        [field]: value,
      },
    }));
  };

  if (isLoading) {
    return <LoadingSpinner className="mx-auto mt-10" />;
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-5xl">
        <CardContent className="p-6">
          <h2 className="mb-4 text-xl font-bold">Assign DAC Members</h2>
          <p className="mb-4 text-gray-600">
            Assign two Doctoral Advisory Committee members from the suggested list. 
            Use the 'Suggest' button to auto-select the two faculty members with the lowest workload.
          </p>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/5">Student Name</TableHead>
                <TableHead className="w-1/4">Suggested DAC Members</TableHead>
                <TableHead className="w-1/5">DAC Member 1 (Email)</TableHead>
                <TableHead className="w-1/5">DAC Member 2 (Email)</TableHead>
                <TableHead className="w-1/5">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.students && data.students.length > 0 ? (
                data.students.map((student) => {
                  // Check if this student's update is in progress
                  const isUpdating =
                    updateFinalDacMutation.isLoading &&
                    (updateFinalDacMutation.variables as UpdateDacParams)?.email === student.email;

                  // Check if we're getting suggestions for this student
                  const isSuggesting = suggestingFor === student.email;

                  return (
                    <TableRow key={student.email}>
                      <TableCell className="font-medium">
                        {student.name}
                      </TableCell>
                      <TableCell>
                        <div className="max-h-20 overflow-y-auto">
                          {student.suggestedDacMembers?.join(", ") || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="email"
                          value={selectedDac[student.email]?.dac1 || ""}
                          onChange={(e) =>
                            handleDacChange(
                              student.email,
                              "dac1",
                              e.target.value
                            )
                          }
                          placeholder="email@example.com"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="email"
                          value={selectedDac[student.email]?.dac2 || ""}
                          onChange={(e) =>
                            handleDacChange(
                              student.email,
                              "dac2",
                              e.target.value
                            )
                          }
                          placeholder="email@example.com"
                        />
                      </TableCell>
                      <TableCell className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            getDacSuggestionsMutation.mutate(student.email)
                          }
                          disabled={
                            isSuggesting || getDacSuggestionsMutation.isLoading
                          }
                        >
                          {isSuggesting ? "Loading..." : "Suggest"}
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-600 text-white hover:bg-green-700"
                          onClick={() =>
                            updateFinalDacMutation.mutate({
                              email: student.email,
                              dac1: selectedDac[student.email]?.dac1 || "",
                              dac2: selectedDac[student.email]?.dac2 || "",
                            })
                          }
                          disabled={
                            !selectedDac[student.email]?.dac1 ||
                            !selectedDac[student.email]?.dac2 ||
                            isUpdating ||
                            updateFinalDacMutation.isLoading
                          }
                        >
                          {isUpdating ? "Saving..." : "Save"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-4 text-center">
                    No students found with suggested DAC members
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssignDacMembers;