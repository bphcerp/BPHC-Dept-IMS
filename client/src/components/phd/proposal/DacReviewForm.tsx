// client/src/components/phd/proposal/DacReviewForm.tsx
import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { phdSchemas } from "lib";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FileUploader } from "@/components/ui/file-uploader";
import { toast } from "sonner";
import { useState } from 'react';
import { LoadingSpinner } from "@/components/ui/spinner";

interface DacReviewFormProps {
  proposalId: number;
  onSubmit: (formData: FormData) => void;
  isSubmitting: boolean;
}

// Helper component for radio groups
const FormRadioGroup = ({ control, name, label, items, error }: any) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <RadioGroup
          onValueChange={field.onChange}
          value={field.value}
          className="flex flex-col space-y-1"
        >
          {items.map((item: any) => (
            <div key={item.value} className="flex items-center space-x-3">
              <RadioGroupItem value={item.value} id={`${name}-${item.value}`} />
              <Label htmlFor={`${name}-${item.value}`}>{item.label}</Label>
            </div>
          ))}
        </RadioGroup>
      )}
    />
    {error && <p className="text-xs text-destructive">{error.message}</p>}
  </div>
);

export const DacReviewForm: React.FC<DacReviewFormProps> = ({
  onSubmit,
  isSubmitting,
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<phdSchemas.DacReviewFormData>({
    resolver: zodResolver(phdSchemas.dacReviewFormSchema),
    defaultValues: {
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
    formData.append("comments", data.q8_comments || "See evaluation form.");
    if (feedbackFile) {
      formData.append("feedbackFile", feedbackFile);
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
      {/* All Questions will be rendered here */}
      <h3 className="text-lg font-semibold">1. Proposed Topic of Research</h3>
      <FormRadioGroup
        control={control}
        name="q1a"
        label="a) Is the proposed topic in one of the research areas of the Institute?"
        items={[
          { value: true, label: "Yes" },
          { value: false, label: "No" },
        ]}
        error={errors.q1a}
      />
      {/* ... Repeat for all questions q1b, q1c, etc. ... */}

      <h3 className="text-lg font-semibold">6. Overall Comments</h3>
      <FormRadioGroup
        control={control}
        name="q6"
        label=""
        items={[
          { value: "accepted", label: "Proposal may be accepted" },
          { value: "minor", label: "Proposal needs minor modifications" },
          { value: "revision", label: "Proposal needs revision" },
        ]}
        error={errors.q6}
      />

      <h3 className="text-lg font-semibold">
        7. Reasons for recommendation at item No. 6
      </h3>
      <Controller
        control={control}
        name="q7_reasons"
        render={({ field }) => <Textarea {...field} />}
      />
      {errors.q7_reasons && (
        <p className="text-xs text-destructive">{errors.q7_reasons.message}</p>
      )}

      <h3 className="text-lg font-semibold">8. Any other comments:</h3>
      <Controller
        control={control}
        name="q8_comments"
        render={({ field }) => <Textarea {...field} />}
      />

      <div>
        <Label>Optional Feedback Document (PDF)</Label>
        <FileUploader
          value={feedbackFile ? [feedbackFile] : []}
          onValueChange={(files) => setFeedbackFile(files[0] ?? null)}
          accept={{ "application/pdf": [] }}
        />
      </div>

      <div>
        <Label className="text-lg font-semibold">Final Decision</Label>
        <RadioGroup
          onValueChange={(val: "approved" | "reverted") =>
            setFinalDecision(val)
          }
          className="mt-2 flex gap-4"
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

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? <LoadingSpinner /> : "Submit Review"}
      </Button>
    </form>
  );
};
