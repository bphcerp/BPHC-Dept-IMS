import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { LoadingSpinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Semester {
  id: number;
  year: string;
  semesterNumber: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  qualifyingExams: number;
}

const UpdateSemesterDates: React.FC = () => {
  const queryClient = useQueryClient();

  // Form states
  const [semesterForm, setSemesterForm] = useState({
    year: new Date().getFullYear().toString(),
    semesterNumber: 1,
    startDate: "",
    endDate: "",
  });

  // Fetch semesters
  const { data: semestersData, isLoading: isLoadingSemesters } = useQuery({
    queryKey: ["phd-semesters"],
    queryFn: async () => {
      const response = await api.get<{
        semesters: Semester[];
      }>("/phd/staff/getAllSem");
      return response.data;
    },
  });

  // Create/update semester mutation
  const semesterMutation = useMutation({
    mutationFn: async (formData: typeof semesterForm) => {
      await api.post("/phd/staff/updateSem", formData);
    },
    onSuccess: () => {
      toast.success("Semester saved successfully");
      void queryClient.invalidateQueries({ queryKey: ["phd-semesters"] });
      setSemesterForm({
        year: new Date().getFullYear().toString(),
        semesterNumber: 1,
        startDate: "",
        endDate: "",
      });
    },
    onError: () => {
      toast.error("Failed to save semester");
    },
  });

  // Delete semester mutation
  const deleteSemesterMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/phd/staff/deleteSem/${id}`);
    },
    onSuccess: () => {
      toast.success("Semester deleted successfully");
      void queryClient.invalidateQueries({ queryKey: ["phd-semesters"] });
    },
    onError: () => {
      toast.error("Failed to delete semester");
    },
  });

  // Handle semester form submission
  const handleSemesterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!semesterForm.startDate || !semesterForm.endDate) {
      toast.error("Please provide both start and end dates");
      return;
    }
    semesterMutation.mutate(semesterForm);
  };

  return (
    <div className="min-h-screen w-full bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">PhD Semester Management</h1>
          <p className="mt-2 text-gray-600">Create and manage academic semesters</p>
        </div>

        {/* Create/Update Semester */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Create/Update Semester</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSemesterSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-3">
                  <Label htmlFor="year" className="text-sm font-medium">Academic Year</Label>
                  <Input
                    id="year"
                    type="text"
                    value={semesterForm.year}
                    onChange={(e) =>
                      setSemesterForm({ ...semesterForm, year: e.target.value })
                    }
                    required
                    className="h-10"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="semesterNumber" className="text-sm font-medium">Semester Number</Label>
                  <Select
                    value={semesterForm.semesterNumber.toString()}
                    onValueChange={(value) =>
                      setSemesterForm({
                        ...semesterForm,
                        semesterNumber: parseInt(value),
                      })
                    }
                  >
                    <SelectTrigger id="semesterNumber" className="h-10">
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Semester 1</SelectItem>
                      <SelectItem value="2">Semester 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="startDate" className="text-sm font-medium">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={semesterForm.startDate}
                    onChange={(e) =>
                      setSemesterForm({
                        ...semesterForm,
                        startDate: e.target.value,
                      })
                    }
                    required
                    className="h-10"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="endDate" className="text-sm font-medium">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={semesterForm.endDate}
                    onChange={(e) =>
                      setSemesterForm({
                        ...semesterForm,
                        endDate: e.target.value,
                      })
                    }
                    required
                    className="h-10"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={semesterMutation.isLoading}
                className="bg-blue-600 text-white hover:bg-blue-700 h-10 px-6"
              >
                {semesterMutation.isLoading ? (
                  <LoadingSpinner className="h-4 w-4" />
                ) : (
                  "Save Semester"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* View Semesters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Academic Semesters</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSemesters ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner className="h-8 w-8" />
              </div>
            ) : semestersData?.semesters?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Year</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Semester</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Start Date</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">End Date</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Qualifying Exams</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {semestersData.semesters.map((semester) => (
                      <tr key={semester.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">{semester.year}</td>
                        <td className="px-4 py-3">
                          Semester {semester.semesterNumber}
                        </td>
                        <td className="px-4 py-3">
                          {new Date(semester.startDate).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "numeric" }
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {new Date(semester.endDate).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "numeric" }
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {semester.qualifyingExams}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteSemesterMutation.mutate(semester.id)}
                            disabled={deleteSemesterMutation.isLoading}
                            className="h-8 px-3"
                          >
                            {deleteSemesterMutation.isLoading ? (
                              <LoadingSpinner className="h-4 w-4" />
                            ) : (
                              "Delete"
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-500 mb-4">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Semesters Found</h3>
                <p className="text-gray-500">Create your first semester above.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UpdateSemesterDates;
