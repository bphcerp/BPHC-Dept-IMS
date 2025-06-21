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
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { SubmitHandler, UseFormReturn, useFieldArray } from "react-hook-form";
import { FileUploader } from "@/components/ui/file-uploader";
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
import { useEffect } from "react";
import { FundingSplitDialog, type FundingSplit } from "./FundingSplitDialog";

const fileFieldsObject = Object.fromEntries(
  conferenceSchemas.fileFieldNames.map((x) => [
    x,
    z.instanceof(File).or(z.string()).nullish(),
  ])
) as Record<
  (typeof conferenceSchemas.fileFieldNames)[number],
  z.ZodOptional<z.ZodNullable<z.ZodUnion<[z.ZodType<File>, z.ZodString]>>>
>;

export const schema = conferenceSchemas.upsertApplicationClientSchema.merge(
  z.object({
    ...fileFieldsObject,
  })
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

const defaultReimbursementFields = [
  "Travel",
  "Registration Fee",
  "Daily Allowance",
  "Accommodation",
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
  getChangedFields,
}: {
  submitHandler: SubmitHandler<Schema>;
  isLoading: boolean;
  form: UseFormReturn<Schema>;
  originalValues?: Partial<Schema>;
  getChangedFields?: (
    formData: Schema,
    originalValues: Partial<Schema>
  ) => Partial<Schema>;
}) => {
  const dateTo = form.watch("dateTo");
  const dateFrom = form.watch("dateFrom");
  const fundingSplit: FundingSplit[] = form.watch("fundingSplit") || [];

  const totalReimbursement =
    form
      .watch("reimbursements")
      ?.reduce(
        (acc: number, item: { amount?: string }) =>
          acc + (item?.amount ? parseFloat(item.amount) || 0 : 0),
        0
      ) ?? 0;

  useEffect(() => {
    const reimbursements = form.getValues("reimbursements") || [];
    let changed = false;
    defaultReimbursementFields.forEach((label, idx) => {
      if (!reimbursements[idx] || reimbursements[idx].key !== label) {
        reimbursements[idx] = { key: label, amount: "" };
        changed = true;
      }
    });
    if (changed) {
      form.setValue("reimbursements", reimbursements);
    }
    const currentFundingSplit: FundingSplit[] =
      form.getValues("fundingSplit") || [];
    if (totalReimbursement > 0 && currentFundingSplit.length === 0) {
      form.setValue("fundingSplit", [
        { source: "Personal Funds", amount: totalReimbursement.toFixed(2) },
      ]);
    } else if (totalReimbursement === 0) {
      // Clear funding split when total becomes 0
      form.setValue("fundingSplit", []);
    } else if (totalReimbursement > 0 && currentFundingSplit.length > 0) {
      // Update existing split to match new total for any positive amount
      const totalAllocated = currentFundingSplit.reduce(
        (sum, split) => sum + parseFloat(split.amount || "0"),
        0
      );
      // Use a smaller tolerance for detecting changes
      if (Math.abs(totalAllocated - totalReimbursement) > 0.001) {
        if (totalAllocated === 0) {
          // If current allocation is 0, distribute equally among sources
          const amountPerSource =
            totalReimbursement / currentFundingSplit.length;
          const updatedSplit: FundingSplit[] = currentFundingSplit.map(
            (split) => ({
              ...split,
              amount: amountPerSource.toFixed(2),
            })
          );
          form.setValue("fundingSplit", updatedSplit);
        } else {
          // Proportionally adjust existing allocations
          const ratio = totalReimbursement / totalAllocated;
          const updatedSplit: FundingSplit[] = currentFundingSplit.map(
            (split) => ({
              ...split,
              amount: (parseFloat(split.amount || "0") * ratio).toFixed(2),
            })
          );
          form.setValue("fundingSplit", updatedSplit);
        }
      }
    }
  }, [form, totalReimbursement]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "reimbursements",
  });

  useEffect(() => {
    if (fields.length === 0) {
      const initialReimbursements = defaultReimbursementFields.map((label) => ({
        key: label,
        amount: "",
      }));
      form.setValue("reimbursements", initialReimbursements);
    }
  }, [fields.length, form]);

  const isFieldChanged = (fieldName: keyof Schema): boolean => {
    if (!originalValues || !getChangedFields) return false;
    const currentFormData = form.getValues();
    const changedFields = getChangedFields(currentFormData, originalValues);
    return fieldName in changedFields;
  };

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
                      <ChangedIndicator isChanged={isFieldChanged(fieldName)} />
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
                      isFieldChanged("dateFrom") || isFieldChanged("dateTo")
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
            <ChangedIndicator isChanged={isFieldChanged("reimbursements")} />
          </p>
          <div className="flex items-center gap-4">
            <div className="flex flex-1 flex-col gap-4">
              {fields.map((field, index) => {
                const isDefault = defaultReimbursementFields.some(
                  (label, idx) => idx === index && field.key === label
                );
                return (
                  <div key={field.id} className="flex items-start gap-4">
                    {/* Field Name Input */}
                    <FormField
                      control={form.control}
                      name={`reimbursements.${index}.key`}
                      render={({ field: keyField }) => (
                        <FormItem className="w-64">
                          <FormControl>
                            {isDefault ? (
                              <Input value={field.key} readOnly />
                            ) : (
                              <Input placeholder="e.g., Other" {...keyField} />
                            )}
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Amount Input */}
                    <FormField
                      control={form.control}
                      name={`reimbursements.${index}.amount`}
                      render={({ field: amountField }) => (
                        <FormItem className="w-48">
                          <FormControl>
                            <Input
                              type="number"
                              inputMode="decimal"
                              placeholder="Amount in ₹"
                              step="0.01"
                              {...amountField}
                              onChange={(e) => {
                                const value = e.target.value;
                                amountField.onChange(
                                  value === "" ? undefined : value
                                );
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Delete Button (only for non-default fields) */}
                    {!isDefault && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                );
              })}

              {/* Add Field Button */}
              <Button
                type="button"
                variant="outline"
                onClick={() => append({ key: "", amount: "" })}
                className="self-start"
              >
                + Add Field
              </Button>

              {form.formState.errors.reimbursements?.message && (
                <p className="text-sm font-medium text-destructive">
                  {form.formState.errors.reimbursements.message}
                </p>
              )}
            </div>

            <div className="flex flex-col items-center justify-center gap-1">
              <div className="text-lg font-medium">
                Total Amount in ₹: {totalReimbursement.toFixed(2)}
              </div>

              {totalReimbursement > 0 && (
                <>
                  <FundingSplitDialog
                    totalAmount={totalReimbursement}
                    fundingSplit={fundingSplit}
                    onFundingSplitChange={(split) =>
                      form.setValue("fundingSplit", split)
                    }
                  />

                  {fundingSplit.length > 0 && (
                    <div className="mt-2 w-full min-w-[250px] space-y-2 rounded-lg border p-2">
                      <div className="text-sm font-medium">
                        Funding Breakdown:
                        <ChangedIndicator
                          isChanged={isFieldChanged("fundingSplit")}
                        />
                      </div>
                      {fundingSplit.map((split, index) => (
                        <div
                          key={index}
                          className="flex justify-between text-sm"
                        >
                          <span className="truncate">{split.source}:</span>
                          <span>
                            ₹{parseFloat(split.amount || "0").toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
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
                      <ChangedIndicator isChanged={isFieldChanged(fieldName)} />
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
