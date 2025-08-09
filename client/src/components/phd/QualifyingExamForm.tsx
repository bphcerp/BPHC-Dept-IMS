// client/src/components/phd/QualifyingExamForm.tsx
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUploader } from "@/components/ui/file-uploader";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { toast } from "sonner";

const formSchema = z.object({
  qualifyingArea1: z.string().min(1, "First qualifying area is required"),
  qualifyingArea2: z.string().min(1, "Second qualifying area is required"),
  applicationForm: z.instanceof(File, { message: "Application form is required" }),
});

type FormData = z.infer<typeof formSchema>;

interface SubArea {
  id: number;
  subarea: string;
}

interface ExamEvent {
  id: number;
  name: string;
  registrationDeadline: string;
}

interface QualifyingExamFormProps {
  examEvent: ExamEvent;
}

export const QualifyingExamForm: React.FC<QualifyingExamFormProps> = ({ examEvent }) => {
  const [file, setFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      qualifyingArea1: "",
      qualifyingArea2: "",
    },
  });

  // Fetch sub-areas
  const { data: subAreas } = useQuery<SubArea[]>({
    queryKey: ["phd-sub-areas"],
    queryFn: async () => {
      const response = await api.get("/phd/student/getSubAreas");
      return response.data.subAreas;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const formData = new FormData();
      formData.append("examEventId", examEvent.id.toString());
      formData.append("qualifyingArea1", data.qualifyingArea1);
      formData.append("qualifyingArea2", data.qualifyingArea2);
      formData.append("applicationForm", data.applicationForm);

      await api.post("/phd/student/applications", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
    onSuccess: () => {
      toast.success("Application submitted successfully");
      form.reset();
      setFile(null);
      queryClient.invalidateQueries(["active-qualifying-exam"]);
      queryClient.invalidateQueries(["student-applications"]);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to submit application");
    },
  });

  const onSubmit = (data: FormData) => {
    if (!file) {
      toast.error("Please upload an application form");
      return;
    }
    
    submitMutation.mutate({
      ...data,
      applicationForm: file,
    });
  };

  const handleFileChange = (files: File[]) => {
    const selectedFile = files[0];
    if (selectedFile) {
      setFile(selectedFile);
      form.setValue("applicationForm", selectedFile);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Qualifying Exam Application</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="qualifyingArea1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Qualifying Area</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select first qualifying area" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {subAreas?.map((area) => (
                        <SelectItem key={area.id} value={area.subarea}>
                          {area.subarea}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="qualifyingArea2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Second Qualifying Area</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select second qualifying area" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {subAreas?.filter((area) => area.subarea !== form.watch("qualifyingArea1"))
                        .map((area) => (
                          <SelectItem key={area.id} value={area.subarea}>
                            {area.subarea}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="applicationForm"
              render={() => (
                <FormItem>
                  <FormLabel>Application Form (PDF)</FormLabel>
                  <FormControl>
                    <FileUploader
                      value={file ? [file] : []}
                      onValueChange={handleFileChange}
                      accept={{ "application/pdf": [".pdf"] }}
                      // maxFiles={1}
                      maxSize={10 * 1024 * 1024} // 10MB
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={submitMutation.isLoading}
              className="w-full"
            >
              {submitMutation.isLoading ? "Submitting..." : "Submit Application"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
