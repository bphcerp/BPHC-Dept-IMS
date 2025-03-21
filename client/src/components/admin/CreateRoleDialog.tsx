import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { adminSchemas } from "lib";

export function CreateRoleDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<adminSchemas.RoleCreateBody>({
    resolver: zodResolver(adminSchemas.roleCreateBodySchema),
    defaultValues: {
      name: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (name: string) => {
      await api.post("/admin/role/create", {
        name,
      });
    },
    onSuccess: () => {
      toast.success("Role created successfully");
      void queryClient.refetchQueries(["roles"]);
      setOpen(false);
      form.reset();
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        const { response } = error;
        if (response?.status === 409) {
          form.setError("name", {
            message: "Role with that name already exists",
          });
        } else {
          toast.error("Failed to create role");
        }
      }
    },
  });

  function onSubmit(values: adminSchemas.RoleCreateBody) {
    submitMutation.mutate(values.name);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">Create Role</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Role</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={(e) => {
              void form.handleSubmit(onSubmit)(e);
            }}
            className="flex flex-col gap-3"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter role name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="self-end"
              disabled={submitMutation.isLoading}
            >
              Create Role
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
