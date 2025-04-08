import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import Review from "@/components/handouts/review";
import api from "@/lib/axios-instance";
import { Button } from "@/components/ui/button";
import { handoutSchemas } from "lib";
import { ChevronLeft } from "lucide-react";
import { isAxiosError } from "axios";
import { Handout } from "./DCAReview";
import { BASE_API_URL } from "@/lib/constants";
import { Textarea } from "@/components/ui/textarea";

const DCAConvenorReview: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [comments, setComments] = useState("");

  const goBack = () => {
    navigate("/handout/dcaconvenor");
  };
  const { data, isLoading, isError } = useQuery<Handout>({
    queryKey: [`handout-dcaconvenor ${id}`],
    queryFn: async () => {
      try {
        const response = await api.get<{ status: boolean; handout: Handout }>(
          `/handout/get?handoutId=${id}`
        );
        return response.data.handout;
      } catch (error) {
        toast.error("Failed to fetch handouts");
        throw error;
      }
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async (data: handoutSchemas.FinalDecisionBody) => {
      await api.post("/handout/dcaconvenor/finalDecision", data);
    },
    onSuccess: async () => {
      toast.success("Review added successfully");
      navigate("/handout/dcaconvenor");
      await queryClient.invalidateQueries({
        queryKey: [
          "handouts-dca",
          "handouts-faculty",
          `handout-dcaconvenor ${id}`,
          `handout-dca ${id}`,
          `handout-faculty ${id}`,
        ],
      });
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        console.log("Error adding review:", error.response?.data);
      }
      toast.error("An error occurred while adding review");
    },
  });
  function handleSubmit(status: handoutSchemas.HandoutStatus) {
    reviewMutation.mutate({ id: id!, status, comments });
  }

  if (isLoading)
    return (
      <div className="mx-auto flex h-screen items-center justify-center">
        Loading...
      </div>
    );

  if (isError)
    return (
      <div className="mx-auto flex h-screen items-center justify-center text-red-500">
        Error fetching handouts
      </div>
    );

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <Button
        variant={"ghost"}
        onClick={goBack}
        className="size-sm mb-4 flex items-center"
      >
        <ChevronLeft className="mr-1" size={16} />
        Back to Dashboard
      </Button>
      <h1 className="mb-4 text-center text-2xl font-bold">Handout</h1>
      <p className="mb-2 text-center text-muted-foreground">
        <span className="font-bold">Course Name :</span> {data.courseName}
      </p>{" "}
      <p className="mb-4 text-center text-muted-foreground">
        <span className="font-bold">Course Code :</span> {data.courseCode}
      </p>{" "}
      <div className="flex space-x-4">
        <iframe
          src={`${BASE_API_URL}f/${data.handoutFilePath.fileId}`}
          className="my-2 h-[90vh] max-h-[550px] w-full self-center"
        ></iframe>
        <div className="w-full scale-90 space-y-4">
          {data.evaluationScheme != null ? (
            <>
              <div className="space-y-4">
                <Review
                  name="scopeAndObjective"
                  label="Scope and Objective"
                  description="Check if scope and objectives are clearly defined"
                  value={data.scopeAndObjective}
                />
                <Review
                  name="textBookPrescribed"
                  label="Textbook Prescribed"
                  description="Verify if appropriate textbooks are listed"
                  value={data.textBookPrescribed}
                />
                <Review
                  name="lecturewisePlanLearningObjective"
                  label="Learning Objectives"
                  description="Check if learning objectives for each lecture are defined"
                  value={data.lecturewisePlanLearningObjective}
                />
                <Review
                  name="lecturewisePlanCourseTopics"
                  label="Course Topics"
                  description="Review the lecture-wise course topics"
                  value={data.lecturewisePlanCourseTopics}
                />
                <Review
                  name="numberOfLP"
                  label="Number of Learning Points"
                  description="Ensure sufficient learning points are included"
                  value={data.numberOfLP}
                />
                <Review
                  name="evaluationScheme"
                  label="Evaluation Scheme"
                  description="Check if the evaluation scheme is appropriate"
                  value={data.evaluationScheme}
                />
              </div>
              <Separator className="mb-2" />
              <Textarea
                className="scale-105"
                placeholder="Enter your comments"
                onChange={(e) => setComments(e.target.value)}
              />
              <div className="flex w-full justify-center space-x-4">
                <Button onClick={() => handleSubmit("approved")}>
                  Approve
                </Button>
                <Button onClick={() => handleSubmit("rejected")}>Reject</Button>
              </div>
            </>
          ) : (
            <p className="grid h-full place-items-center font-bold text-muted-foreground">
              <span>Handout Yet To be Reviewed</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DCAConvenorReview;
