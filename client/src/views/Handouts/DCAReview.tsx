import React, { useMemo, useCallback, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import ReviewField from "@/components/handouts/reviewField";
import api from "@/lib/axios-instance";
import { isAxiosError } from "axios";
import { BASE_API_URL } from "@/lib/constants";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export interface HandoutReviewFormValues {
  handoutId: string;
  scopeAndObjective: boolean;
  textBookPrescribed: boolean;
  lecturewisePlanLearningObjective: boolean;
  lecturewisePlanCourseTopics: boolean;
  numberOfLP: boolean;
  evaluationScheme: boolean;
  ncCriteria: boolean;
  comments: string;
}

export interface Handout {
  id: string;
  courseName: string;
  courseCode: string;
  category: string;
  professorName: string;
  submittedOn: string;
  status: string;
  scopeAndObjective: boolean;
  textBookPrescribed: boolean;
  lecturewisePlanLearningObjective: boolean;
  lecturewisePlanCourseTopics: boolean;
  ncCriteria: boolean;
  openBook: number;
  midSem: number;
  compre: number;
  otherEvals: number;
  numberOfLP: boolean;
  evaluationScheme: boolean;
  handoutFilePath: {
    fileId: string;
  };
  comments: string;
}

const DCAMemberReviewForm: React.FC = () => {
  const { id: handoutId } = useParams();
  const queryClient = useQueryClient();
  const [comments, setComments] = useState("");
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [`handout-dca ${handoutId}`],
    queryFn: async () => {
      try {
        const response = await api.get<{ status: boolean; handout: Handout }>(
          `/handout/get?handoutId=${handoutId}`
        );
        return response.data.handout;
      } catch (error) {
        toast.error("Failed to fetch handouts");
        throw error;
      }
    },
  });

  const { data: allHandouts } = useQuery({
    queryKey: ["handouts-dca"],
    queryFn: async () => {
      try {
        const response = await api.get<{
          handouts: Handout[];
          success: boolean;
        }>("/handout/dca/get");
        return response.data.handouts;
      } catch (error) {
        toast.error("Failed to fetch handouts");
        throw error;
      }
    },
  });

  const goBack = () => {
    navigate("/handout/dca");
  };

  const goToNextPendingHandout = useCallback(() => {
    if (!allHandouts) return;

    const pendingHandouts = allHandouts.filter(
      (handout) =>
        handout.status === "review pending" && handout.id !== handoutId
    );

    if (pendingHandouts.length > 0) {
      navigate(`/handout/dca/review/${pendingHandouts[0].id}`);
      toast.success("Navigated to next pending handout");
    } else {
      navigate("/handout/dca");
      toast.info("No more pending handouts to review");
    }
  }, [allHandouts, handoutId, navigate]);

  const { handleSubmit, control, setValue } = useForm<HandoutReviewFormValues>({
    defaultValues: {
      scopeAndObjective: false,
      textBookPrescribed: false,
      lecturewisePlanLearningObjective: false,
      lecturewisePlanCourseTopics: false,
      numberOfLP: false,
      evaluationScheme: false,
      ncCriteria: false,
      comments,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: HandoutReviewFormValues) => {
      await api.post("/handout/dca/review", {
        ...data,
        handoutId,
      });
    },
    onSuccess: async () => {
      toast.success("Handout review successfully submitted");
      await queryClient.refetchQueries({
        queryKey: [
          "handouts-dca",
          "handouts-faculty",
          `handout-dcaconvenor ${handoutId}`,
          `handout-dca ${handoutId}`,
          `handout-faculty ${handoutId}`,
        ],
      });
      await refetch();
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

  useMemo(() => {
    setValue("scopeAndObjective", data?.scopeAndObjective ?? false);
    setValue("textBookPrescribed", data?.textBookPrescribed ?? false);
    setValue(
      "lecturewisePlanCourseTopics",
      data?.lecturewisePlanCourseTopics ?? false
    );
    setValue(
      "lecturewisePlanLearningObjective",
      data?.lecturewisePlanLearningObjective ?? false
    );
    setValue("numberOfLP", data?.numberOfLP ?? false);
    setValue("evaluationScheme", data?.evaluationScheme ?? false);
    setValue("ncCriteria", data?.ncCriteria ?? false);
    setValue("comments", comments);
  }, [data, setValue, comments]);

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
    <div className="container mx-auto px-6 py-10">
      <div className="mb-4 flex justify-between">
        <Button
          variant={"ghost"}
          onClick={goBack}
          className="size-sm flex items-center"
        >
          <ChevronLeft className="mr-1" size={16} />
          Back to Dashboard
        </Button>

        {data.lecturewisePlanCourseTopics == null && (
          <Button
            variant={"ghost"}
            onClick={goToNextPendingHandout}
            className="size-sm flex items-center"
          >
            Next Pending Handout
            <ChevronRight className="ml-1" size={16} />
          </Button>
        )}
      </div>
      <h1 className="mb-4 text-center text-2xl font-bold">Handout Review</h1>
      <p className="mb-2 text-center text-muted-foreground">
        <span className="font-bold">Course Name :</span> {data.courseName}
      </p>
      <p className="mb-2 text-center text-muted-foreground">
        <span className="font-bold">Course Code :</span> {data.courseCode}
      </p>
      <p className="mb-2 text-center text-muted-foreground">
        <span className="font-bold">Mid Semester Weightage : </span>
        {data.midSem}%
      </p>
      <p className="mb-2 text-center text-muted-foreground">
        <span className="font-bold">Compre Weightage :</span> {data.compre}%
      </p>
      <p className="mb-2 text-center text-muted-foreground">
        <span className="font-bold">Open Book :</span> {data.openBook}%
      </p>
      <p className="mb-4 text-center text-muted-foreground">
        <span className="font-bold">No. of Other Evaluatives :</span>{" "}
        {data.otherEvals}
      </p>
      <p className="mb-6 text-center text-muted-foreground">
        {data.lecturewisePlanCourseTopics == null
          ? "Review the handout and approve or reject each section."
          : "You have reviewed this handout"}
      </p>
      <div className="flex space-x-1">
        <iframe
          src={`${BASE_API_URL}f/${data.handoutFilePath.fileId}`}
          className="my-2 h-[90vh] max-h-[550px] w-full self-center"
        ></iframe>
        <form
          onSubmit={(e) => {
            void handleSubmit(onSubmit)(e);
          }}
          className="w-full scale-90 space-y-6"
        >
          <div className="space-y-4">
            <ReviewField
              name="scopeAndObjective"
              label="Scope and Objective"
              description="Check if scope and objectives are clearly defined"
              control={control}
              disabled={data.scopeAndObjective != null}
            />
            <ReviewField
              name="textBookPrescribed"
              label="Textbook Prescribed"
              description="Verify if appropriate textbooks are listed"
              control={control}
              disabled={data.textBookPrescribed != null}
            />
            <ReviewField
              name="lecturewisePlanLearningObjective"
              label="Learning Objectives"
              description="Check if learning objectives for each lecture are defined"
              control={control}
              disabled={data.lecturewisePlanLearningObjective != null}
            />
            <ReviewField
              name="lecturewisePlanCourseTopics"
              label="Course Topics"
              description="Review the lecture-wise course topics"
              control={control}
              disabled={data.lecturewisePlanCourseTopics != null}
            />
            <ReviewField
              name="numberOfLP"
              label="Number of Learning Points"
              description="Ensure sufficient learning points are included"
              control={control}
              disabled={data.numberOfLP != null}
            />
            <ReviewField
              name="evaluationScheme"
              label="Evaluation Scheme"
              description="Check if the evaluation scheme is appropriate"
              control={control}
              disabled={data.evaluationScheme != null}
            />
            <ReviewField
              name="ncCriteria"
              label="NC Criteria"
              description="Check if the NC Criteria is provided"
              control={control}
              disabled={data.evaluationScheme != null}
            />
            {data.comments ? (
              <div className="flex max-w-[28vw] flex-col text-muted-foreground">
                <div className="mb-2 font-bold">DCA Comments :</div>
                <div className="ml-4 overflow-hidden break-words text-center">
                  {data.comments}
                </div>
              </div>
            ) : (
              <Textarea
                className="scale-105"
                placeholder="Enter your comments"
                onChange={(e) => setComments(e.target.value)}
              />
            )}
          </div>
          {data.status == "review pending" ? (
            <>
              <Separator />
              <div className="flex items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  Check the box to approve; leave unchecked to reject each
                  section.
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
            </>
          ) : (
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={goToNextPendingHandout}
                className="flex items-center"
              >
                Next Pending Handout
                <ChevronRight className="ml-1" size={16} />
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default DCAMemberReviewForm;
