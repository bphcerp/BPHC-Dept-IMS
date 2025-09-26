import { useEffect, useState } from "react";
import api from "@/lib/axios-instance";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useNavigate, useParams } from "react-router-dom";
import { AllocationForm, AllocationFormUserCheck, NewAllocationFormClientResponse } from "../../../../lib/src/types/allocationFormBuilder";
import { FormTemplateFieldComponent } from "@/components/allocation/FormTemplateFieldComponent";
import { toast } from "sonner";
import { useForm, FormProvider } from "react-hook-form";
import { AxiosError } from "axios";
import { Label } from "@radix-ui/react-label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { fieldTypes } from "./FormTemplateView";
import NotFoundPage from "@/layouts/404";

const FormResponse = ({ preview = true }: { preview?: boolean }) => {
  const [form, setForm] = useState<AllocationForm | null>(null);
  const [courses, setCourses] = useState([]);

  const { id } = useParams();
  const navigate = useNavigate();
  const methods = useForm();

  useEffect(() => {
    const fetchFormDetails = async () => {
      await api
        .get<AllocationFormUserCheck>(`/allocation/builder/form/get/${id}?checkUserResponse=true`)
        .then(({ data }) => {
          setForm(data);
          if (data.userAlreadyResponded) toast.warning("You've already responded to this form")
          if (!preview) {
            const defaultValues: { [key: string]: any } = {};
            data.template.fields.forEach((field: any) => {
              if (field.type === "TEACHING_ALLOCATION") {
                defaultValues[`${field.id}_teachingAllocation`] = field.value || "";
              } else if (field.type === "PREFERENCE") {
                for (let i = 0; i < (field.preferenceCount || 1); i++) {
                  defaultValues[`${field.id}_preference_${i}`] = field.preferences?.[i]?.courseCode || "";
                  defaultValues[`${field.id}_courseAgain_${i}`] = field.preferences?.[i]?.takenConsecutively || false;
                }
              }
            });
            methods.reset(defaultValues);
          }
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
  }, [id, preview]);


  const onSubmit = async (data: any) => {
    const responses: NewAllocationFormClientResponse[] = [];
    form?.template.fields.forEach((field) => {
      if (field.type === "TEACHING_ALLOCATION") {
        responses.push({
          templateFieldId: field.id,
          teachingAllocation: parseFloat(data[`${field.id}_teachingAllocation`]),
        });
      } else if (field.type === "PREFERENCE") {
        for (let i = 0; i < (field.preferenceCount || 1); i++) {
          if (data[`${field.id}_preference_${i}`]) {
            responses.push({
              templateFieldId: field.id,
              preference: i + 1,
              courseCode: data[`${field.id}_preference_${i}`],
              takenConsecutively: data[`${field.id}_courseAgain_${i}`] || false,
            });
          }
        }
      }
    });

    try {
      await api.post(`/allocation/builder/form/response/register`, {
        formId: id,
        response: responses,
      });
      toast.success("Form response submitted successfully!");
      navigate(-1);
    } catch (error) {
      console.error("Error submitting form response:", error);
      toast.error((error as AxiosError).response?.data as string ?? "Failed to submit form response.");
    }
  };

  if (form && !form.publishedDate) return <NotFoundPage />

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 md:p-6">
      {form && (
        <>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{form.title}</h1>
            <p className="text-muted-foreground">{form.description}</p>
          </div>

          <Separator />

          {preview ? (
            <form className="space-y-6">
              {form.template.fields.map((field) => (
                <Card key={field.id} className="border-border">
                  <CardHeader className="gap-4 bg-muted/50 p-4">
                    <div className="flex items-center justify-between">
                      <Label className="h-auto border-none bg-transparent p-0 text-base font-semibold shadow-none focus-visible:ring-0">
                        {field.label}
                      </Label>
                      <div className="flex items-center justify-start gap-2">
                        <Select value={field.type}>
                          <SelectTrigger className="w-[220px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {fieldTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type.replace("_", " ")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
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
            </form>
          ) : (
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
          )}
        </>
      )}
    </div>
  );
};

export default FormResponse;
