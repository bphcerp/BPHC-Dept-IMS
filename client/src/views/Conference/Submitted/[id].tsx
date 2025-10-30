import type React from "react";
import { conferenceSchemas } from "lib";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { isAxiosError } from "axios";
import { useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import BackButton from "@/components/BackButton";
import {
  ApplyForm,
  schema,
  baseSchema,
  Schema,
} from "@/components/conference/ApplyForm";
import { ViewApplication } from "@/components/conference/ViewApplication";
import { isEqual } from "date-fns";
import { toast } from "sonner";

const getChangedFields = (
  formData: Schema,
  originalValues: Partial<Schema>
): Partial<Schema> => {
  const changedFields: Partial<Schema> = {};

  for (const k in formData) {
    const key = k as keyof Schema;
    let currentValue = formData[key];
    const originalValue = originalValues[key];

    if (key === "reimbursements") {
      currentValue = formData[key].filter(
        (item) =>
          item.key?.trim().length && item.amount && parseFloat(item.amount) > 0
      );
    }

    if (key === "fundingSplit") {
      currentValue = formData[key].filter(
        (item) =>
          item.source?.trim().length &&
          item.amount &&
          parseFloat(item.amount) > 0
      );
    }

    if (currentValue instanceof Date && originalValue instanceof Date) {
      // Check date equality
      if (!isEqual(currentValue, originalValue)) {
        changedFields[key] = currentValue as unknown as undefined;
      }
    } else if (
      currentValue instanceof Array &&
      originalValue instanceof Array
    ) {
      const normalizeArray = (arr: Array<Record<string, string>>) =>
        arr
          .map((item) => {
            if (typeof item === "object" && item !== null) {
              const keys = Object.keys(item).sort();
              const normalized: Record<string, string> = {};
              for (const k of keys) {
                normalized[k] = item[k];
              }
              return normalized;
            }
            return item;
          })
          .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));

      if (
        JSON.stringify(normalizeArray(currentValue)) !==
        JSON.stringify(normalizeArray(originalValue))
      ) {
        changedFields[key] = currentValue as unknown as undefined;
      }
    } else if (currentValue !== originalValue) {
      changedFields[key] = currentValue as undefined;
    }
  }

  return changedFields;
};

const ConferenceEditView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [resetValues, setResetValues] = useState<undefined | Partial<Schema>>(
    undefined
  );

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

  const submitMutation = useMutation({
    mutationFn: async (data: Partial<Schema>) => {
      const formData = new FormData();
      for (const [key, value] of Object.entries(data)) {
        if (value instanceof File) {
          formData.append(key, value);
        } else if (value instanceof Date) {
          formData.append(key, value.toISOString());
        } else if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      }
      return await api.post(`/conference/editApplication/${id}`, formData, {
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
      toast.success("Application edited successfully");
      form.reset();
      setResetValues(undefined);
      void queryClient.removeQueries({
        queryKey: ["conference", "applications", parseInt(id!)],
      });
    },
  });

  const isEditable = useMemo(() => {
    if (!data) return false;
    return data.application.state === conferenceSchemas.states[0];
  }, [data]);

  useEffect(() => {
    if (!data) return;
    if (resetValues === undefined) {
      const _resetValues = {
        ...data.application,
        dateFrom: new Date(data.application.dateFrom),
        dateTo: new Date(data.application.dateTo),
        ...conferenceSchemas.fileFieldNames.reduce(
          (acc, key) => {
            acc[key] = data.application[key]?.url;
            return acc;
          },
          {} as Record<
            (typeof conferenceSchemas.fileFieldNames)[number],
            string | undefined
          >
        ),
      };

      const schemaKeys = Object.keys(baseSchema.shape) as (keyof Schema)[];
      const filteredResetValues = schemaKeys.reduce((acc, key) => {
        acc[key] = _resetValues[key] as never;
        return acc;
      }, {} as Partial<Schema>);

      form.reset(filteredResetValues);
      setResetValues(filteredResetValues);
    }
  }, [data, form, resetValues]);

  const onSubmit: SubmitHandler<Schema> = (formData) => {
    if (!resetValues) return;

    const changedFields = getChangedFields(formData, resetValues);

    if (Object.keys(changedFields).length === 0)
      return toast.error("No changes made to the application");

    submitMutation.mutate(formData);
  };

  if (isError || !resetValues || !data)
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
    <div className="relative flex min-h-screen w-full flex-col gap-6 p-8">
      <BackButton />
      <h2 className="self-start text-3xl">Application No. {id}</h2>
      {isEditable ? (
        <>
          <div className="flex w-full max-w-3xl flex-col gap-2 rounded-md border bg-destructive/20 p-2">
            <h4 className="text-destructive">Changes requested</h4>
            <p className="text-sm text-muted-foreground">
              You can edit the fields below and submit the application again.
            </p>
            <p className="text-sm text-muted-foreground">
              Comments: {data.reviews[0]?.comments ?? "N/A"}
            </p>
          </div>
          <ApplyForm
            form={form}
            isLoading={false}
            submitHandler={onSubmit}
            originalValues={resetValues}
            getChangedFields={getChangedFields}
          />
        </>
      ) : (
        <ViewApplication data={data} />
      )}
    </div>
  );
};

export default ConferenceEditView;
