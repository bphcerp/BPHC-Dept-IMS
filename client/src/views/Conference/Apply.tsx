import type React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { ApplyForm, schema, Schema } from "@/components/conference/ApplyForm";
import { useNavigate } from "react-router-dom";

const ConferenceApplyView: React.FC = () => {
  const navigate = useNavigate();

  const form = useForm<Schema>({
    resolver: zodResolver(schema),
  });

  const submitMutation = useMutation({
    mutationFn: async (data: Schema) => {
      const formData = new FormData();
      for (const [key, value] of Object.entries(data)) {
        if (value instanceof File) {
          formData.append(key, value);
        } else if (value instanceof Date) {
          formData.append(key, value.toISOString());
        } else if (Array.isArray(value)) {
          const filteredArray =
            key === "reimbursements" || key === "fundingSplit"
              ? value.filter(
                  (item: any) => item.amount && parseFloat(item.amount) > 0
                )
              : value;
          formData.append(key, JSON.stringify(filteredArray));
        } else if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      }
      return await api.post("/conference/createApplication", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
    onError: (err) => {
      if (isAxiosError(err))
        toast.error((err.response?.data as string) ?? "An error occurred");
    },
    onSuccess: () => {
      toast.success("Application submitted successfully");
      form.reset();
      navigate("../submitted");
    },
  });

  const onSubmit: SubmitHandler<Schema> = (formData) => {
    submitMutation.mutate(formData);
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-start justify-center gap-6 bg-background-faded p-8">
      <h2 className="self-start text-3xl font-normal">Apply for Conference</h2>
      <ApplyForm
        form={form}
        isLoading={submitMutation.isLoading}
        submitHandler={onSubmit}
      />
    </div>
  );
};

export default ConferenceApplyView;
