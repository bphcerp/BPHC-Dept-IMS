import { FC } from "react";
import { useFormContext, FieldValues } from "react-hook-form";
import { FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormRegisterReturn } from "react-hook-form";

type CustomFormFieldProps = {
  name: string;
  label: string;
  placeholder: string;
  type?: string;
  register: UseFormRegisterReturn;
};

export const CustomFormField: FC<CustomFormFieldProps> = ({
  name,
  label,
  placeholder,
  type = "text",
  register,
}) => {
  const {
    formState: { errors },
  } = useFormContext<FieldValues>();

  return (
    <FormItem>
      <FormLabel className="text-gray-900">{label}</FormLabel>
      <FormControl>
        <Input type={type} placeholder={placeholder} {...register} />
      </FormControl>
      <FormMessage>
        {errors[name] ? (errors[name]?.message as string) : ""}
      </FormMessage>
    </FormItem>
  );
};

