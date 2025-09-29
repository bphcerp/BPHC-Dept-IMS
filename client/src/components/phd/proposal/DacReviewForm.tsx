// client/src/components/phd/proposal/DacReviewForm.tsx
import React, { useState } from "react";
import { useForm, Controller, Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { phdSchemas } from "lib";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FileUploader } from "@/components/ui/file-uploader";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface DacReviewFormProps {
  onSubmit: (formData: FormData) => void;
  isSubmitting: boolean;
  deadline: string;
}

const FormBooleanRadioGroup = ({
  control,
  name,
  label,
  error,
  disabled,
}: {
  control: Control<any>;
  name: string;
  label: string;
  error?: { message?: string };
  disabled: boolean;
}) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <RadioGroup
          onValueChange={(val) => field.onChange(val === "true")}
          value={String(field.value)}
          className="flex items-center space-x-4"
          disabled={disabled}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="true" id={`${name}-yes`} />
            <Label htmlFor={`${name}-yes`}>Yes</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="false" id={`${name}-no`} />
            <Label htmlFor={`${name}-no`}>No</Label>
          </div>
        </RadioGroup>
      )}
    />
    {error && <p className="text-xs text-destructive">{error.message}</p>}
  </div>
);

const FormEnumRadioGroup = ({
  control,
  name,
  items,
  error,
  disabled,
}: {
  control: Control<any>;
  name: string;
  items: { value: string; label: string }[];
  error?: { message?: string };
  disabled: boolean;
}) => (
  <div>
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <RadioGroup
          onValueChange={field.onChange}
          value={field.value}
          className="flex flex-col space-y-1"
          disabled={disabled}
        >
          {items.map((item) => (
            <div key={item.value} className="flex items-center space-x-3">
              <RadioGroupItem value={item.value} id={`${name}-${item.value}`} />
              <Label htmlFor={`${name}-${item.value}`}>{item.label}</Label>
            </div>
          ))}
        </RadioGroup>
      )}
    />
    {error && <p className="mt-1 text-xs text-destructive">{error.message}</p>}
  </div>
);

export const DacReviewForm: React.FC<DacReviewFormProps> = ({
  onSubmit,
  isSubmitting,
  deadline,
}) => {
  const isDeadlinePassed = new Date(deadline) < new Date();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<phdSchemas.DacReviewFormData>({
    resolver: zodResolver(phdSchemas.dacReviewFormSchema),
    defaultValues: {
      q1a: false,
      q1b: false,
      q1c: false,
      q2a: false,
      q2b: false,
      q2c: false,
      q3a: false,
      q3b: false,
      q3c: false,
      q4a: false,
      q4b: false,
      q4c: false,
      q4d: false,
      q4e: false,
      q4f: false,
      q4g: false,
      q5a: false,
      q5b: false,
      q5c: false,
      q7_reasons: "",
      q8_comments: "",
    },
  });
  const [finalDecision, setFinalDecision] = useState<
    "approved" | "reverted" | null
  >(null);
  const [feedbackFile, setFeedbackFile] = useState<File | null>(null);

  const onFormSubmit = (data: phdSchemas.DacReviewFormData) => {
    if (!finalDecision) {
      toast.error("Please select a final decision (Approve or Revert).");
      return;
    }
    const formData = new FormData();
    formData.append("approved", String(finalDecision === "approved"));
    formData.append("evaluation", JSON.stringify(data));
    formData.append(
      "comments",
      data.q8_comments || data.q7_reasons || "See evaluation form."
    );
    if (feedbackFile) {
      formData.append("feedbackFile", feedbackFile);
    }
    onSubmit(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>DAC Review & Evaluation</CardTitle>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>Note for Reviewers</AlertTitle>
          <AlertDescription>
            If you choose to revert the proposal, only your final comment(number 8) and
            any optional feedback document will be shared with the student. The
            detailed evaluation form is for internal records only.
          </AlertDescription>
        </Alert>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
          {}
          <div className="space-y-4 rounded-md border p-4">
            <h3 className="text-lg font-semibold">
              1. Proposed Topic of Research
            </h3>
            <FormBooleanRadioGroup
              control={control}
              name="q1a"
              label="a) Is the proposed topic in one of the research areas of the Institute?"
              error={errors.q1a}
              disabled={isDeadlinePassed}
            />
            <FormBooleanRadioGroup
              control={control}
              name="q1b"
              label="b) Does the proposed topic reflect the theme propounded in the proposal write up?"
              error={errors.q1b}
              disabled={isDeadlinePassed}
            />
            <FormBooleanRadioGroup
              control={control}
              name="q1c"
              label="c) Is the proposed topic relevant to the needs of the immediate environment?"
              error={errors.q1c}
              disabled={isDeadlinePassed}
            />
            <div>
              <Label>d) Does the proposed topic aim at:</Label>
              <FormEnumRadioGroup
                control={control}
                name="q1d"
                items={[
                  {
                    value: "product",
                    label: "designing an innovative product",
                  },
                  {
                    value: "process",
                    label: "designing a new process or a system",
                  },
                  {
                    value: "frontier",
                    label: "taking up research in an advanced frontier area",
                  },
                ]}
                error={errors.q1d}
                disabled={isDeadlinePassed}
              />
            </div>
          </div>
          {}
          <div className="space-y-4 rounded-md border p-4">
            <h3 className="text-lg font-semibold">
              2. Objective of the proposed research
            </h3>
            <FormBooleanRadioGroup
              control={control}
              name="q2a"
              label="a) Are objectives clearly spelt out?"
              error={errors.q2a}
              disabled={isDeadlinePassed}
            />
            <FormBooleanRadioGroup
              control={control}
              name="q2b"
              label="b) Are objectives derived based on the literature survey?"
              error={errors.q2b}
              disabled={isDeadlinePassed}
            />
            <FormBooleanRadioGroup
              control={control}
              name="q2c"
              label="c) Is the outcome of the work clearly visualized?"
              error={errors.q2c}
              disabled={isDeadlinePassed}
            />
            <div>
              <Label>d) The outcome of the work:</Label>
              <FormEnumRadioGroup
                control={control}
                name="q2d"
                items={[
                  {
                    value: "improve",
                    label: "will improve the present state of art",
                  },
                  {
                    value: "academic",
                    label: "will only be of an academic interest",
                  },
                  {
                    value: "industry",
                    label: "will be useful for the industries",
                  },
                ]}
                error={errors.q2d}
                disabled={isDeadlinePassed}
              />
            </div>
          </div>
          {}
          <div className="space-y-4 rounded-md border p-4">
            <h3 className="text-lg font-semibold">
              3. Background of the Proposed Research
            </h3>
            <FormBooleanRadioGroup
              control={control}
              name="q3a"
              label="a) Is the literature survey up-to-date and adequately done?"
              error={errors.q3a}
              disabled={isDeadlinePassed}
            />
            <FormBooleanRadioGroup
              control={control}
              name="q3b"
              label="b) Is a broad summary of the present status given?"
              error={errors.q3b}
              disabled={isDeadlinePassed}
            />
            <FormBooleanRadioGroup
              control={control}
              name="q3c"
              label="c) Are unsolved academic issues in the area highlighted?"
              error={errors.q3c}
              disabled={isDeadlinePassed}
            />
          </div>
          {}
          <div className="space-y-4 rounded-md border p-4">
            <h3 className="text-lg font-semibold">4. Methodology</h3>
            <FormBooleanRadioGroup
              control={control}
              name="q4a"
              label="a) Is the methodology for literature survey given?"
              error={errors.q4a}
              disabled={isDeadlinePassed}
            />
            <FormBooleanRadioGroup
              control={control}
              name="q4b"
              label="b) Are data sources identified?"
              error={errors.q4b}
              disabled={isDeadlinePassed}
            />
            <FormBooleanRadioGroup
              control={control}
              name="q4c"
              label="c) Are experimental facilities clearly envisaged?"
              error={errors.q4c}
              disabled={isDeadlinePassed}
            />
            <FormBooleanRadioGroup
              control={control}
              name="q4d"
              label="d) Are envisaged experimental set-ups available?"
              error={errors.q4d}
              disabled={isDeadlinePassed}
            />
            <FormBooleanRadioGroup
              control={control}
              name="q4e"
              label="e) If not available, is it explained how work will be carried out?"
              error={errors.q4e}
              disabled={isDeadlinePassed}
            />
            <FormBooleanRadioGroup
              control={control}
              name="q4f"
              label="f) Are required computing facilities available?"
              error={errors.q4f}
              disabled={isDeadlinePassed}
            />
            <FormBooleanRadioGroup
              control={control}
              name="q4g"
              label="g) Is methodology for completion clearly spelt out?"
              error={errors.q4g}
              disabled={isDeadlinePassed}
            />
          </div>
          {}
          <div className="space-y-4 rounded-md border p-4">
            <h3 className="text-lg font-semibold">5. Literature References</h3>
            <FormBooleanRadioGroup
              control={control}
              name="q5a"
              label="a) Is citation done in a standard format?"
              error={errors.q5a}
              disabled={isDeadlinePassed}
            />
            <FormBooleanRadioGroup
              control={control}
              name="q5b"
              label="b) Is cited literature referred in the text?"
              error={errors.q5b}
              disabled={isDeadlinePassed}
            />
            <FormBooleanRadioGroup
              control={control}
              name="q5c"
              label="c) Is cited literature relevant to the proposed work?"
              error={errors.q5c}
              disabled={isDeadlinePassed}
            />
          </div>
          {}
          <div className="space-y-4 rounded-md border p-4">
            <h3 className="text-lg font-semibold">6. Overall Comments</h3>
            <FormEnumRadioGroup
              control={control}
              name="q6"
              items={[
                { value: "accepted", label: "Proposal may be accepted" },
                { value: "minor", label: "Proposal needs minor modifications" },
                { value: "revision", label: "Proposal needs revision" },
              ]}
              error={errors.q6}
              disabled={isDeadlinePassed}
            />
          </div>
          {}
          <div className="space-y-4 rounded-md border p-4">
            <div className="space-y-2">
              <Label htmlFor="q7_reasons" className="font-semibold">
                7. Reasons for recommendation at item No. 6: *
              </Label>
              <Controller
                control={control}
                name="q7_reasons"
                render={({ field }) => (
                  <Textarea {...field} disabled={isDeadlinePassed} />
                )}
              />
              {errors.q7_reasons && (
                <p className="text-xs text-destructive">
                  {errors.q7_reasons.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="q8_comments" className="font-semibold">
                8. Any other comments:
              </Label>
              <Controller
                control={control}
                name="q8_comments"
                render={({ field }) => (
                  <Textarea {...field} disabled={isDeadlinePassed} />
                )}
              />
            </div>
          </div>
          <div>
            <Label>Optional Feedback Document (PDF)</Label>
            <FileUploader
              value={feedbackFile ? [feedbackFile] : []}
              onValueChange={(files) => setFeedbackFile(files[0] ?? null)}
              accept={{ "application/pdf": [] }}
              disabled={isDeadlinePassed}
            />
          </div>
          <div className="space-y-2 rounded-md border p-4">
            <Label className="text-lg font-semibold">Final Decision</Label>
            <RadioGroup
              onValueChange={(val: "approved" | "reverted") =>
                setFinalDecision(val)
              }
              className="mt-2 flex gap-4"
              disabled={isDeadlinePassed}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="approved" id="approve" />
                <Label htmlFor="approve">Approve</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="reverted" id="revert" />
                <Label htmlFor="revert">Revert with comments</Label>
              </div>
            </RadioGroup>
          </div>
          <Button
            type="submit"
            disabled={isSubmitting || isDeadlinePassed}
            title={isDeadlinePassed ? "The deadline for review has passed" : ""}
          >
            {isSubmitting ? <LoadingSpinner /> : "Submit Review"}
          </Button>
          {isDeadlinePassed && (
            <p className="mt-4 text-center text-sm text-destructive">
              The deadline to submit this review has passed.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
};
