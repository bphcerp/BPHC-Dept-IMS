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
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/spinner";
import { useTheme } from "@/hooks/use-theme";
import { phdSchemas } from "lib";
import { FRONTEND_URL } from "@/lib/constants";
import Mustache from "mustache";

const MDEditor = lazy(() => import("@uiw/react-md-editor"));

interface EmailTemplate {
  name: string;
  subject: string;
  body: string;
}

interface RequestSuggestionsDialogProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  application: phdSchemas.VerifiedApplication;
  toSuggest: number;
  preselectedAreas?: string[];
}

const RequestSuggestionsDialog: React.FC<RequestSuggestionsDialogProps> = ({
  isOpen,
  setIsOpen,
  application,
  toSuggest,
  preselectedAreas,
}) => {
  const editorTheme = useTheme();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [deadline, setDeadline] = useState<string>("");
  
  const selectedAreas = useMemo(
    () => preselectedAreas || [application.qualifyingArea1, application.qualifyingArea2],
    [preselectedAreas, application.qualifyingArea1, application.qualifyingArea2]
  );

  const areExaminersSuggested = useMemo(
    () => !!Object.keys(application.examinerSuggestions).length,
    [application.examinerSuggestions]
  );
  const queryClient = useQueryClient();
  const isReminder = !areExaminersSuggested && 
    (application.supervisorTodoExistsArea1 || application.supervisorTodoExistsArea2);

  const isBothAreas = useMemo(
    () => selectedAreas.length === 2,
    [selectedAreas]
  );

  const { data: templates = [] } = useQuery({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const response = await api.get<EmailTemplate[]>(
        "/phd/staff/emailTemplates"
      );
      return response.data;
    },
  });

  const templateName = isReminder
    ? isBothAreas
      ? "reminder_examiner_suggestions_both"
      : "reminder_examiner_suggestions_single"
    : isBothAreas
      ? "request_examiner_suggestions_both"
      : "request_examiner_suggestions_single";
  const template = useMemo(
    () =>
      templates && templates.length
        ? templates.find((t) => t.name === templateName)
        : undefined,
    [templates, templateName]
  );

  useEffect(() => {
    if (!template) {
      setSubject(
        isReminder
          ? "Reminder for suggesting examiners"
          : "Request Examiner Suggestions"
      );
      setBody(
        isReminder
          ? "Reminder to suggest examiners for this application."
          : "Please suggest examiners for this application."
      );
    } else {
      const view = isBothAreas
        ? {
            supervisorName: "Supervisor",
            studentName: application.student.name,
            examinerCount: toSuggest,
            qualifyingArea1: application.qualifyingArea1,
            qualifyingArea2: application.qualifyingArea2,
            link: FRONTEND_URL + "/phd/supervisor/examiner-suggestions",
          }
        : {
            supervisorName: "Supervisor",
            studentName: application.student.name,
            examinerCount: toSuggest,
            qualifyingArea: selectedAreas[0],
            link: FRONTEND_URL + "/phd/supervisor/examiner-suggestions",
          };
      setSubject(Mustache.render(template.subject, view));
      setBody(Mustache.render(template.body, view));
    }
  }, [isReminder, template, application, toSuggest, selectedAreas, isBothAreas]);

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
    const data = {
      subject,
      body,
      applicationId: application.id,
      areas: selectedAreas,
      deadline: deadline ? new Date(deadline).toISOString() : undefined,
    };
    const parseResult =
      phdSchemas.requestExaminerSuggestionsBodySchema.safeParse(data);
    if (!parseResult.success) {
      toast.error(
        "Please check the following fields: " +
          parseResult.error.errors.map((e) => e.message).join(", ")
      );
      return;
    }
    sendNotificationMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col">
        <DialogHeader>
          <DialogTitle>Request Examiner Suggestions</DialogTitle>
        </DialogHeader>
        <div className="flex-grow space-y-4 pr-2">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline (Optional)</Label>
            <Input
              id="deadline"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
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
