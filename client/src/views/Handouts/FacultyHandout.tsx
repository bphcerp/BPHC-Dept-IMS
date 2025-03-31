import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import Review from "@/components/handouts/review";
import api from "@/lib/axios-instance";

interface Handout {
  id: string;
  courseName: string;
  courseCode: string;
  scopeAndObjective: boolean;
  textBookPrescribed: boolean;
  lecturewisePlanLearningObjective: boolean;
  lecturewisePlanCourseTopics: boolean;
  numberOfLP: boolean;
  evaluationScheme: boolean;
}

const FacultyHandout: React.FC = () => {
  const { id: handoutId } = useParams();

  const { data, isLoading, isError } = useQuery<Handout>({
    queryKey: [`handout-faculty ${handoutId}`],
    queryFn: async () => {
      try {
        const response = await api.get(`/handout/get?handoutId=${handoutId}`);
        return response.data.handout;
      } catch (error) {
        toast.error("Failed to fetch handouts");
        throw error;
      }
    },
  });

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
      <h1 className="mb-4 text-center text-2xl font-bold">Handout</h1>
      <p className="mb-2 text-center text-muted-foreground">
        <span className="font-bold">Course Name :</span> {data.courseName}
      </p>{" "}
      <p className="mb-4 text-center text-muted-foreground">
        <span className="font-bold">Course Code :</span> {data.courseCode}
      </p>{" "}
      <div className="space-y-6">
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
            <Separator className="my-4" />
          </>
        ) : (
          <p className="mb-4 text-center text-muted-foreground">
            Handout Yet To be Reviewed
          </p>
        )}
      </div>
    </div>
  );
};

export default FacultyHandout;
