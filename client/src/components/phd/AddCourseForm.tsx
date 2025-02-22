import { zodResolver } from "@hookform/resolvers/zod";
import type React from "react";
import { SubmitHandler, useForm } from "react-hook-form";

import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
const formSchema = z.object({
  courseId: z.string().nonempty(),
  name: z.string().nonempty(),
  units: z.coerce.number(),
});
type FormValues = z.infer<typeof formSchema>;
export function AddCourseForm({ studentEmail }: { studentEmail: string }) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      courseId: "",
      name: "",
      units: 3,
    },
  });
  const submitMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      api.post("/phd/notionalSupervisor/addCourse", {
        studentEmail,
        courses: [data],
      });
    },
    onSuccess: () => {
      form.reset();
      alert("Course added successfully");
    },
    onError: (error) => {
      if (error instanceof Error) {
        alert(error.message); 
      }
    },
  });
  const onSubmit: SubmitHandler<FormValues> = (data) => {
    submitMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          void form.handleSubmit(onSubmit)(e);
        }}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="courseId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Course ID</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        ></FormField>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Course Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        ></FormField>
        <FormField
          control={form.control}
          name="units"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Course Units</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        ></FormField>
        <Button type="submit">Add Course</Button>
      </form>
    </Form>
  );
}
