import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { LoadingSpinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { phdSchemas } from "lib";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface Semester {
  id: number;
  academicYear: string;
  semesterNumber: number;
  startDate: string;
  endDate: string;
}

type FormValues = z.infer<typeof phdSchemas.createSemesterSchema>;

const UpdateSemesterDates: React.FC = () => {
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(phdSchemas.createSemesterSchema),
    defaultValues: {
      academicYear: new Date().getFullYear().toString(),
      semesterNumber: 1,
      startDate: "",
      endDate: "",
    },
  });

  const { data: semestersData, isLoading: isLoadingSemesters } = useQuery({
    queryKey: ["phd-semesters"],
    queryFn: async () => {
      // Corrected API endpoint
      const response = await api.get<{
        success: boolean;
        semesters: Semester[];
      }>("/phd/staff/semesters");
      return response.data;
    },
  });

  const semesterMutation = useMutation({
    mutationFn: async (formData: FormValues) => {
      const response = await api.post<{ semester: Semester }>(
        "/phd/staff/semesters",
        formData // Send the form data directly
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("Semester saved successfully");
      queryClient.invalidateQueries({ queryKey: ["phd-semesters"] });
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to save semester");
    },
  });

  const onSubmit = (data: FormValues) => {
    semesterMutation.mutate(data);
  };

  return (
    <div className="min-h-screen w-full bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-center text-3xl font-bold">Manage PhD Semesters</h1>
      <div className="mx-auto max-w-6xl space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Create or Update Semester</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="academicYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Academic Year</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 2024-2025" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="semesterNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Semester Number</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select semester" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1">Semester 1</SelectItem>
                            <SelectItem value="2">Semester 2</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Existing Academic Semesters</CardTitle>
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
                        <td className="border px-4 py-2">{semester.academicYear}</td>
                        <td className="border px-4 py-2">
                          Semester {semester.semesterNumber}
                        </td>
                        <td className="border px-4 py-2">
                          {new Date(semester.startDate).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric",
                          })}
                        </td>
                        <td className="border px-4 py-2">
                          {new Date(semester.endDate).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric",
                          })}
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