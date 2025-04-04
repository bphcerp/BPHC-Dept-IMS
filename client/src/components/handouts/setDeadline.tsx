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

const deadlineBodySchema = z.object({
  time: z.date(),
});

type DeadlineBody = z.infer<typeof deadlineBodySchema>;

export const SetDeadlineDialog: React.FC = () => {
  const deadlineMutation = useMutation({
    mutationFn: async (data: DeadlineBody) => {
      await api.post("/handout/dcaconvenor/reminder", data);
    },
    onSuccess: () => {
      toast.success("Reminder sent successfully");
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        toast.error(`Error sending reminders:, ${error.response?.data}`);
      }
      toast.error("Error sending reminders");
    },
  });

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
    defaultValues: { time: setDefaultDate() },
  });

  function onSubmit(data: DeadlineBody) {
    deadlineMutation.mutate({ time: new Date(data.time) });
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
    <Dialog>
      <DialogTrigger>
        <Button variant="outline" className="hover:bg-primary hover:text-white">
          Set Deadline & Send Reminder
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Deadliner</DialogTitle>
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
              <div className="flex w-full justify-end">
                <Button type="submit">Set Deadline</Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
