import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { toast } from "sonner";
import { phdSchemas } from "lib";
import { LoadingSpinner } from "../ui/spinner";

type ExamEventFormData = z.infer<typeof phdSchemas.createExamEventSchema>;

interface CreateExamEventDialogProps {
  selectedSemesterId: number | null;
  onSuccess: () => void;
}

export const CreateExamEventDialog: React.FC<CreateExamEventDialogProps> = ({
  selectedSemesterId,
  onSuccess,
}) => {
  const [open, setOpen] = useState(false);

  const form = useForm<ExamEventFormData>({
    resolver: zodResolver(phdSchemas.createExamEventSchema),
    // ✅ CORRECTED: All fields are now initialized as required strings
    defaultValues: {
      type: "QualifyingExam",
      name: "",
      registrationDeadline: "",
      examStartDate: "",
      examEndDate: "",
      vivaDate: "",
    },
  });

  useEffect(() => {
    if (selectedSemesterId) {
      form.setValue("semesterId", selectedSemesterId);
    }
  }, [selectedSemesterId, form.setValue]);


  const createMutation = useMutation({
    mutationFn: async (data: ExamEventFormData) => {
      const payload = {
        ...data,
        semesterId: selectedSemesterId,
      };
      await api.post("/phd/staff/exam-events", payload);
    },
    onSuccess: () => {
      toast.success("Exam event created successfully");
      form.reset();
      setOpen(false);
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to create exam event",
      );
    },
  });

  const onSubmit = (data: ExamEventFormData) => {
    createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={!selectedSemesterId}>Create Exam Event</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Exam Event</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="QualifyingExam">Qualifying Exam</SelectItem>
                      <SelectItem value="ThesisProposal">Thesis Proposal</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., QE Semester 1 2025-26" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="registrationDeadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registration Deadline</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="examStartDate"
              render={({ field }) => (
                <FormItem>
                  {/* ✅ CORRECTED: Removed "(Optional)" from label */}
                  <FormLabel>Exam Start Date</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="examEndDate"
              render={({ field }) => (
                <FormItem>
                  {/* ✅ CORRECTED: Removed "(Optional)" from label */}
                  <FormLabel>Exam End Date</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="vivaDate"
              render={({ field }) => (
                <FormItem>
                  {/* ✅ CORRECTED: Removed "(Optional)" from label */}
                  <FormLabel>Viva Date</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isLoading}>
                {createMutation.isLoading && <LoadingSpinner className="mr-2" />}
                Create Event
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};