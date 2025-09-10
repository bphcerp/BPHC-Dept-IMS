import { useState, useEffect, lazy, Suspense, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import Mustache from "mustache";

const MDEditor = lazy(() => import("@uiw/react-md-editor"));

interface EmailTemplate {
  name: string;
  subject: string;
  body: string;
}

const NotifyExaminerDialog = ({
  isOpen,
  setIsOpen,
  application,
  area,
  onSuccess,
}: {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  application: phdSchemas.VerifiedApplication;
  area: string;
  onSuccess: () => void;
}) => {
  const editorTheme = useTheme();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const { data: templates = [] } = useQuery({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const response = await api.get<EmailTemplate[]>(
        "/phd/staff/emailTemplates"
      );
      return response.data;
    },
  });

  const examinerEmail = application.examinerAssignments[area]?.examinerEmail;
  const isReminder = !!application.examinerAssignments[area]?.notifiedAt;

  const notifyMutation = useMutation({
    mutationFn: (data: phdSchemas.NotifyExaminerPayload) =>
      api.post(`/phd/drcMember/notifyExaminer/${application.id}`, data),
    onSuccess: () => {
      toast.success(`Notification sent to ${examinerEmail}`);
      onSuccess();
    },
    onError: () => {
      toast.error(`Failed to send notification`);
    },
  });

  const templateName = isReminder
    ? "reminder_examiner_qp"
    : "notify_examiner_assignment";
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
          ? `Reminder: Question Paper Submission for ${area}`
          : `Question Paper Submission Required for ${area}`
      );
      setBody(
        isReminder
          ? `This is a reminder that your question paper for the qualifying area "${area}" is still pending submission.\n\nPlease submit it at your earliest convenience.\n\nBest regards,\nDRC Committee`
          : `You have been assigned as an examiner for the qualifying area "${area}" for student ${application.student.name}.\n\nPlease prepare and submit your question paper.\n\nBest regards,\nDRC Committee`
      );
    } else {
      const view = {
        examinerName: "Faculty Member",
        studentName: application.student.name,
        qualifyingArea: area,
      };
      setSubject(Mustache.render(template.subject, view));
      setBody(Mustache.render(template.body, view));
    }
  }, [isReminder, template, application, area]);

  const handleSubmit = () => {
    if (!subject.trim() || !body.trim()) {
      toast.error("Please fill in both subject and body.");
      return;
    }

    notifyMutation.mutate({
      subject,
      body,
      area,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col">
        <DialogHeader>
          <DialogTitle>
            {isReminder ? "Send Reminder to Examiner" : "Notify Examiner"}
          </DialogTitle>
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
          <Button onClick={handleSubmit} disabled={notifyMutation.isLoading}>
            {notifyMutation.isLoading && (
              <LoadingSpinner className="mr-2 h-4 w-4" />
            )}
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NotifyExaminerDialog;
