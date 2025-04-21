import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { LoadingSpinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface SubArea {
  id: number;
  subarea: string;
}

const UpdateSubAreas: React.FC = () => {
  const queryClient = useQueryClient();
  const [subAreas, setSubAreas] = useState<string[]>([""]);

  const { data: subAreasData, isLoading } = useQuery({
    queryKey: ["phd-sub-areas"],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; subAreas: SubArea[] }>(
        "/phd/staff/getSubAreas"
      );
      return response.data;
    },
  });

  const updateSubAreasMutation = useMutation({
    mutationFn: async (newSubAreas: string[]) => {
      await api.post("/phd/staff/updateSubAreas", {
        subAreas: newSubAreas.map((subarea) => ({ subarea })),
      });
    },
    onSuccess: () => {
      toast.success("Sub-areas added successfully");
      void queryClient.invalidateQueries({ queryKey: ["phd-sub-areas"] });
      setSubAreas([""]);
    },
    onError: () => {
      toast.error("Failed to add sub-areas");
    },
  });

  const deleteSubAreaMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/phd/staff/deleteSubArea/${id}`);
    },
    onSuccess: () => {
      toast.success("Sub-area deleted successfully");
      void queryClient.invalidateQueries({ queryKey: ["phd-sub-areas"] });
    },
    onError: () => {
      toast.error("Failed to delete sub-area");
    },
  });

  return (
    <div className="min-h-screen w-full bg-gray-100 px-4 py-12">
      <h1 className="mb-8 text-center text-3xl font-bold">Manage Sub-Areas</h1>
      <div className="mx-auto max-w-4xl space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Add Sub-Areas</CardTitle>
          </CardHeader>
          <CardContent>
            {subAreas.map((subarea, index) => (
              <div key={index} className="mb-2 flex gap-4">
                <Input
                  type="text"
                  value={subarea}
                  onChange={(e) => {
                    const newSubAreas = [...subAreas];
                    newSubAreas[index] = e.target.value;
                    setSubAreas(newSubAreas);
                  }}
                />
                <Button
                  variant="destructive"
                  onClick={() =>
                    setSubAreas(subAreas.filter((_, i) => i !== index))
                  }
                  disabled={subAreas.length === 1}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button onClick={() => setSubAreas([...subAreas, ""])}>
              Add More
            </Button>
            <Button
              className="mt-4 bg-blue-600 text-white hover:bg-blue-700"
              onClick={() =>
                updateSubAreasMutation.mutate(subAreas.filter(Boolean))
              }
              disabled={updateSubAreasMutation.isLoading}
            >
              {updateSubAreasMutation.isLoading ? (
                <LoadingSpinner className="h-5 w-5" />
              ) : (
                "Save Sub-Areas"
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Existing Sub-Areas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-4">
                <LoadingSpinner className="h-8 w-8" />
              </div>
            ) : subAreasData?.subAreas?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border px-4 py-2 text-left">Sub-Area</th>
                      <th className="border px-4 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subAreasData.subAreas.map(({ id, subarea }) => (
                      <tr key={id}>
                        <td className="border px-4 py-2">{subarea}</td>
                        <td className="border px-4 py-2 text-center">
                          <Button
                            variant="destructive"
                            onClick={() => deleteSubAreaMutation.mutate(id)}
                            disabled={deleteSubAreaMutation.isLoading}
                          >
                            {deleteSubAreaMutation.isLoading ? (
                              <LoadingSpinner className="h-5 w-5" />
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
              <p className="py-4 text-center">No sub-areas found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UpdateSubAreas;
