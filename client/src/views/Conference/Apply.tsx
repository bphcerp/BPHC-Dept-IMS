import type React from "react";
import { Button } from "@/components/ui/button";
import { conferenceSchemas } from "lib";
import { CardContent, CardFooter } from "@/components/ui/card";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { isAxiosError } from "axios";
import { toast } from "sonner";

const ConferenceApplyView: React.FC = () => {
  const form = useForm<conferenceSchemas.CreateApplicationBody>({
    resolver: zodResolver(conferenceSchemas.createApplicationBodySchema),
  });

  const submitMutation = useMutation({
    mutationFn: async (data: conferenceSchemas.CreateApplicationBody) => {
      return await api.post("/conference/createApplication", data);
    },
    onError: (err) => {
      if (isAxiosError(err))
        toast.error((err.response?.data as string) ?? "An error occurred");
    },
    onSuccess: () => {
      toast.success("Application submitted successfully");
    },
  });

  const onSubmit: SubmitHandler<conferenceSchemas.CreateApplicationBody> = (
    formData
  ) => {
    submitMutation.mutate(formData);
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center p-8">
      <Form {...form}>
        <form
          onSubmit={(e) => {
            void form.handleSubmit(onSubmit)(e);
          }}
          className="w-full max-w-5xl"
        >
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {(
                [
                  "purpose",
                  "contentTitle",
                  "eventName",
                  "venue",
                  "organizedBy",
                  "description",
                ] as const
              ).map((fieldName) => {
                return (
                  <FormField
                    key={fieldName}
                    control={form.control}
                    name={fieldName}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {fieldName.replace(/([A-Z]+)/g, " $1").toUpperCase()}
                        </FormLabel>
                        <FormControl>
                          {fieldName !== "description" ? (
                            <Input {...field} />
                          ) : (
                            <Textarea {...field} />
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                );
              })}
              <FormField
                control={form.control}
                name="modeOfEvent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>MODE OF EVENT</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="offline">Offline</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>DATE</FormLabel>
                    <Popover>
                      <FormControl>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              !field.value && "text-muted-foreground",
                              "w-full items-start"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                      </FormControl>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date <= new Date() || date >= new Date("2100-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {(
                [
                  "travelReimbursement",
                  "registrationFeeReimbursement",
                  "dailyAllowanceReimbursement",
                  "accomodationReimbursement",
                  "otherReimbursement",
                ] as const
              ).map((fieldName) => {
                return (
                  <FormField
                    key={fieldName}
                    control={form.control}
                    name={fieldName}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {fieldName.replace(/([A-Z]+)/g, " $1").toUpperCase()}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            onChange={(e) => {
                              if (!e.target.value.length)
                                form.setValue(fieldName, undefined);
                              else field.onChange(e);
                            }}
                            type="number"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                );
              })}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="submit" disabled={submitMutation.isLoading}>
              Submit
            </Button>
          </CardFooter>
        </form>
      </Form>
    </div>
  );
};

export default ConferenceApplyView;
