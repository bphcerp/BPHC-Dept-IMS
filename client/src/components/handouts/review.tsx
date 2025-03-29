import { HandoutReviewFormValues } from "@/views/Handouts/DCAReview";
import React from "react";

interface ReviewFieldProps {
  name: keyof HandoutReviewFormValues;
  label: string;
  description: string;
  value: boolean;
}

const ReviewField: React.FC<ReviewFieldProps> = ({
  name,
  label,
  description,
  value,
}) => {
  return (
    <div className="flex flex-row items-center justify-between rounded-lg border p-4">
      <div className="space-y-0.5">
        <label htmlFor={name} className="text-base font-medium">
          {label}
        </label>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
      <input id={name} type="checkbox" checked={value} disabled={true} />
    </div>
  );
};

export default ReviewField;
