// client/src/components/phd/proposal/RequestSeminarDetailsDialog.tsx
import React, { useState, useEffect, lazy, Suspense, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import { FRONTEND_URL } from "@/lib/constants";
import Mustache from "mustache";
import { z } from "zod";

const MDEditor = lazy(() => import("@uiw/react-md-editor"));

interface EmailTemplate {
  name: string;
  subject: string;
  body: string;
}

interface ProposalLite {
  id: number;
  supervisorEmail: string;
  student: {
    name: string | null;
  };
}

interface RequestSeminarDetailsDialogProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  proposals: ProposalLite[];
  type: "request" | "reminder";
  onSuccess: () => void;
}

const RequestSeminarDetailsDialog: React.FC<
  RequestSeminarDetailsDialogProps
> = ({ isOpen, setIsOpen, proposals, type, onSuccess }) => {
  const editorTheme = useTheme();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [deadline, setDeadline] = useState("");

  const { data: templates = [] } = useQuery({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const response = await api.get<EmailTemplate[]>("/phd/staff/emailTemplates");
      return response.data;
    },
  });

  const templateName =
    type === "request" ? "request_seminar_details" : "reminder_seminar_details";

  const template = useMemo(
    () => templates.find((t) => t.name === templateName),
    [templates, templateName]
  );

  useEffect(() => {
    if (template && proposals.length > 0) {
      // Use the first proposal for template rendering, as it's a bulk action
      const firstProposal = proposals[0];
      const view = {
        supervisorName: "Supervisor", // Generic placeholder
        studentName: firstProposal.student.name || "your student",
        link: `${FRONTEND_URL}/phd/supervisor/proposal/${firstProposal.id}`,
      };
      setSubject(Mustache.render(template.subject, view));
      setBody(Mustache.render(template.body, view));
    }
  }, [template, proposals, type]);

  const mutation = useMutation({
    mutationFn: (
      data:
        | z.infer<typeof phdSchemas.requestSeminarDetailsSchema>
        | z.infer<typeof phdSchemas.remindSeminarDetailsSchema>
    ) => {
      const url =
        type === "request"
          ? "/phd/proposal/drcConvener/requestSeminarDetails"
          : `/phd/proposal/drcConvener/remindSeminarDetails`;
      return api.post(url, data);
    },
    onSuccess: () => {
      toast.success(
        `${type === "request" ? "Requests" : "Reminders"} sent successfully!`
      );
      onSuccess();
      setIsOpen(false);
    },
    onError: (err) => {
      toast.error(
        (err as { response: { data: { message: string } } }).response?.data?.message || "Failed to send notifications."
      );
    },
  });

  const handleSend = () => {
    if (!subject.trim() || !body.trim()) {
      toast.error("Subject and body cannot be empty.");
      return;
    }

    if (type === "request") {
      const requests = proposals.map((p) => ({
        proposalId: p.id,
        subject,
        body,
        deadline: deadline ? new Date(deadline) : undefined,
      }));
      mutation.mutate({ requests });
    } else if (type === "reminder" && proposals.length === 1) {
      // Reminder is for a single proposal
      mutation.mutate({
        proposalId: proposals[0].id,
        subject,
        body,
        deadline: deadline ? new Date(deadline) : undefined,
      });
    }
  };

  const recipients = Array.from(
    new Set(proposals.map((p) => p.supervisorEmail))
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col">
        <DialogHeader>
          <DialogTitle>
            {type === "request"
              ? "Request Seminar Details"
              : "Send Reminder for Seminar Details"}
          </DialogTitle>
          <DialogDescription>
            You are sending a notification to {recipients.length} supervisor(s):{" "}
            {recipients.join(", ")}
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
          <div className="space-y-2">
            <Label htmlFor="deadline">To-do Deadline (Optional)</Label>
            <Input
              id="deadline"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="mt-4 border-t pt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={mutation.isLoading}>
            {mutation.isLoading && <LoadingSpinner className="mr-2 h-4 w-4" />}
            Send Notification
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RequestSeminarDetailsDialog;
