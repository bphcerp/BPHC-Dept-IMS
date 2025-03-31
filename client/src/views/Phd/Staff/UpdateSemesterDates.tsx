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
        success: boolean;
        semesters: Semester[];
      }>("/phd/staff/getAllSem");
      return response.data;
    },
  });

  // Create/update semester mutation
  const semesterMutation = useMutation({
    mutationFn: async (formData: typeof semesterForm) => {
      const response = await api.post<{ semester: Semester }>(
        "/phd/staff/updateSemesterDates",
        formData
      );
      return response.data;
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
      <h1 className="mb-8 text-center text-3xl font-bold">
        PhD Semester
      </h1>

      <div className="mx-auto max-w-6xl space-y-8">
        {/* Create/Update Semester */}
        <Card>
          <CardHeader>
            <CardTitle>Create Semester</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSemesterSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="year">Academic Year</Label>
                  <Input
                    id="year"
                    type="text"
                    value={semesterForm.year}
                    onChange={(e) =>
                      setSemesterForm({ ...semesterForm, year: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="semesterNumber">Semester Number</Label>
                  <Select
                    value={semesterForm.semesterNumber.toString()}
                    onValueChange={(value) =>
                      setSemesterForm({
                        ...semesterForm,
                        semesterNumber: parseInt(value),
                      })
                    }
                  >
                    <SelectTrigger id="semesterNumber">
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Semester 1</SelectItem>
                      <SelectItem value="2">Semester 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
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
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
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
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={semesterMutation.isLoading}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {semesterMutation.isLoading ? (
                  <LoadingSpinner className="h-5 w-5" />
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
            <CardTitle>Academic Semesters</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSemesters ? (
              <div className="flex justify-center py-4">
                <LoadingSpinner className="h-8 w-8" />
              </div>
            ) : semestersData?.semesters?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border px-4 py-2 text-left">Year</th>
                      <th className="border px-4 py-2 text-left">Semester</th>
                      <th className="border px-4 py-2 text-left">Start Date</th>
                      <th className="border px-4 py-2 text-left">End Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {semestersData.semesters.map((semester) => (
                      <tr key={semester.id}>
                        <td className="border px-4 py-2">{semester.year}</td>
                        <td className="border px-4 py-2">
                          Semester {semester.semesterNumber}
                        </td>
                        <td className="border px-4 py-2">
                          {new Date(semester.startDate).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "numeric" }
                          )}
                        </td>
                        <td className="border px-4 py-2">
                          {new Date(semester.endDate).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "numeric" }
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-4 text-center">
                No semesters found. Create one above.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UpdateSemesterDates;
