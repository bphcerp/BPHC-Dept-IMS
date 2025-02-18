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
const formSchema = z.object({
  id: z.string().nonempty(),
  name: z.string().nonempty(),
  units: z.number(),
});
type FormValues = z.infer<typeof formSchema>;
export function AddCourseForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: "",
      name: "",
      units: 0,
    },
  });
  const submitMutation = useMutation({
    mutationFn: async (data: FormValues) => {
        /* */
    },
    onSuccess: () => {
        form.reset();
        alert("Course added successfully");
    },
    onError: (error) => {
        if (error instanceof Error) {
            alert(error.message);
        }
    }
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
          name="id"
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
  //   const [courseId, setCourseId] = useState("");
  //   const [courseName, setCourseName] = useState("");
  //   const [units, setUnits] = useState("");
  //   const [grade, setGrade] = useState("");

  //   const handleSubmit = async (e: React.FormEvent) => {
  //     e.preventDefault();

  //     console.log("New course:", { courseId, courseName, units, grade });

  //     // Clear the form
  //     setCourseId("");
  //     setCourseName("");
  //     setUnits("");
  //     setGrade("");

  //   };

  //   return (
  //     <form onSubmit={handleSubmit} className="space-y-4">
  //       <div>
  //         <Label htmlFor="courseId">Course ID</Label>
  //         <Input
  //           id="courseId"
  //           value={courseId}
  //           onChange={(e) => setCourseId(e.target.value)}
  //           required
  //         />
  //       </div>
  //       <div>
  //         <Label htmlFor="courseName">Course Name</Label>
  //         <Input
  //           id="courseName"
  //           value={courseName}
  //           onChange={(e) => setCourseName(e.target.value)}
  //           required
  //         />
  //       </div>
  //       <div>
  //         <Label htmlFor="units">Units</Label>
  //         <Input
  //           id="units"
  //           type="number"
  //           value={units}
  //           onChange={(e) => setUnits(e.target.value)}
  //           required
  //         />
  //       </div>
  //       <div>
  //         <Label htmlFor="grade">Grade</Label>
  //         <Input
  //           id="grade"
  //           value={grade}
  //           onChange={(e) => setGrade(e.target.value)}
  //           required
  //         />
  //       </div>
  //       <Button type="submit">Add Course</Button>
  //     </form>
  //   );
}
