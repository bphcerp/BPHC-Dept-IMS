import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormField } from "@/components/ui/form";
import { toast } from "sonner";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { isAxiosError } from "axios";
import { DEPARTMENT_NAME_FULL, FRONTEND_URL } from "@/lib/constants";
import { lazy, Suspense, useState } from "react";
import {
  Dialog as UIDialog,
  DialogContent as UIDialogContent,
  DialogHeader as UIDialogHeader,
  DialogTitle as UIDialogTitle,
} from "@/components/ui/dialog";
const MDEditor = lazy(() => import("@uiw/react-md-editor"));
import { useTheme } from "@/hooks/use-theme";

const deadlineBodySchema = z.object({
  htmlBody: z.string().min(1),
});

type DeadlineBody = z.infer<typeof deadlineBodySchema>;

interface InitiateQPDialogProps {
  disabled: boolean;
  ids: string[];
  setSelectedStatuses: (statuses: string[]) => void;
}

export const InitiateQPDialog: React.FC<InitiateQPDialogProps> = ({
  disabled,
  ids,
  setSelectedStatuses,
}) => {
  const [open, setOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const editorTheme = useTheme();
  const queryClient = useQueryClient();

  const deadlineMutation = useMutation({
    mutationFn: async (data: DeadlineBody) => {
      await api.post("/qp/initiateRequest", {
        ...data,
        courses: ids?.map((el) => Number(el)),
      });
    },
    onSuccess: async () => {
      toast.success("Reminder sent successfully");
      setOpen(false);
      await queryClient.invalidateQueries({
        queryKey: ["*"],
      });
      setSelectedStatuses([]);
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        toast.error(`Error sending reminders:, ${error.response?.data}`);
      }
      toast.error("Error sending reminders");
    },
  });

  const DEFAULT_EMAIL_BODY = `Dear Professor/Mr./Ms.,

Please upload the question papers and corresponding solutions for the requested courses. Ignore this email if it has already been done.

You may access the portal using the following link: ${FRONTEND_URL}

Best regards,  
Team IMS  
${DEPARTMENT_NAME_FULL ?? ""}  
BPHC.
`;

  const form = useForm<DeadlineBody>({
    resolver: zodResolver(deadlineBodySchema),
    defaultValues: { htmlBody: DEFAULT_EMAIL_BODY },
  });

  function onSubmit(data: DeadlineBody) {
    deadlineMutation.mutate(data);
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!previewOpen) setOpen(nextOpen);
        }}
        modal
      >
        <DialogTrigger disabled={disabled}>
          <Button
            variant="outline"
            className="hover:bg-primary hover:text-white"
            disabled={disabled}
          >
            Initiate Request
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Initiate Requests</DialogTitle>
          </DialogHeader>
          <div>
            <Form {...form}>
              <form
                onSubmit={(e) => {
                  void form.handleSubmit(onSubmit)(e);
                }}
                className="space-y-5"
              >
                <div className="flex justify-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (!previewOpen) setPreviewOpen(true);
                    }}
                  >
                    Preview Email
                  </Button>
                  <Button type="submit">Initiate</Button>
                </div>
              </form>
            </Form>
          </div>
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
                name="htmlBody"
                render={({ field }) => (
                  <div className="relative h-full">
                    <Suspense
                      fallback={
                        <div className="w-full text-center">
                          Loading editor...
                        </div>
                      }
                    >
                      <MDEditor
                        value={field.value}
                        onChange={field.onChange}
                        height={400}
                        preview="live"
                        commandsFilter={(command) =>
                          command.name !== "fullscreen" ? command : false
                        }
                      />
                    </Suspense>
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
