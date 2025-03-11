import { useState } from "react";
import { useForm, SubmitHandler, FormProvider } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoadingSpinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { CustomFormField } from "@/components/coursehandouts/CustomFormField";
import FileUploader from "@/components/coursehandouts/FileUploader";

const schema = z.object({
  courseCode: z.string().nonempty("Course Code is required"),
  courseName: z.string().nonempty("Course Name is required"),
  openBook: z.string().nonempty("Open Book % is required"),
  closedBook: z.string().nonempty("Closed Book % is required"),
  midSem: z.string().nonempty("Midsemester Weightage is required"),
  compre: z.string().nonempty("Comprehensive Weightage is required"),
  frequency: z.string().nonempty("Frequency is required"),
  numComponents: z.string().nonempty("Number of Components is required"),
  approximateStrength: z.string().nonempty("Approximate Course Strength is required"),
});

type FormData = z.infer<typeof schema>;

const fieldConfigs = [
  { name: "courseCode", label: "Course Code", placeholder: "e.g. CS101", type: "text" },
  { name: "courseName", label: "Course Name", placeholder: "e.g. Computer Programming", type: "text" },
  { name: "openBook", label: "Open Book Percentage", placeholder: "e.g. 30", type: "number" },
  { name: "closedBook", label: "Closed Book Percentage", placeholder: "e.g. 70", type: "number" },
  { name: "midSem", label: "Midsemester Weightage (in %)", placeholder: "e.g. 30", type: "number" },
  { name: "compre", label: "Comprehensive Weightage (in %)", placeholder: "e.g. 70", type: "number" },
  { name: "frequency", label: "Frequency", placeholder: "e.g. 2", type: "number" },
  { name: "numComponents", label: "Number of Components", placeholder: "e.g. 3", type: "number" },
  { name: "approximateStrength", label: "Approximate Course Strength", placeholder: "e.g. 120", type: "number" },
];

export default function CourseHandouts() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const methods = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      courseCode: "",
      courseName: "",
      openBook: "",
      closedBook: "",
      midSem: "",
      compre: "",
      frequency: "",
      numComponents: "",
      approximateStrength: "",
    },
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsSubmitting(true);
    try {
      console.log("Form Data:", data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      <h1 className="text-2xl font-bold mb-8">
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
                <CustomFormField key={config.name} {...config} />
              ))}
            </div>

            <div className="flex flex-row justify-between mt-4 pt-8">
              <div>
                <FileUploader />
                <p className="text-sm text-gray-500 mt-1 ml-2">
                  file.docx/file.pdf
                </p>
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 w-full sm:w-auto"
              >
                {isSubmitting ? (
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
