import type React from "react";
import { Button } from "@/components/ui/button";
import { conferenceSchemas, formSchemas } from "lib";
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
import { CalendarIcon, FileIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { isAxiosError } from "axios";
import { z } from "zod";
import { FileUploader } from "@/components/ui/file-uploader";
import { useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import BackButton from "@/components/BackButton";
import { ProgressStatus } from "@/components/conference/StateProgressBar";

const schema = conferenceSchemas.createApplicationBodySchema.merge(
  z.object(
    Object.fromEntries(
      conferenceSchemas.fileFieldNames.map((x) => [
        x,
        z.instanceof(File).optional(),
      ])
    ) as Record<
      (typeof conferenceSchemas.fileFieldNames)[number],
      z.ZodOptional<z.ZodType<File>>
    >
  )
);

type Schema = z.infer<typeof schema>;

const StatusBadge = ({
  fieldData,
}: {
  fieldData: formSchemas.baseFieldResponse;
}) => (
  <Badge
    variant={
      fieldData.statuses.length
        ? fieldData.statuses[0].status
          ? "default"
          : "destructive"
        : "outline"
    }
  >
    {fieldData.statuses.length
      ? fieldData.statuses[0].status
        ? "Approved"
        : "Rejected"
      : "Pending review"}
  </Badge>
);

const ConferenceEditView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [hasSetForm, setHasSetForm] = useState(false);
  const [editableFields, setEditableFields] = useState<string[]>([]);

  const form = useForm<Schema>({
    resolver: zodResolver(schema),
  });

  const { data, isError, error } = useQuery({
    queryKey: ["conference", "applications", parseInt(id!)],
    queryFn: async () => {
      if (!id) throw new Error("No application ID provided");
      return (
        await api.get<conferenceSchemas.ViewApplicationResponse>(
          `/conference/applications/view/${id}`
        )
      ).data;
    },
    enabled: !!id,
    refetchOnWindowFocus: false,
  });

  const isPending = useMemo(() => data?.status === "pending", [data]);

  useEffect(() => {
    if (!data) return;
    const app = data.conferenceApplication;
    if (!hasSetForm) {
      form.reset({
        purpose: app.purpose?.value ?? "",
        contentTitle: app.contentTitle?.value ?? "",
        description: app.description?.value ?? "",
        eventName: app.eventName?.value ?? "",
        venue: app.venue?.value ?? "",
        organizedBy: app.organizedBy?.value ?? "",
        modeOfEvent:
          (app.modeOfEvent?.value as "online" | "offline") ?? "offline",
        date: app.date?.value ? new Date(app.date.value) : new Date(),
        travelReimbursement: app.travelReimbursement?.value ?? undefined,
        registrationFeeReimbursement:
          app.registrationFeeReimbursement?.value ?? undefined,
        dailyAllowanceReimbursement:
          app.dailyAllowanceReimbursement?.value ?? undefined,
        accommodationReimbursement:
          app.accommodationReimbursement?.value ?? undefined,
        otherReimbursement: app.otherReimbursement?.value ?? undefined,
      });
      setHasSetForm(true);
    }
    setEditableFields(
      isPending
        ? Object.entries(app).reduce(
            (prev, [k, v]) =>
              v &&
              typeof v === "object" &&
              "statuses" in v &&
              v.statuses.length &&
              !v.statuses[0].status
                ? [...prev, k]
                : prev,
            [] as string[]
          )
        : []
    );
  }, [data, form, hasSetForm, isPending]);

  const onSubmit: SubmitHandler<Schema> = (formData) => {
    console.log(formData);
  };

  if (isError || !hasSetForm || !data)
    return (
      <div className="relative flex min-h-screen w-full flex-col items-start justify-start gap-6 bg-background-faded p-8">
        <BackButton />
        {isError
          ? isAxiosError(error) && error.status === 403
            ? "You are not allowed to view this application"
            : "An error occurred"
          : "Loading..."}
      </div>
    );

  return (
    <div className="relative flex min-h-screen w-full flex-col items-start gap-6 bg-background-faded p-8">
      <BackButton />
      <h2 className="self-start text-3xl">Application No. {id}</h2>
      <Form {...form}>
        <form
          onSubmit={(e) => {
            void form.handleSubmit(onSubmit)(e);
          }}
          className="w-full max-w-3xl space-y-4"
        >
          <ProgressStatus
            currentStage={data.conferenceApplication.state}
            currentStatus={data.status}
          />
          <div className="grid grid-cols-1 gap-4">
            {conferenceSchemas.textFieldNames.map((fieldName) => {
              const fieldData = data.conferenceApplication[fieldName];
              return fieldData ? (
                <FormField
                  key={fieldName}
                  control={form.control}
                  name={fieldName}
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-end justify-between">
                        <FormLabel>
                          {fieldName.replace(/([A-Z]+)/g, " $1").toUpperCase()}
                        </FormLabel>
                        {isPending ? (
                          <StatusBadge fieldData={fieldData} />
                        ) : null}
                      </div>

                      {fieldName === "modeOfEvent" ? (
                        editableFields.includes("modeOfEvent") ? (
                          <>
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
                          </>
                        ) : (
                          <Input {...field} disabled />
                        )
                      ) : (
                        <>
                          <FormControl>
                            {fieldName !== "description" ? (
                              <Input
                                {...field}
                                disabled={!editableFields.includes(fieldName)}
                              />
                            ) : (
                              <Textarea
                                {...field}
                                disabled={!editableFields.includes(fieldName)}
                              />
                            )}
                          </FormControl>
                          <FormMessage />
                        </>
                      )}
                    </FormItem>
                  )}
                />
              ) : null;
            })}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-end justify-between">
                    <FormLabel>DATE</FormLabel>
                    {isPending ? (
                      <StatusBadge
                        fieldData={data.conferenceApplication.date!}
                      />
                    ) : null}
                  </div>
                  {editableFields.includes("date") ? (
                    <>
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
                              date <= new Date() ||
                              date >= new Date("2100-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </>
                  ) : (
                    <Input value={field.value.toLocaleDateString()} disabled />
                  )}
                </FormItem>
              )}
            />
            {conferenceSchemas.numberFieldNames.map((fieldName) => {
              const fieldData = data.conferenceApplication[fieldName];
              return fieldData ? (
                <FormField
                  key={fieldName}
                  control={form.control}
                  name={fieldName}
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-end justify-between">
                        <FormLabel>
                          {fieldName.replace(/([A-Z]+)/g, " $1").toUpperCase()}
                        </FormLabel>
                        {isPending ? (
                          <StatusBadge fieldData={fieldData} />
                        ) : null}
                      </div>
                      <FormControl>
                        <Input
                          {...field}
                          onChange={(e) => {
                            if (!e.target.value.length)
                              form.setValue(fieldName, undefined);
                            else field.onChange(e);
                          }}
                          type="number"
                          disabled={!editableFields.includes(fieldName)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null;
            })}
            {conferenceSchemas.fileFieldNames.map((fieldName) => {
              const fieldData = data.conferenceApplication[fieldName];
              return fieldData ? (
                <FormField
                  key={fieldName}
                  control={form.control}
                  name={fieldName}
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-end justify-between">
                        <FormLabel>
                          {fieldName.replace(/([A-Z]+)/g, " $1").toUpperCase()}
                        </FormLabel>
                        {isPending ? (
                          <StatusBadge fieldData={fieldData} />
                        ) : null}
                      </div>

                      <div
                        className="relative flex cursor-pointer gap-2 overflow-clip overflow-ellipsis rounded-md border bg-gray-100 p-2 pl-10 hover:bg-muted/50"
                        onClick={() => {
                          window.open(
                            data.conferenceApplication[fieldName]!.file
                              .filePath,
                            "_blank"
                          );
                        }}
                      >
                        <FileIcon className="absolute left-2" />
                        {
                          data.conferenceApplication[fieldName]!.file
                            .originalName
                        }
                      </div>
                      {editableFields.includes(fieldName) ? (
                        <FormControl>
                          <FileUploader
                            value={field.value ? [field.value] : []}
                            onValueChange={(val) => field.onChange(val[0])}
                            accept={{ "application/pdf": [] }}
                          />
                        </FormControl>
                      ) : null}

                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null;
            })}
          </div>
          {editableFields.length ? (
            <div className="flex justify-end gap-2">
              <Button type="submit">Submit</Button>
            </div>
          ) : null}
        </form>
      </Form>
    </div>
  );
};

export default ConferenceEditView;
