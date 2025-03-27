import React from "react";
import { useController, Control } from "react-hook-form";

interface ReviewFieldProps {
  name: string;
  label: string;
  description: string;
  control: Control<Record<string, boolean>>;
}

const ReviewField: React.FC<ReviewFieldProps> = ({
  name,
  label,
  description,
  control,
}) => {
  const {
    field: { value, onChange },
  } = useController({
    name,
    control,
    defaultValue: false,
  });

  return (
    <div className="flex flex-row items-center justify-between rounded-lg border p-4">
      <div className="space-y-0.5">
        <label htmlFor={name} className="text-base font-medium">
          {label}
        </label>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
      <input
        id={name}
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5"
      />
    </div>
  );
};

export default ReviewField;
