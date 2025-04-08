import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import api from "@/lib/axios-instance";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { handoutSchemas } from "lib";
import { SubmitHandler, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
interface Handout {
  id: string;
  courseName: string;
  courseCode: string;
}

const AssignReviewer: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery<Handout>({
    queryKey: [`handout-dcaconvenor ${id}`],
    queryFn: async () => {
      try {
        const response = await api.get(`/handout/get?handoutId=${id}`);
        return response.data.handout;
      } catch (error) {
        toast.error("Failed to fetch handouts");
        throw error;
      }
    },
  });

  const form = useForm<handoutSchemas.AssignReviewerBody>({
    resolver: zodResolver(handoutSchemas.assignReviewerBodySchema),
    defaultValues: {
      id,
      reviewerEmail: "",
    },
  });

  const assignMutation = useMutation({
    mutationFn: async (data: handoutSchemas.AssignReviewerBody) => {
      await api.post("/handout/dca/assignReviewer", data);
    },
    onSuccess: async () => {
      toast.success("Reviewer assigned successfully");
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
        console.log("Error assigning reviewer:", error.response?.data);
      }
      toast.error("An error occurred while assigning reviewer");
    },
  });

  const onSubmit: SubmitHandler<handoutSchemas.AssignReviewerBody> = (data) => {
    assignMutation.mutate(data);
  };

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
    <div className="container mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-10">
      <h1 className="mb-4 text-center text-2xl font-bold">Handout</h1>
      <p className="mb-2 text-center text-muted-foreground">
        <span className="font-bold">Course Name :</span> {data.courseName}
      </p>{" "}
      <p className="mb-8 text-center text-muted-foreground">
        <span className="font-bold">Course Code :</span> {data.courseCode}
      </p>{" "}
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle>Assign Reviewer</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={(e) => {
                void form.handleSubmit(onSubmit)(e);
              }}
              className="flex flex-col gap-2"
            >
              <FormField
                control={form.control}
                name="reviewerEmail"
                render={({ field }) => (
                  <FormItem className="mb-2">
                    <FormLabel>Enter Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="example@hyderabad.bits-pilani.ac.in"
                        className="mx-2 px-6 text-end"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                disabled={assignMutation.isLoading}
                className="mt-2 self-end"
                type="submit"
              >
                Assign
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssignReviewer;
