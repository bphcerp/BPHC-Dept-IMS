import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "@/lib/axios-instance";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@radix-ui/react-separator";
import { AllocationForm, AllocationFormResponse } from "../../../../lib/src/types/allocationFormBuilder";
import { FormTemplateFieldComponent } from '../../components/allocation/FormTemplateFieldComponent';
import { toast } from "sonner";

const FormResponsesView = () => {
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState<AllocationForm | null>(null);
  const [responses, setResponses] = useState<AllocationFormResponse[]>([]);
  const [groupedResponses, setGroupedResponses] = useState<Record<string, AllocationFormResponse[]>>({});
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    const fetchFormDetails = async () => {
      try {
        const response = await api.get(`/allocation/builder/form/get/${id}`);
        console.log("Form details fetched: ", response.data)
        setForm(response.data);
      } catch (error) {
        console.error("Error fetching form details:", error);
        toast.error("Error in fetching form details!")
      }
    };

    const fetchCourses = async () => {
      try {
        const response = await api.get(`/allocation/course/get`);
        setCourses(response.data);
        console.log("Courses fetched: ", response.data)
      } catch (error) {
        console.error("Error fetching courses: ", error);
        toast.error("Error in fetching courses!");
      }
    }

    const fetchResponses = async () => {
      try {
        const response = await api.get(`/allocation/builder/form/response/get/${id}`);
        setResponses(response.data);
        console.log("Responses fetched: ", response.data)

      } catch (error) {
        console.error("Error in fetching responses: ", error); 
        toast.error("Error in fetching responses!");
      }
    }

    fetchCourses();
    fetchFormDetails();
    fetchResponses();
  }, [id])

  useEffect(() => {
    if (responses.length) {
      const grouped = responses.reduce((acc, res) => {
        const email = res.submittedBy.email;
        if (!acc[email]) {
          acc[email] = [];
        }
        acc[email].push(res);
        return acc;
      }, {} as Record<string, AllocationFormResponse[]>);
      setGroupedResponses(grouped);
    }
  }, [responses]);

  const userEmails = Object.keys(groupedResponses);
  const currentUserEmail = userEmails[currentUserIndex];
  const currentUserResponses = groupedResponses[currentUserEmail];

  

  const handleNext = () => {
    setCurrentUserIndex((prev) => (prev + 1) % userEmails.length);
  }

  const handlePrevious = () => {
    setCurrentUserIndex((prev) => (prev - 1 + userEmails.length) % userEmails.length);
  }

  if (!form || !responses.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="border-2 border-y-blue-900 rounded-lg p-8 text-center -mt-16">
          <p className="text-lg text-gray-600"> No responses yet. </p>
        </div>
      </div>
    );
  }



  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 md:p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{form.title} - Responses</h1>
        <p className="text-muted-foreground">{form.description}</p>
      </div>

      {userEmails.length > 0 && currentUserResponses && (
        <>
          <div className="flex justify-between items-center">
            <div>
              <p><span className="font-bold">Submitted by:</span> {currentUserResponses[0].submittedBy.name} ({currentUserResponses[0].submittedBy.email})</p>
              <p><span className="font-bold">Submitted at:</span> {new Date(currentUserResponses[0].submittedAt).toLocaleString()}</p>
            </div>
            <div className="flex space-x-2">
              <Button onClick={handlePrevious} disabled={userEmails.length <= 1}>Previous</Button>
              <Button onClick={handleNext} disabled={userEmails.length <= 1}>Next</Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-6">
            {form.template.fields.map((field) => {
              const response = currentUserResponses.find(r => r.templateFieldId === field.id);
              return (
                <Card key={field.id} className="border-border">
                  <CardHeader className="gap-4 bg-muted/50 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-base font-semibold">{field.label}</p>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6 p-6">
                    <FormTemplateFieldComponent
                      field={{
                        ...field,
                        value: response?.teachingAllocation ?? undefined,
                        preferences: currentUserResponses
                          .filter((r) => r.templateFieldId === field.id)
                          .map((r) => ({
                            courseId: r.preference || 0,
                            takenConsecutively: r.takenConsecutively || false,
                          })),
                      }}
                      create={false}
                      courses={courses}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default FormResponsesView;
