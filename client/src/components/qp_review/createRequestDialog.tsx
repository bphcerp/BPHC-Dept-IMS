"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Define the schema
const createRequestSchema = z.object({
  icEmail: z.string().email("Please enter a valid email address"),
  courseName: z.string().min(1, "Course name is required"),
  courseCode: z.string().min(1, "Course code is required"),
  requestType: z.enum(["Mid Sem", "Comprehensive", "Both"], {
    required_error: "Request type is required",
  }),
  category: z.enum(["HD", "FD"], { required_error: "Category is required" }),
});

type CreateRequestFormData = z.infer<typeof createRequestSchema>;

interface CreateRequestDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSubmit: (data: CreateRequestFormData) => void;
  isLoading?: boolean;
}

const REQUEST_TYPES = ["Mid Sem", "Comprehensive", "Both"] as const;

export const CreateRequestDialog: React.FC<CreateRequestDialogProps> = ({
  isOpen,
  setIsOpen,
  onSubmit,
  isLoading = false,
}) => {
  const form = useForm<CreateRequestFormData>({
    resolver: zodResolver(createRequestSchema),
    defaultValues: {
      icEmail: "",
      courseName: "",
      courseCode: "",
      requestType: undefined as unknown as (typeof REQUEST_TYPES)[number],
      category: undefined as unknown as "HD" | "FD",
    },
  });

  const handleSubmit = (data: CreateRequestFormData) => {
    onSubmit(data);
    form.reset();
    setIsOpen(false);
  };

  const handleCancel = () => {
    form.reset();
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Request</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new course request.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={() => void form.handleSubmit(handleSubmit)()}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="icEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instructor Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="instructor@example.com"
                      {...field}
                    />
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
                  <FormLabel>Course Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter course name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="courseCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Code</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., CS101" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category (single-select) */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="HD">HD</SelectItem>
                      <SelectItem value="FD">FD</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Request Type (single-select via Radio Group) */}
            <FormField
              control={form.control}
              name="requestType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Request Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="space-y-2"
                    >
                      {REQUEST_TYPES.map((type) => (
                        <div key={type} className="flex items-center space-x-3">
                          <RadioGroupItem id={type} value={type} />
                          <FormLabel htmlFor={type} className="font-normal">
                            {type}
                          </FormLabel>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-primary text-white"
              >
                {isLoading ? "Creating..." : "Create Request"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
