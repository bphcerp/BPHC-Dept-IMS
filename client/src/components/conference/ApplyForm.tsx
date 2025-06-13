import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { conferenceSchemas } from "lib";
import { CalendarIcon, Trash2, XIcon } from "lucide-react";
import { format, isEqual } from "date-fns";
import { Button } from "@/components/ui/button";
import { SubmitHandler, UseFormReturn, useFieldArray } from "react-hook-form";
import { FileUploader } from "../ui/file-uploader";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Form,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";

export const schema = conferenceSchemas.upsertApplicationBodySchema.merge(
  z.object(
    Object.fromEntries(
      conferenceSchemas.fileFieldNames.map((x) => [
        x,
        z.instanceof(File).or(z.string()).nullish(),
      ])
    ) as Record<
      (typeof conferenceSchemas.fileFieldNames)[number],
      z.ZodOptional<z.ZodNullable<z.ZodUnion<[z.ZodType<File>, z.ZodString]>>>
    >
  )
);

export type Schema = z.infer<typeof schema>;

const purposeOptions = [
  "Invited Speaker",
  "Keynote Lecture",
  "Presenting Paper",
  "Chairing Session",
  "Conference (Attending)",
  "Workshop (Attending)",
  "Visiting Laboratory (Under International Collaboration)",
  "Presenting Poster",
  "Journal Page Charges",
  "Others (Consumables or Justification)",
];

const ChangedIndicator = ({ isChanged }: { isChanged?: boolean }) => {
  return isChanged ? (
    <span className="ml-2 text-sm text-red-500">MODIFIED</span>
  ) : null;
};

export const ApplyForm = ({
  submitHandler,
  isLoading,
  form,
  originalValues,
}: {
  submitHandler: SubmitHandler<Schema>;
  isLoading: boolean;
  form: UseFormReturn<Schema>;
  originalValues?: Partial<Schema>;
}) => {
  const dateTo = form.watch("dateTo");
  const dateFrom = form.watch("dateFrom");
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "reimbursements",
  });
  const totalReimbursement =
    form
      .watch("reimbursements")
      ?.reduce(
        (acc: number, item: { amount?: string }) =>
          acc + (item?.amount ? parseFloat(item.amount) || 0 : 0),
        0
      ) ?? 0;
  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          void form.handleSubmit(submitHandler)(e);
        }}
        className="w-full max-w-3xl space-y-4"
      >
        <div className="grid grid-cols-1 gap-4">
          {conferenceSchemas.textFieldNames.map((fieldName) => {
            return (
              <FormField
                key={fieldName}
                control={form.control}
                name={fieldName}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">
                      {conferenceSchemas.fieldsToFrontend[fieldName]}
                      <ChangedIndicator
                        isChanged={
                          originalValues &&
                          originalValues[fieldName] !== field.value
                        }
                      />
                    </FormLabel>
                    {fieldName !== "modeOfEvent" && fieldName !== "purpose" ? (
                      <FormControl>
                        {fieldName !== "description" ? (
                          <Input {...field} />
                        ) : (
                          <Textarea {...field} />
                        )}
                      </FormControl>
                    ) : (
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
                          {fieldName === "purpose" ? (
                            (originalValues?.purpose &&
                            purposeOptions.includes(originalValues.purpose)
                              ? purposeOptions
                              : originalValues?.purpose
                                ? [originalValues.purpose, ...purposeOptions]
                                : purposeOptions
                            ).map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))
                          ) : (
                            <>
                              <SelectItem value="online">Online</SelectItem>
                              <SelectItem value="offline">Offline</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            );
          })}
          <FormField
            control={form.control}
            name={"dateTo"}
            render={() => (
              <FormItem>
                <FormLabel className="font-semibold">
                  Date Range
                  <ChangedIndicator
                    isChanged={
                      originalValues &&
                      (!isEqual(originalValues.dateFrom ?? "", dateFrom) ||
                        !isEqual(originalValues.dateTo ?? "", dateTo))
                    }
                  />
                </FormLabel>
                <Popover>
                  <FormControl>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("w-full items-start")}
                      >
                        <CalendarIcon />
                        {dateFrom ? (
                          dateTo ? (
                            <>
                              {format(dateFrom, "LLL dd, y")} -{" "}
                              {format(dateTo, "LLL dd, y")}
                            </>
                          ) : (
                            format(dateFrom, "LLL dd, y")
                          )
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                  </FormControl>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={{
                        from: dateFrom,
                        to: dateTo,
                      }}
                      onSelect={(range) => {
                        if (range?.from) form.setValue("dateFrom", range.from);
                        if (range?.to) form.setValue("dateTo", range.to);
                      }}
                      disabled={(date) => {
                        return (
                          date < new Date() || date >= new Date("2100-01-01")
                        );
                      }}
                      initialFocus
                      numberOfMonths={2}
                      defaultMonth={new Date()}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <Separator />
          <p>
            Reimbursement expectations (Indicate Approximate Amounts for each):
            <br />
            (Final Approval will be by Accounts)
          </p>
          <div className="flex gap-4 p-4 pt-0">
            <div className="flex flex-1 flex-col gap-4">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-start gap-4">
                  {/* Field Name Input */}
                  <FormField
                    control={form.control}
                    name={`reimbursements.${index}.key`}
                    render={({ field }) => (
                      <FormItem className="min-h-[96px] w-64">
                        <FormLabel className="font-semibold">
                          Field Name
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Travel" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Amount Input */}
                  <FormField
                    control={form.control}
                    name={`reimbursements.${index}.amount`}
                    render={({ field }) => (
                      <FormItem className="min-h-[96px] w-48">
                        <FormLabel className="font-semibold">
                          Amount (₹)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            inputMode="decimal"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value === "" ? undefined : value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Delete Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-6"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}

              {/* Add Field Button */}
              <Button
                type="button"
                variant="outline"
                onClick={() => append({ key: "", amount: "" })}
                className="self-start"
              >
                + Add Field
              </Button>

              {/* Root Error */}
              {form.formState.errors.reimbursements?.message && (
                <p className="text-sm font-medium text-destructive">
                  {form.formState.errors.reimbursements.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-center text-lg font-medium">
              Total Amount in ₹: {totalReimbursement.toFixed(2)}
            </div>
          </div>
          <Separator />
          Enclosures:
          {conferenceSchemas.fileFieldNames.map((fieldName) => {
            return (
              <FormField
                key={fieldName}
                control={form.control}
                name={fieldName}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">
                      {conferenceSchemas.fieldsToFrontend[fieldName]}
                      <ChangedIndicator
                        isChanged={
                          originalValues &&
                          originalValues[fieldName] !== field.value
                        }
                      />
                    </FormLabel>
                    <FormControl>
                      <>
                        {typeof field.value === "string" ? (
                          <>
                            <div className="relative flex items-center justify-between gap-2">
                              <a
                                href={field.value}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline"
                              >
                                Download file
                              </a>
                              <Button
                                variant="outline"
                                type="button"
                                onClick={() => {
                                  form.setValue(fieldName, null);
                                  void form.trigger(fieldName);
                                }}
                                className="aspect-square rounded-full p-1"
                                aria-label="Clear file"
                              >
                                <XIcon />
                              </Button>
                            </div>
                            <div className="relative mt-2 w-full">
                              <iframe
                                src={field.value}
                                className="h-64 w-full rounded border"
                                title="File Preview"
                              />
                            </div>
                          </>
                        ) : (
                          <FileUploader
                            value={field.value ? [field.value] : []}
                            onValueChange={(val) =>
                              field.onChange(val[0] ?? null)
                            }
                            disabled={isLoading}
                            accept={{ "application/pdf": [] }}
                          />
                        )}
                      </>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            );
          })}
        </div>
        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isLoading}>
            Submit
          </Button>
        </div>
      </form>
    </Form>
  );
};
