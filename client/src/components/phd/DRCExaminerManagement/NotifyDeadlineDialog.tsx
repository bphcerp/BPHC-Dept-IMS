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

export interface ViewData {
  examName: string;
  semesterYear: string;
  semesterNumber: string;
  submissionDeadline: string;
  examStartDate: string;
  examEndDate: string;
  vivaDate: string;
}

const NotifyDeadlineDialog = ({
  isOpen,
  setIsOpen,
  view,
  isUpdated = false,
}: {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  view: ViewData | null;
  isUpdated?: boolean;
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

  const templateName = isUpdated
    ? "exam_deadlines_updated"
    : "new_exam_announcement";
  const template = useMemo(
    () =>
      templates && templates.length
        ? templates.find((t) => t.name === templateName)
        : undefined,
    [templates, templateName]
  );

  useEffect(() => {
    if (!template) {
      setSubject("");
      setBody("");
    } else {
      setSubject(Mustache.render(template.subject, view ?? {}));
      setBody(Mustache.render(template.body, view ?? {}));
    }
  }, [view, template]);

  const sendNotificationMutation = useMutation({
    mutationFn: (payload: phdSchemas.NotifyDeadlinePayload) =>
      api.post("/phd/staff/notifyDeadline", payload),
    onSuccess: () => {
      toast.success("Users notified");
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
    };
    const parseResult = phdSchemas.notifyDeadlinePayloadSchema.safeParse(data);
    if (!parseResult.success) {
      toast.error("Please check all fields");
      return;
    }
    sendNotificationMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col">
        <DialogHeader>
          <DialogTitle>Notify Exam Deadlines</DialogTitle>
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

export default NotifyDeadlineDialog;
