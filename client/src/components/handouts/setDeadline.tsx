import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { isAxiosError } from "axios";
import { addDays, setHours, setMinutes, setSeconds } from "date-fns";
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
  time: z.date(),
  emailBody: z.string().nonempty(),
});

type DeadlineBody = z.infer<typeof deadlineBodySchema>;

export const SetDeadlineDialog: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const editorTheme = useTheme();

  const deadlineMutation = useMutation({
    mutationFn: async (data: DeadlineBody) => {
      await api.post("/handout/dcaconvenor/reminder", data);
    },
    onSuccess: () => {
      toast.success("Reminder sent successfully");
      setOpen(false);
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        toast.error(`Error sending reminders:, ${error.response?.data}`);
      }
      toast.error("Error sending reminders");
    },
  });

  const DEFAULT_EMAIL_BODY = `Dear Professor/Mr./Ms.,

Please upload the handouts for the requested courses. Ignore this email if all you handouts have been approved.

You may access the portal using the following link: ${FRONTEND_URL}

Best regards,  
Team IMS  
${DEPARTMENT_NAME_FULL ?? ""}  
BPHC.
`;

  function setDefaultDate() {
    let date = new Date();
    date = addDays(date, 1);
    date = setHours(date, 17);
    date = setMinutes(date, 0);
    date = setSeconds(date, 0);
    return date;
  }

  const form = useForm<DeadlineBody>({
    resolver: zodResolver(deadlineBodySchema),
    defaultValues: { time: setDefaultDate(), emailBody: DEFAULT_EMAIL_BODY },
  });

  function onSubmit(data: DeadlineBody) {
    deadlineMutation.mutate({
      time: new Date(data.time),
      emailBody: DEFAULT_EMAIL_BODY,
    });
  }

  function handleDateSelect(date: Date | undefined) {
    if (date) {
      form.setValue("time", new Date(date));
    }
  }

  function handleTimeChange(type: "hour" | "minute", value: string) {
    const currentDate = form.getValues("time");
    const newDate = new Date(currentDate || new Date());

    if (type === "hour") {
      const hour = parseInt(value, 10);
      newDate.setHours(hour);
    } else if (type === "minute") {
      newDate.setMinutes(parseInt(value, 10));
    }
    form.setValue("time", newDate);
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
        <DialogTrigger>
          <Button
            variant="outline"
            className="hover:bg-primary hover:text-white"
          >
            Set Deadline & Send Reminder
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Deadline</DialogTitle>
          </DialogHeader>
          <div>
            <Form {...form}>
              <form
                onSubmit={(e) => {
                  void form.handleSubmit(onSubmit)(e);
                }}
                className="space-y-5"
              >
                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem className="flex flex-col items-center">
                      <FormLabel>Enter your date & time (24h)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full max-w-sm pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "MM/dd/yyyy HH:mm")
                              ) : (
                                <span>MM/DD/YYYY HH:mm</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto -translate-y-4 translate-x-6 scale-90 p-0">
                          <div className="sm:flex">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              required={true}
                              onSelect={handleDateSelect}
                              initialFocus
                            />
                            <div className="flex flex-col divide-y sm:h-[300px] sm:flex-row sm:divide-x sm:divide-y-0">
                              <ScrollArea className="w-64 sm:w-auto">
                                <div className="flex p-2 sm:flex-col">
                                  {Array.from({ length: 24 }, (_, i) => i).map(
                                    (hour) => (
                                      <Button
                                        key={hour}
                                        size="icon"
                                        variant={
                                          field.value &&
                                          field.value.getHours() === hour
                                            ? "default"
                                            : "ghost"
                                        }
                                        className="aspect-square shrink-0 sm:w-full"
                                        onClick={() =>
                                          handleTimeChange(
                                            "hour",
                                            hour.toString()
                                          )
                                        }
                                      >
                                        {hour}
                                      </Button>
                                    )
                                  )}
                                </div>
                                <ScrollBar
                                  orientation="horizontal"
                                  className="sm:hidden"
                                />
                              </ScrollArea>
                              <ScrollArea className="w-64 sm:w-auto">
                                <div className="flex p-2 sm:flex-col">
                                  {Array.from(
                                    { length: 12 },
                                    (_, i) => i * 5
                                  ).map((minute) => (
                                    <Button
                                      key={minute}
                                      size="icon"
                                      variant={
                                        field.value &&
                                        field.value.getMinutes() === minute
                                          ? "default"
                                          : "ghost"
                                      }
                                      className="aspect-square shrink-0 sm:w-full"
                                      onClick={() =>
                                        handleTimeChange(
                                          "minute",
                                          minute.toString()
                                        )
                                      }
                                    >
                                      {minute.toString().padStart(2, "0")}
                                    </Button>
                                  ))}
                                </div>
                                <ScrollBar
                                  orientation="horizontal"
                                  className="sm:hidden"
                                />
                              </ScrollArea>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex w-full justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (!previewOpen) setPreviewOpen(true);
                    }}
                  >
                    Preview Email
                  </Button>
                  <Button type="submit">Set Deadline</Button>
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
                name="emailBody"
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
