import React, { useState, useEffect, lazy, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/spinner";
import { List, ChevronRight, Save } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

const MDEditor = lazy(() => import("@uiw/react-md-editor"));

interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  body: string;
  description: string | null;
  updatedAt: string;
}

const ManageEmailTemplates: React.FC = () => {
  const queryClient = useQueryClient();
  const editorTheme = useTheme();

  const [selectedTemplate, setSelectedTemplate] =
    useState<EmailTemplate | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const response = await api.get<EmailTemplate[]>("/phd/staff/emailTemplates");
      return response.data;
    },
  });

  useEffect(() => {
    if (selectedTemplate) {
      setSubject(selectedTemplate.subject);
      setBody(selectedTemplate.body);
    }
  }, [selectedTemplate]);

  const updateMutation = useMutation({
    mutationFn: (data: { name: string; subject: string; body: string }) =>
      api.put(`/phd/staff/emailTemplates/${data.name}`, data),
    onSuccess: () => {
      toast.success("Template updated successfully!");
      void queryClient.invalidateQueries({ queryKey: ["email-templates"] });
    },
    onError: () => {
      toast.error("Failed to update template.");
    },
  });

  const handleSave = () => {
    if (!selectedTemplate) return;
    updateMutation.mutate({
      name: selectedTemplate.name,
      subject,
      body,
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Email Template Management</h1>
          <p className="mt-2 text-gray-600">
            View and edit email templates for automated notifications.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List className="h-5 w-5" />
                Available Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {templates.map((template) => (
                  <li key={template.id}>
                    <button
                      onClick={() => setSelectedTemplate(template)}
                      className={`w-full rounded-md p-3 text-left transition-colors ${
                        selectedTemplate?.id === template.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{template.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {template.name}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Edit Template</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedTemplate ? (
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="subject" className="text-base font-semibold">
                      Subject
                    </Label>
                    <p className="mb-2 text-sm text-muted-foreground">
                      Edit the subject line for this email. You can use placeholders like {"{{studentName}}"} which will be replaced automatically.
                    </p>
                    <Input
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-base font-semibold">Body</Label>
                    <p className="mb-2 text-sm text-muted-foreground">
                      Edit the email body using Markdown. Placeholders are supported.
                    </p>
                    <div data-color-mode={editorTheme}>
                      <Suspense
                        fallback={
                          <div className="w-full py-8 text-center">
                            Loading editor...
                          </div>
                        }
                      >
                        <MDEditor
                          value={body}
                          onChange={(value) => setBody(value || "")}
                          height={400}
                          preview="live"
                        />
                      </Suspense>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSave}
                      disabled={updateMutation.isLoading}
                    >
                      {updateMutation.isLoading && (
                        <LoadingSpinner className="mr-2 h-4 w-4" />
                      )}
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex h-full min-h-[400px] items-center justify-center text-center">
                  <div>
                    <p className="text-lg font-medium text-gray-800">
                      Select a template
                    </p>
                    <p className="text-gray-500">
                      Choose a template from the list to start editing.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ManageEmailTemplates;