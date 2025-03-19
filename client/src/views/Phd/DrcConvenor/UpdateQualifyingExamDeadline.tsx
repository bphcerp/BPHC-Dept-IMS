import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { LoadingSpinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Semester {
  id: number;
  year: number;
  semesterNumber: number;
  startDate: string;
  endDate: string;
  createdAt: string;
}

interface QualifyingExam {
  id: number;
  semesterId: number;
  examName: string;
  deadline: string;
  createdAt: string;
  semesterYear: number;
  semesterNumber: number;
}

const UpdateQualifyingExamDeadline: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | null>(null);
  const [examForm, setExamForm] = useState({
    examName: "",
    deadline: ""
  });

  // Fetch semesters for dropdown
  const { data: semestersData, isLoading: isLoadingSemesters } = useQuery({
    queryKey: ["phd-semesters"],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; semesters: Semester[] }>("/phd/drcMember/getAllSem");
      return response.data;
    }
  });

  // Fetch qualifying exams for selected semester
  const { data: examsData, isLoading: isLoadingExams } = useQuery({
    queryKey: ["phd-qualifying-exams", selectedSemesterId],
    queryFn: async () => {
      if (!selectedSemesterId) return { success: true, exams: [] };
      const response = await api.get<{ success: boolean; exams: QualifyingExam[] }>(
        `/phd/drcMember/getAllQualifyingExamForTheSem/${selectedSemesterId}`
      );
      return response.data;
    },
    enabled: !!selectedSemesterId
  });

  // Create/update qualifying exam mutation
  const examMutation = useMutation({
    mutationFn: async (formData: typeof examForm & { semesterId: number }) => {
      const response = await api.post("/phd/drcMember/updateQualifyingExamDeadline", formData);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Qualifying exam deadline updated successfully");
      queryClient.invalidateQueries({ queryKey: ["phd-qualifying-exams", selectedSemesterId] });
      setExamForm({
        examName: "",
        deadline: ""
      });
    },
    onError: () => {
      toast.error("Failed to update qualifying exam deadline");
    }
  });

  // Handle exam form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSemesterId) {
      toast.error("Please select a semester first");
      return;
    }
    if (!examForm.examName || !examForm.deadline) {
      toast.error("Please provide both exam name and deadline");
      return;
    }
    
    const formattedDeadline = new Date(examForm.deadline).toISOString();
    
    examMutation.mutate({
      ...examForm,
      deadline: formattedDeadline,
      semesterId: selectedSemesterId
    });
  };

  // Find the selected semester details
  const selectedSemester = semestersData?.semesters?.find(s => s.id === selectedSemesterId);

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-center text-3xl font-bold">Qualifying Exam Deadline Management</h1>

      <Card className="w-full max-w-md mb-6">
        <CardHeader>
          <CardTitle>Select Academic Semester</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingSemesters ? (
            <div className="flex justify-center py-4">
              <LoadingSpinner className="h-6 w-6" />
            </div>
          ) : (
            <div className="w-full">
              <Label htmlFor="semesterSelect">Select Semester</Label>
              <Select
                value={selectedSemesterId?.toString() || ""}
                onValueChange={(value) => setSelectedSemesterId(value ? parseInt(value) : null)}
              >
                <SelectTrigger id="semesterSelect">
                  <SelectValue placeholder="Choose a semester" />
                </SelectTrigger>
                <SelectContent>
                  {semestersData?.semesters && semestersData.semesters.length > 0 ? (
                    semestersData.semesters.map((semester) => (
                      <SelectItem key={semester.id} value={semester.id.toString()}>
                        {semester.year} - Semester {semester.semesterNumber}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>
                      No semesters available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedSemesterId && (
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>
              Update Qualifying Exam Deadline
              {selectedSemester && (
                <span className="ml-2 text-base font-normal text-gray-500">
                  {selectedSemester.year} - Semester {selectedSemester.semesterNumber}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <Label htmlFor="examName">Exam Name</Label>
                <Input
                  id="examName"
                  value={examForm.examName}
                  onChange={(e) => setExamForm({ ...examForm, examName: e.target.value })}
                  placeholder="e.g., Regular Qualifying Exam"
                  required
                />
              </div>
              <div>
                <Label htmlFor="deadline">Registration Deadline</Label>
                <Input
                  id="deadline"
                  type="datetime-local"
                  value={examForm.deadline}
                  onChange={(e) => setExamForm({ ...examForm, deadline: e.target.value })}
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={examMutation.isLoading}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {examMutation.isLoading ? (
                  <LoadingSpinner className="h-5 w-5" />
                ) : (
                  "Update Exam Deadline"
                )}
              </Button>
            </form>

            {/* Display existing exams */}
            <div className="mt-6">
              <h3 className="mb-3 text-lg font-medium">Existing Exams</h3>
              {isLoadingExams ? (
                <div className="flex justify-center py-4">
                  <LoadingSpinner className="h-6 w-6" />
                </div>
              ) : (examsData?.exams && examsData.exams.length > 0) ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border px-4 py-2 text-left">Exam Name</th>
                        <th className="border px-4 py-2 text-left">Deadline</th>
                        <th className="border px-4 py-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {examsData.exams.map((exam) => {
                        const deadlineDate = new Date(exam.deadline);
                        const isActive = deadlineDate > new Date();
                        
                        return (
                          <tr key={exam.id}>
                            <td className="border px-4 py-2">{exam.examName}</td>
                            <td className="border px-4 py-2">
                              {new Date(deadlineDate).toLocaleString('en-US', { 
                                weekday: 'short',
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric',
                                hour: 'numeric', 
                                minute: '2-digit', 
                                hour12: true 
                              })}
                            </td>
                            <td className="border px-4 py-2">
                              <span
                                className={`rounded-full px-2 py-1 text-xs font-medium ${
                                  isActive
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {isActive ? "Active" : "Expired"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center py-4 text-gray-500">No qualifying exams found for this semester.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UpdateQualifyingExamDeadline;