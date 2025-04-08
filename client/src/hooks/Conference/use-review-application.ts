import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { conferenceSchemas } from "lib";

interface ReviewApplicationMutationProps {
  status: boolean;
  applId: number;
}

const useReviewApplicationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ status, applId }: ReviewApplicationMutationProps) => {
      const endpoint = `/conference/applications/review/${applId}`;
      const body = conferenceSchemas.reviewApplicationBodySchema.parse({
        status,
      });
      return await api.post(endpoint, body);
    },
    onError(error) {
      if (isAxiosError(error)) {
        toast.error((error.response?.data as string) ?? "An error occurred");
      } else {
        throw error;
      }
    },
    onSuccess(_res, vars) {
      void queryClient.refetchQueries({
        queryKey: ["conference", "applications", vars.applId],
      });
    },
  });
};

export default useReviewApplicationMutation;
