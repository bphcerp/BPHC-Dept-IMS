import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { LoadingSpinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { phdSchemas } from "lib";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Plus, Trash2 } from "lucide-react";

interface SubArea {
  id: number;
  subarea: string;
}

type FormValues = z.infer<typeof phdSchemas.updateSubAreasSchema>;

const UpdateSubAreas: React.FC = () => {
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(phdSchemas.updateSubAreasSchema),
    defaultValues: {
      subAreas: [{ subarea: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "subAreas",
  });

  const { data: subAreasData, isLoading } = useQuery({
    queryKey: ["phd-sub-areas"],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; subAreas: SubArea[] }>(
        "/phd/staff/sub-areas"
      );
      return response.data;
    },
  });

  const updateSubAreasMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      await api.post("/phd/staff/sub-areas", data);
    },
    onSuccess: () => {
      toast.success("Sub-areas added successfully");
      queryClient.invalidateQueries({ queryKey: ["phd-sub-areas"] });
      form.reset({ subAreas: [{ subarea: "" }] });
    },
    onError: () => {
      toast.error("Failed to add sub-areas");
    },
  });

  const onSubmit = (data: FormValues) => {
    const nonEmptySubAreas = {
        subAreas: data.subAreas.filter(item => item.subarea.trim() !== "")
    };

    if (nonEmptySubAreas.subAreas.length === 0) {
        toast.error("Please add at least one sub-area.");
        return;
    }
    
    // Corrected Line: Cast the object to FormValues to satisfy TypeScript
    updateSubAreasMutation.mutate(nonEmptySubAreas as FormValues);
  };

  return (
    <div className="min-h-screen w-full bg-gray-100 px-4 py-12">
      <h1 className="mb-8 text-center text-3xl font-bold">Manage Sub-Areas</h1>
      <div className="mx-auto max-w-4xl space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Add New Sub-Areas</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {fields.map((field, index) => (
                  <FormField
                    key={field.id}
                    control={form.control}
                    name={`subAreas.${index}.subarea`}
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormControl>
                            <Input placeholder="Enter sub-area name..." {...field} />
                          </FormControl>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => remove(index)}
                            disabled={fields.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
                <div className="flex items-center gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => append({ subarea: "" })}
                    >
                        <Plus className="mr-2 h-4 w-4" /> Add More
                    </Button>
                    <Button
                        type="submit"
                        className="bg-blue-600 text-white hover:bg-blue-700"
                        disabled={updateSubAreasMutation.isLoading}
                    >
                        {updateSubAreasMutation.isLoading ? (
                        <LoadingSpinner className="h-5 w-5" />
                        ) : (
                        "Save Sub-Areas"
                        )}
                    </Button>
                </div>
              </form>
            </Form>
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
                    </tr>
                  </thead>
                  <tbody>
                    {subAreasData.subAreas.map(({ id, subarea }) => (
                      <tr key={id}>
                        <td className="border px-4 py-2">{subarea}</td>
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