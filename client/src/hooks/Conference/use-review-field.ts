import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { conferenceSchemas } from "lib";
import { ZodError } from "zod";

interface ReviewFieldMutationProps {
  status: boolean;
  comments?: string;
  fieldId: number;
  applId: number;
  fieldType: string;
}

const useReviewFieldMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      status,
      comments,
      fieldId,
      applId,
      fieldType,
    }: ReviewFieldMutationProps) => {
      const endpoint = `/conference/fields/review/${fieldType}/${fieldId}?applId=${applId}`;
      const body = conferenceSchemas.reviewFieldBodySchema.parse({
        status,
        comments,
      });
      return await api.post(endpoint, body);
    },
    onError(error) {
      if (isAxiosError(error)) {
        toast.error((error.response?.data as string) ?? "An error occurred");
      } else if (error instanceof ZodError) {
        toast.error("Required fields missing");
      }
    },
    onSuccess(_res, vars) {
      void queryClient.refetchQueries({
        queryKey: ["conference", "applications", vars.applId],
      });
    },
  });
};

export default useReviewFieldMutation;
