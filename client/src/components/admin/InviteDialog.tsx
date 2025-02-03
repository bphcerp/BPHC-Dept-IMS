import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import api from "@/lib/axios-instance";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";

const schema = z.object({
  email: z.string().email(),
  type: z.enum(["faculty", "phd"], {
    message: "Please select a value",
  }),
});
type FormFields = z.infer<typeof schema>;

const InviteDialog = () => {
  const [open, setOpen] = useState(false);

  const form = useForm<FormFields>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: FormFields) => {
      await api.post("/admin/member/invite", data);
    },
    onSuccess: () => {
      setOpen(false);
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        if (error.response?.status === 409) {
          form.setError("email", {
            message: "Member with this email already exists",
          });
        }
      } else {
        toast.error("An error occurred");
      }
    },
  });

  const onSubmit: SubmitHandler<FormFields> = (data) => {
    submitMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Invite</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite member</DialogTitle>
          <DialogDescription>
            Invite a new member to the platform
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} className="col-span-3" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
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
                        <SelectItem value="faculty">Faculty</SelectItem>
                        <SelectItem value="phd">PhD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              disabled={submitMutation.isLoading}
              className="mt-2 self-end"
              type="submit"
            >
              Invite
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default InviteDialog;
