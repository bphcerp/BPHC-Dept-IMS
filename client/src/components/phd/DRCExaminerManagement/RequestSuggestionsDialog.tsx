import React, { useState, useEffect, lazy, Suspense, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/spinner";
import { useTheme } from "@/hooks/use-theme";
import { phdSchemas } from "lib";

const MDEditor = lazy(() => import("@uiw/react-md-editor"));

// Local helper to avoid lib changes
const simpleTemplate = (
  template: string,
  view: Record<string, unknown>,
): string => {
  if (!template) return "";
  return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const value = view[key.trim()];
    return value !== undefined ? String(value) : match;
  });
};

interface EmailTemplate {
  name: string;
  subject: string;
  body: string;
}

interface RequestSuggestionsDialogProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  application: phdSchemas.VerifiedApplication;
}

const RequestSuggestionsDialog: React.FC<RequestSuggestionsDialogProps> = ({
  isOpen,
  setIsOpen,
  application,
}) => {
  const editorTheme = useTheme();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const queryClient = useQueryClient();

  const areExaminersSuggested = useMemo(
    () => !!Object.keys(application.examinerSuggestions).length,
    [application.examinerSuggestions],
  );
  const isReminder = !areExaminersSuggested && application.supervisorTodoExists;

  const { data: templates = [] } = useQuery<EmailTemplate[]>({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const response = await api.get("/phd/staff/emailTemplates");
      return response.data;
    },
  });

  useEffect(() => {
    if (isOpen && templates.length > 0) {
      const templateName = isReminder
        ? "reminder_examiner_suggestions"
        : "request_examiner_suggestions";
      const template = templates.find((t) => t.name === templateName);

      if (template) {
        const view = {
          supervisorName: "Supervisor",
          studentName: application.student.name,
          // Add other placeholders if needed
        };
        setSubject(simpleTemplate(template.subject, view));
        setBody(simpleTemplate(template.body, view));
      }
    }
  }, [isOpen, templates, isReminder, application]);

  const sendNotificationMutation = useMutation({
    mutationFn: (payload: phdSchemas.requestExaminerSuggestionsBody) =>
      api.post("/phd/drcMember/requestExaminerSuggestions", payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["verified-applications", application.examId],
      });
      toast.success("Supervisor notified");
      setIsOpen(false);
    },
    onError: () => {
      toast.error("Failed to request suggestions");
    },
  });

  const handleSend = () => {
    if (!subject.trim() || !body.trim()) {
      toast.error("Subject and body cannot be empty.");
      return;
    }
    sendNotificationMutation.mutate({
      subject,
      body,
      applicationId: application.id,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col">
        <DialogHeader>
          <DialogTitle>Request Examiner Suggestions</DialogTitle>
          <DialogDescription>
            The content is pre-filled from a template. You can edit it before
            sending.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow space-y-4 overflow-y-auto pr-2">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Body (Markdown supported)</Label>
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
                  height={300}
                  preview="live"
                />
              </Suspense>
            </div>
          </div>
        </div>
        <DialogFooter className="mt-4 border-t pt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={sendNotificationMutation.isLoading}
          >
            {sendNotificationMutation.isLoading && (
              <LoadingSpinner className="mr-2 h-4 w-4" />
            )}
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RequestSuggestionsDialog;