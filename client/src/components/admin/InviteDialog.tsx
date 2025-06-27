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
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { adminSchemas } from "lib";
import { Checkbox } from "@/components/ui/checkbox";
import MDEditor from "@uiw/react-md-editor";
import {
  Dialog as UIDialog,
  DialogContent as UIDialogContent,
  DialogHeader as UIDialogHeader,
  DialogTitle as UIDialogTitle,
} from "@/components/ui/dialog";
import { useTheme } from "@/hooks/use-theme";
import {
  DEPARTMENT_NAME,
  DEPARTMENT_NAME_FULL,
  FRONTEND_URL,
} from "@/lib/constants";

const DEFAULT_EMAIL_BODY = `Dear Professor/Mr./Ms.,

We are pleased to introduce ${DEPARTMENT_NAME} IMS, an Information Management System developed as a collective initiative to streamline and digitize our departmental operations.

The platform is designed to serve as a centralized system with the following key functionalities:

- Maintain a comprehensive database of faculty publications, patents, and projects.
- Track departmental CAPEX (Capital Expenditure) purchases.
- DRC and DCA Activities
- Enable paperless workflows within the department.

Collect and organize details of academic and administrative activities at the faculty, department, and research scholar levels.

You may access the portal using the following link: ${FRONTEND_URL}

We look forward to your active participation in using ${DEPARTMENT_NAME} IMS and contributing to making it an effective and valuable tool for the department.

Best regards,  
Team IMS  
${DEPARTMENT_NAME_FULL ?? ""}  
BPHC.
`;

const InviteDialog = () => {
  const [open, setOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const queryClient = useQueryClient();

  const editorTheme = useTheme();

  const form = useForm<adminSchemas.InviteMemberBody>({
    resolver: zodResolver(adminSchemas.inviteMemberBodySchema),
    defaultValues: {
      email: "",
      type: "faculty",
      sendEmail: false,
      emailBody: DEFAULT_EMAIL_BODY,
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: adminSchemas.InviteMemberBody) => {
      await api.post("/admin/member/invite", data);
    },
    onSuccess: () => {
      setOpen(false);
      form.reset();
      void queryClient.refetchQueries(["members"]);
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

  const onSubmit: SubmitHandler<adminSchemas.InviteMemberBody> = (data) => {
    submitMutation.mutate(data);
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!previewOpen) setOpen(nextOpen);
        }}
        modal
      >
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
                          <SelectItem value="staff">Staff</SelectItem>
                          <SelectItem value="phd">PhD Scholar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sendEmail"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Send email</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              <div className="mt-2 flex flex-row justify-between">
                {form.watch("sendEmail") ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (!previewOpen) setPreviewOpen(true);
                    }}
                  >
                    Preview Email
                  </Button>
                ) : (
                  <span />
                )}
                <Button disabled={submitMutation.isLoading} type="submit">
                  Invite
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      {previewOpen && (
        <UIDialog
          open={previewOpen}
          modal
          onOpenChange={(open) => {
            setPreviewOpen(open);
          }}
        >
          <UIDialogContent className="w-screen max-w-full">
            <UIDialogHeader>
              <UIDialogTitle>Edit Email</UIDialogTitle>
            </UIDialogHeader>
            <div className="py-2" data-color-mode={editorTheme}>
              <FormField
                control={form.control}
                name="emailBody"
                render={({ field }) => (
                  <div className="relative h-full">
                    <MDEditor
                      value={field.value}
                      onChange={field.onChange}
                      height={400}
                      preview="live"
                      commandsFilter={(command) =>
                        command.name !== "fullscreen" ? command : false
                      }
                    />
                  </div>
                )}
              />
            </div>
            <Button className="mt-2" onClick={() => setPreviewOpen(false)}>
              Done
            </Button>
            <style>
              {`
                .wmde-markdown ul { list-style-type: disc; margin-left: 1.5rem; }
                .wmde-markdown ol { list-style-type: decimal; margin-left: 1.5rem; }
              `}
            </style>
          </UIDialogContent>
        </UIDialog>
      )}
    </>
  );
};

export default InviteDialog;
