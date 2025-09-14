import { useEffect, useState } from "react";
import api from "@/lib/axios-instance";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useParams } from "react-router-dom";
import { AllocationForm } from "../../../../lib/src/types/allocationFormBuilder";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { fieldTypes } from "./FormTemplateView";
import { FormTemplateFieldComponent } from "@/components/allocation/FormTemplateFieldComponent";
import { useForm } from "react-hook-form";
import { Label } from "@radix-ui/react-label";

const FormView = ({ preview = true }: { preview?: boolean }) => {
  const [form, setForm] = useState<AllocationForm | null>(null);
  const [courses, setCourses] = useState([]);

  const formHandler = useForm();

  const id = useParams().id;

  useEffect(() => {
    const fetchFormDetails = async () => {
      await api
        .get(`/allocation/builder/form/get/${id}`)
        .then(({ data }) => setForm(data))
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

  const handleSubmitResponse = async (data: Record<string, any>) => {
    console.log(data);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 md:p-6">
      {form && (
        <>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{form.title}</h1>
            <p className="text-muted-foreground">{form.description}</p>
          </div>

          <Separator />

          <form
            onSubmit={formHandler.handleSubmit(handleSubmitResponse)}
            className="space-y-6"
          >
            {form.template.fields.map((field) => (
              <Card key={field.id} className="border-border">
                <CardHeader className="gap-4 bg-muted/50 p-4">
                  <div className="flex items-center justify-between">
                    <Label className="h-auto border-none bg-transparent p-0 text-base font-semibold shadow-none focus-visible:ring-0">
                      {field.label}
                    </Label>
                    {preview && (
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
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <FormTemplateFieldComponent
                    field={field}
                    create={false}
                    courses={courses}
                    form={formHandler}
                  />
                </CardContent>
              </Card>
            ))}

            {!preview && (
              <div className="flex justify-end pt-4">
                <Button size="lg" type="submit">
                  Submit Form
                </Button>
              </div>
            )}
          </form>
        </>
      )}
    </div>
  );
};

export default FormView;
