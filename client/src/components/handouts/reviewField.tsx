import React from "react";
import { useController, Control } from "react-hook-form";

interface ReviewFieldProps {
  name: string;
  label: string;
  description: string;
  control: Control<any>;
  disabled: boolean;
}

const ReviewField: React.FC<ReviewFieldProps> = ({
  name,
  label,
  description,
  control,
  disabled,
}) => {
  const {
    field: { value, onChange },
  } = useController({
    name,
    control,
    defaultValue: false,
    disabled,
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
        disabled={disabled}
      />
    </div>
  );
};

export default ReviewField;
