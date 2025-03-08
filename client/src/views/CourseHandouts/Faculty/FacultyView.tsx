"use client";

import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoadingSpinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const schema = z.object({
  courseCode: z.string().nonempty("Course Code is required"),
  courseName: z.string().nonempty("Course Name is required"),
  openBookPercentage: z.string().nonempty("Open Book % is required"),
  closedBookPercentage: z.string().nonempty("Closed Book % is required"),
  midsemesterWeightage: z.string().nonempty("Midsemester Weightage is required"),
  comprehensiveWeightage: z.string().nonempty("Comprehensive Weightage is required"),
  approximateStrength: z.string().nonempty("Approximate Course Strength is required"),
});

type FormData = z.infer<typeof schema>;

export default function CourseHandouts() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      courseCode: "",
      courseName: "",
      openBookPercentage: "",
      closedBookPercentage: "",
      midsemesterWeightage: "",
      comprehensiveWeightage: "",
      approximateStrength: "",
    },
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsSubmitting(true);
    try {
      console.log("Form Data:", data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      <h1 className="text-2xl font-bold mb-8">
        HANDOUT APPROVAL - 2nd SEMESTER, YEAR 2024 - 2025
      </h1>
      <Form {...form}>
        <form
          onSubmit={(e) => {
            void form.handleSubmit(onSubmit)(e);
          }}
          className="space-y-8"
        >
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="courseCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-900">Course Code</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. CS101" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="courseName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-900">Course Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Computer Programming" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="openBookPercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-900">
                    Open Book Percentage
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 30" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="closedBookPercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-900">
                    Closed Book Percentage
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 70" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="midsemesterWeightage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-900">
                    Midsemester Weightage (in %)
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 30" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="comprehensiveWeightage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-900">
                    Comprehensive Weightage (in %)
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 70" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="approximateStrength"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-900">
                    Approximate Course Strength
                  </FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g. 120" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex flex-row justify-between mt-4 pt-8">
            <div className="flex flex-col mb-6">
              <Button variant="outline">Select Handout Docx</Button>
              <p className="text-sm text-gray-500 mt-1 ml-2">
                file.docx/file.pdf
              </p>
            </div>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 w-full sm:w-auto"
            >
              {isSubmitting ? (
                <LoadingSpinner className="h-5 w-5" />
              ) : (
                "SUBMIT FOR VERIFICATION"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
