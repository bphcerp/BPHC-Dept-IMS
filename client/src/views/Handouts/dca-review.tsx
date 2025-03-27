import React from "react";
import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import ReviewField from "@/components/handouts/reviewField";
import api from "@/lib/axios-instance";
import { isAxiosError } from "axios";

interface HandoutReviewFormValues {
  handoutId: string;
  scopeAndObjective: boolean;
  textBookPrescribed: boolean;
  lecturewisePlanLearningObjective: boolean;
  lecturewisePlanCourseTopics: boolean;
  numberOfLP: boolean;
  evaluationScheme: boolean;
}

const DCAMemberReviewForm: React.FC = () => {
  const { handoutId } = useParams<{ handoutId: string }>();
  const queryClient = useQueryClient();

  const { handleSubmit, register, control } = useForm<HandoutReviewFormValues>({
    defaultValues: {
      handoutId: handoutId || "",
      scopeAndObjective: false,
      textBookPrescribed: false,
      lecturewisePlanLearningObjective: false,
      lecturewisePlanCourseTopics: false,
      numberOfLP: false,
      evaluationScheme: false,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: HandoutReviewFormValues) => {
      await api.post("/handout/dca/review", data);
    },
    onSuccess: async () => {
      toast.success("Handout review successfully submitted");
      await queryClient.refetchQueries({
        queryKey: ["handouts-dca", "handouts-faculty"],
      });
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        console.log("Error submitting handout review:", error.response?.data);
      }
      toast.error("An error occurred while submitting the review");
    },
  });

  const onSubmit = (data: HandoutReviewFormValues) => {
    mutation.mutate(data);
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-4 text-center text-2xl font-bold">Handout Review</h1>
      <p className="mb-8 text-center text-muted-foreground">
        Review the handout and approve or reject each section.
      </p>

      <form onSubmit={() => handleSubmit(onSubmit)} className="space-y-6">
        <input type="hidden" {...register("handoutId")} />

        <div className="space-y-4">
          <ReviewField
            name="scopeAndObjective"
            label="Scope and Objective"
            description="Check if scope and objectives are clearly defined"
            control={control}
          />
          <ReviewField
            name="textBookPrescribed"
            label="Textbook Prescribed"
            description="Verify if appropriate textbooks are listed"
            control={control}
          />
          <ReviewField
            name="lecturewisePlanLearningObjective"
            label="Learning Objectives"
            description="Check if learning objectives for each lecture are defined"
            control={control}
          />
          <ReviewField
            name="lecturewisePlanCourseTopics"
            label="Course Topics"
            description="Review the lecture-wise course topics"
            control={control}
          />
          <ReviewField
            name="numberOfLP"
            label="Number of Learning Points"
            description="Ensure sufficient learning points are included"
            control={control}
          />
          <ReviewField
            name="evaluationScheme"
            label="Evaluation Scheme"
            description="Check if the evaluation scheme is appropriate"
            control={control}
          />
        </div>

        <Separator className="my-4" />

        <div className="flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Check the box to approve; leave unchecked to reject each section.
          </p>
        </div>
        <Button
          type="submit"
          disabled={mutation.isLoading}
          className="float-right ms-auto w-auto justify-center px-4 py-2 text-sm"
        >
          {" "}
          {mutation.isLoading ? "Submitting..." : "Submit Review"}
        </Button>
      </form>
    </div>
  );
};

export default DCAMemberReviewForm;
