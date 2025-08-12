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
    <div className="min-h-screen w-full bg-gray-100 px-4 py-12">
      <h1 className="mb-8 text-center text-3xl font-bold">Manage Sub-Areas</h1>
      <div className="mx-auto max-w-4xl space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Add Sub-Area</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                type="text"
                value={newSubArea}
                onChange={(e) => setNewSubArea(e.target.value)}
                placeholder="Enter sub-area name"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAddSubArea();
                  }
                }}
              />
              <Button
                onClick={handleAddSubArea}
                disabled={insertSubAreaMutation.isLoading || !newSubArea.trim()}
              >
                {insertSubAreaMutation.isLoading ? (
                  <LoadingSpinner className="h-5 w-5" />
                ) : (
                  "Add Sub-Area"
                )}
              </Button>
            </div>
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
                    {subAreasData.subAreas.map((subArea, index) => (
                      <tr key={index}>
                        <td className="border px-4 py-2">{subArea}</td>
                        <td className="border px-4 py-2 text-center">
                          <Button
                            variant="destructive"
                            onClick={() => deleteSubAreaMutation.mutate(subArea)}
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
