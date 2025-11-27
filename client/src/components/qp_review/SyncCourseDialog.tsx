import React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from "../ui/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { Semester } from "node_modules/lib/src/types/allocation";
import { SubmitHandler, useForm } from "react-hook-form";
import { qpSchemas } from "lib";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import { Button } from "../ui/button";
import { toast } from "sonner";

interface SyncCourseDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const SyncCourseDialog: React.FC<SyncCourseDialogProps> = ({
  isOpen,
  setIsOpen,
}) => {
  const { data, isLoading } = useQuery({
    queryKey: ["qp-semesters"],
    queryFn: async () => {
      const res = await api.get<Semester[]>(
        `/allocation/semester/getCompleted`
      );
      return res.data;
    },
  });

  const queryClient = useQueryClient();

  const form = useForm<qpSchemas.CreateQPSemesterSchema>({
    resolver: zodResolver(qpSchemas.createQPSemesterSchema),
  });

  const syncMutation = useMutation({
    mutationFn: async (data: { semesterId: string }) => {
      return await api.post("/qp/semester/create", data);
    },
    onSuccess: async () => {
      toast.success("Courses synced successfully");

      await queryClient.invalidateQueries({
        queryKey: ["*"],
      });
      setIsOpen(false);
    },
    onError: () => {
      toast.error("Failed to sync courses");
    },
  });

  const onSubmit: SubmitHandler<qpSchemas.CreateQPSemesterSchema> = (data) => {
    syncMutation.mutate(data);
  };
  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle> Sync Semester&apos;s Courses</DialogTitle>
            <DialogDescription>Loading.....</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sync Semester&apos;s Courses</DialogTitle>
          <DialogDescription>
            Choose Semester To Sync Courses From
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={(e) => {
              void form.handleSubmit(onSubmit)(e);
            }}
            className="flex flex-col gap-2"
          >
            <FormField
              control={form.control}
              name="semesterId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Semester</FormLabel>
                  <div className="flex gap-2">
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {data?.map((el) => {
                          return (
                            <SelectItem value={el.id} key={el.id}>
                              {`${el.year} Sem ${el.semesterType}`}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </FormItem>
              )}
            />
            <DialogFooter className="mt-2">
              <Button type="submit">Sync Courses</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
