import { useState } from "react";
import { useForm, SubmitHandler, FormProvider } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LoadingSpinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { CustomFormField } from "@/components/coursehandouts/CustomFormField";
import FileUploader from "@/components/coursehandouts/FileUploader";
import api from "@/lib/axios-instance";
import { toast } from "sonner";

type FormData = {
  courseCode: string;
  courseName: string;
  openBook: string;
  closedBook: string;
  midSem: string;
  compre: string;
  frequency: string;
  numComponents: string;
};

const fieldConfigs = [
  {
    name: "courseCode",
    label: "Course Code",
    placeholder: "e.g. CS101",
    type: "text",
  },
  {
    name: "courseName",
    label: "Course Name",
    placeholder: "e.g. Computer Programming",
    type: "text",
  },
  {
    name: "openBook",
    label: "Open Book Percentage",
    placeholder: "e.g. 30",
    type: "number",
  },
  {
    name: "closedBook",
    label: "Closed Book Percentage",
    placeholder: "e.g. 70",
    type: "number",
  },
  {
    name: "midSem",
    label: "Midsemester Weightage (in %)",
    placeholder: "e.g. 30",
    type: "number",
  },
  {
    name: "compre",
    label: "Comprehensive Weightage (in %)",
    placeholder: "e.g. 70",
    type: "number",
  },
  {
    name: "frequency",
    label: "Frequency",
    placeholder: "e.g. 2",
    type: "number",
  },
  {
    name: "numComponents",
    label: "Number of Components",
    placeholder: "e.g. 3",
    type: "number",
  },
];

export default function FacultyApplication() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const methods = useForm<FormData>({
    defaultValues: {
      courseCode: "",
      courseName: "",
      openBook: "",
      closedBook: "",
      midSem: "",
      compre: "",
      frequency: "",
      numComponents: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      await api.post("/handout/create", formData);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["faculty-applications"],
      });
      toast.success("Form submitted successfully.");
    },
    onError: () => {
      toast.error(`Submission failed : Invalid Parameters`);
    },
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsSubmitting(true);
    try {
      await mutation.mutateAsync(data);
    } catch (error) {
      // Error handled in onError
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-7xl p-8">
      <h1 className="mb-8 text-2xl font-bold">
        HANDOUT APPROVAL - 2nd SEMESTER, YEAR 2024 - 2025
      </h1>

      <FormProvider {...methods}>
        <Form {...methods}>
          <form
            onSubmit={(e) => {
              void methods.handleSubmit(onSubmit)(e);
            }}
            className="space-y-8"
          >
            <div className="grid grid-cols-2 gap-4">
              {fieldConfigs.map((config) => (
                <CustomFormField
                  key={config.name}
                  {...config}
                  register={methods.register(config.name as keyof FormData, {
                    required: `${config.label} is required`,
                  })}
                />
              ))}
            </div>

            <div className="mt-4 flex flex-row justify-between pt-8">
              <div>
                <FileUploader />
                <p className="ml-2 mt-1 text-sm text-gray-500">
                  file.docx/file.pdf
                </p>
              </div>
              <Button
                type="submit"
                disabled={isSubmitting || mutation.isLoading}
                className="w-full px-6 py-2 sm:w-auto"
              >
                {isSubmitting || mutation.isLoading ? (
                  <LoadingSpinner className="h-5 w-5" />
                ) : (
                  "SUBMIT FOR VERIFICATION"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </FormProvider>
    </div>
  );
}
