import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { LoadingSpinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";

const schema = z.object({
  courseCode: z.string(),
  courseName: z.string(),
  openBook: z.string(),
  closedBook: z.string(),
  midSem: z.string(),
  compre: z.string(),
  frequency: z.string(),
  numberOfComponents: z.string(),
  approximateStrength: z.string(),
});

type FormData = z.infer<typeof schema>;

const fieldConfigs = [
  { name: "courseCode", label: "Course Code", value: "CS101" },
  { name: "courseName", label: "Course Name", value:"Computer Programming" },
  { name: "openBook", label: "Open Book Percentage", value: "30" },
  { name: "closedBook", label: "Closed Book Percentage", value: "70" },
  { name: "midSem", label: "Midsemester Weightage (in %)", value: "30" },
  { name: "compre", label: "Comprehensive Weightage (in %)", value: "70" },
  { name: "frequency", label: "Frequency", value: "3" },
  { name: "numberOfComponents", label: "Number of Components", value: "2" },
  { name: "approximateStrength", label: "Approximate Course Strength", value: "150" },
];

interface Approvals {
  [key: string]: boolean;
}

interface Comments {
  [key: string]: string;
}

export const DcaMemberView = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvals, setApprovals] = useState<Approvals>({});
  const [comments, setComments] = useState<Comments>({});

  const methods = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const handleApprovalChange = (fieldName: string, value: string) => {
    setApprovals(prev => ({
      ...prev,
      [fieldName]: value === "yes"
    }));
  };

  const handleCommentChange = (fieldName: string, value: string) => {
    setComments(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      console.log("Approvals:", approvals);
      console.log("Comments:", comments);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      <h1 className="text-2xl font-bold mb-8">
        DCA Member View - HANDOUT APPROVAL 2nd SEMESTER, YEAR 2024 - 2025
      </h1>
      <FormProvider {...methods}>
        <Form {...methods}>
          <form
            onSubmit={(e) => {
              void methods.handleSubmit(onSubmit)(e);
            }}
            className="space-y-6"
          >
            {fieldConfigs.map((field) => (
              <div key={field.name} className="flex flex-col sm:flex-row items-start gap-4 p-4">
                <div className="w-full sm:w-2/5">
                  <label className="block font-medium mb-1">{field.label}</label>
                  <div className="p-2 bg-gray-100 rounded">{field.value}</div>
                </div>
                <div className="w-full sm:w-2/5">
                  <label htmlFor={`comment-${field.name}`} className="block font-medium mb-1">Comments</label>
                  <Input
                    id={`comment-${field.name}`}
                    placeholder="Add your comments here..."
                    value={comments[field.name] || ""}
                    onChange={(e) => handleCommentChange(field.name, e.target.value)}
                    className="w-full p-2 h-[38px]"
                  />
                </div>
                <div className="w-full sm:w-1/5">
                  <label className="block font-medium mb-1">Approve</label>
                  <div className="flex items-center space-x-2">
                    <select 
                      id={`approval-${field.name}`}
                      value={approvals[field.name] ? "yes" : "no"}
                      onChange={(e) => handleApprovalChange(field.name, e.target.value)}
                      className="p-2 border rounded h-[38px] w-full"
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex flex-row justify-between mt-8">
              <div>
                <label className="block font-medium mb-1">Course Handout Document</label>
                <div className="mt-1 p-2 bg-gray-100 rounded">
                  <a className="text-blue-500 hover:underline">View Course Handout.pdf</a>
                </div>
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2"
              >
                {isSubmitting ? (
                  <LoadingSpinner className="h-5 w-5" />
                ) : (
                  "SUBMIT REVIEW"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </FormProvider>
    </div>
  );
};
