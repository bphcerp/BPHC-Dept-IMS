import { useEffect, useState } from "react";
import api from "@/lib/axios-instance";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useParams } from "react-router-dom";
import { AllocationForm } from "../../../../lib/src/types/allocationFormBuilder";
import { FormTemplateFieldComponent } from "@/components/allocation/FormTemplateFieldComponent";
import { toast } from "sonner";
import { useForm, FormProvider } from "react-hook-form";

const FormResponse = () => {
  const [form, setForm] = useState<AllocationForm | null>(null);
  const [courses, setCourses] = useState([]);

  const { id } = useParams();
  const methods = useForm();

  useEffect(() => {
    const fetchFormDetails = async () => {
      await api
        .get(`/allocation/builder/form/get/${id}`)
        .then(({ data }) => {
          setForm(data);
          const defaultValues: { [key: string]: any} = {};
          data.template.fields.forEach((field: any) => {
            if(field.type === "TEACHING_ALLOCATION") {
              defaultValues[`${field.id}_teachingAllocation`] = field.value || "";
            } else if (field.type === "PREFERENCE") {
              for (let i = 0; i < (field.preferenceCount || 1); i++) {
                defaultValues[`${field.id}_preference_${i}`] = field.preferences?.[i]?.courseId || "";
                defaultValues[`${field.id}_courseAgain_${i}`] = field.preferences?.[i]?.takenConsecutively || false;
              }
            }
          })
          methods.reset(defaultValues);
        })
        .catch((error) => {
          console.error("Error fetching form details:", error);
        });
    };

    const fetchCourses = async () => {
      try {
        const response = await api.get("/allocation/course/get");
        setCourses(response.data);
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };

    fetchFormDetails();
    fetchCourses();
  }, [id]);

  /* const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Since FormTemplateFieldComponent cannot be modified to add name attributes,
    // we cannot use FormData directly.
    // A more complex state management solution would be needed here to collect form values.
    // For now, this will be a placeholder.
    toast.error("Form submission is not yet fully implemented.");
  };
 */

  const onSubmit = async (data: any) => {
    console.log("Form submitted data: ", data);

    const responses: any[] = [];
    form?.template.fields.forEach((field) => {
      if (field.type === "TEACHING_ALLOCATION") {
        responses.push({
          templateFieldId: field.id,
          value: parseFloat(data[`${field.id}_teachingAllocation`]),
        });
      } else if (field.type === "PREFERENCE") {
        const preferences: { courseId: number; takenConsecutively: boolean }[] = [];
        for (let i = 0; i < (field.preferenceCount || 1); i++) {
          if (data[`${field.id}_preference_${i}`]) {
            preferences.push({ 
              courseId: parseInt(data[`${field.id}_preference_${i}`]),
              takenConsecutively: data[`${field.id}_courseAgain_${i}`] || false,
            });
          }
        }
        responses.push({
          templateFieldId: field.id,
          preferences: preferences,
        });
      }
    });

    try {
      await api.post(`/allocation/builder/form/response/register`, {
        formId: id,
        response: responses,
      });
      toast.success("Form response submitted successfully!");
      // Optionally navigate away or show a success message
    } catch (error) {
      console.error("Error submitting form response:", error);
      toast.error("Failed to submit form response.");
    }
  }; // Added missing closing brace

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 md:p-6">
      {form && (
        <>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{form.title}</h1>
            <p className="text-muted-foreground">{form.description}</p>
          </div>

          <Separator />
          <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
            {form.template.fields.map((field) => (
              <Card key={field.id} className="border-border">
                <CardHeader className="gap-4 bg-muted/50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-base font-semibold">{field.label}</p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <FormTemplateFieldComponent
                    field={field}
                    create={false}
                    courses={courses}
                    form={methods}
                  />
                </CardContent>
              </Card>
            ))}

            <div className="flex justify-end pt-4">
              <Button size="lg" type="submit">
                Submit Form
              </Button>
            </div>
          </form>
          </FormProvider>
        </>
      )}
    </div>
  );
};

export default FormResponse;
