import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { LoadingSpinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const UpdateSubAreas: React.FC = () => {
  const queryClient = useQueryClient();
  const [newSubArea, setNewSubArea] = useState("");

  const { data: subAreasData, isLoading } = useQuery({
    queryKey: ["phd-sub-areas"],
    queryFn: async () => {
      const response = await api.get<{ subAreas: string[] }>(
        "/phd/getSubAreas"
      );
      return response.data;
    },
  });

  const insertSubAreaMutation = useMutation({
    mutationFn: async (subArea: string) => {
      await api.post("/phd/staff/insertSubArea", {
        subArea,
      });
    },
    onSuccess: () => {
      toast.success("Sub-area added successfully");
      setNewSubArea("");
      void queryClient.invalidateQueries({ queryKey: ["phd-sub-areas"] });
    },
    onError: () => {
      toast.error("Failed to add sub-area");
    },
  });

  const deleteSubAreaMutation = useMutation({
    mutationFn: async (subArea: string) => {
      await api.delete(`/phd/staff/deleteSubArea`, { data: { subArea } });
    },
    onSuccess: () => {
      toast.success("Sub-area deleted successfully");
      void queryClient.invalidateQueries({ queryKey: ["phd-sub-areas"] });
    },
    onError: () => {
      toast.error("Failed to delete sub-area");
    },
  });

  const handleAddSubArea = () => {
    if (newSubArea.trim()) {
      insertSubAreaMutation.mutate(newSubArea.trim());
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Manage Sub-Areas</h1>
          <p className="mt-2 text-gray-600">Add and manage PhD qualifying exam sub-areas</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Add Sub-Area</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                type="text"
                value={newSubArea}
                onChange={(e) => setNewSubArea(e.target.value)}
                placeholder="Enter sub-area name"
                className="h-10"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAddSubArea();
                  }
                }}
              />
              <Button
                onClick={handleAddSubArea}
                disabled={insertSubAreaMutation.isLoading || !newSubArea.trim()}
                className="h-10 px-6"
              >
                {insertSubAreaMutation.isLoading ? (
                  <LoadingSpinner className="h-4 w-4" />
                ) : (
                  "Add Sub-Area"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Existing Sub-Areas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner className="h-8 w-8" />
              </div>
            ) : subAreasData?.subAreas?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Sub-Area</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subAreasData.subAreas.map((subArea, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">{subArea}</td>
                        <td className="px-4 py-3 text-center">
                          <Button
                            variant="destructive"
                            onClick={() => deleteSubAreaMutation.mutate(subArea)}
                            disabled={deleteSubAreaMutation.isLoading}
                            className="h-8 px-3"
                          >
                            {deleteSubAreaMutation.isLoading ? (
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Sub-Areas Found</h3>
                <p className="text-gray-500">Add your first sub-area above.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UpdateSubAreas;
