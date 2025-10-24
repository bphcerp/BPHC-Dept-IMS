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
import { formatStatus } from "@/lib/utils";

const MDEditor = lazy(() => import("@uiw/react-md-editor"));

interface EmailTemplate {
  name: string;
  subject: string;
  body: string;
  description?: string;
}

interface ProposalLite {
  id: number;
  supervisorEmail: string;
  student: {
    name: string | null;
    email: string;
  };
  status: string;
  title?: string;
}

interface RequestSeminarDetailsDialogProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  proposals: ProposalLite[];
  type: "request" | "reminder";
  onSuccess: () => void;
}

const bulkReminderSchema = z.object({
  targetEmails: z.array(z.string().email()).min(1),
  proposalIds: z.array(z.number().positive()),
  subject: z.string().min(1),
  body: z.string().min(1),
  deadline: z.date().optional(),
});
type BulkReminderPayload = z.infer<typeof bulkReminderSchema>;

const getFacultyNames = async (
  emails: string[]
): Promise<Map<string, string | null>> => {
  if (emails.length === 0) {
    return new Map();
  }
  try {
    const facultyRes = await api.post<{ email: string; name: string | null }[]>(
      "/phd/proposal/drcConvener/getBulkDetails",
      { emails }
    );
    return new Map(facultyRes.data.map((f) => [f.email, f.name]));
  } catch (facultyError) {
    console.error("Failed to fetch faculty names:", facultyError);
    return new Map(emails.map((email) => [email, email]));
  }
};

const getRecipients = async (
  proposals: ProposalLite[]
): Promise<{ emails: string[]; description: string; names?: string[] }> => {
  if (proposals.length === 0)
    return { emails: [], description: "No recipients", names: [] };

  const firstStatus = proposals[0].status;
  let emailsSet = new Set<string>();
  let description = "";
  let namesSet = new Set<string>();

  try {
    switch (firstStatus) {
      case "draft":
      case "supervisor_revert":
      case "drc_revert":
      case "dac_revert":
        description = "Selected Student(s)";
        proposals.forEach((p) => {
          if (p.status === firstStatus) {
            emailsSet.add(p.student.email);
            namesSet.add(p.student.name || p.student.email);
          }
        });
        break;
      case "supervisor_review":
        description = "Selected Supervisor(s)";
        const supervisorEmails = proposals
          .filter((p) => p.status === firstStatus)
          .map((p) => p.supervisorEmail)
          .filter(Boolean);
        supervisorEmails.forEach((email) => emailsSet.add(email));

        const supervisorNameMap = await getFacultyNames(supervisorEmails);
        supervisorEmails.forEach((email) =>
          namesSet.add(supervisorNameMap.get(email) || email)
        );
        break;
      case "drc_review":
        description = "DRC Convenor(s)";
        const drcUsers = await api
          .get("/phd/proposal/getFacultyList?role=drc")
          .then((res) => res.data);
        drcUsers.forEach((user: { email: string; name: string | null }) => {
          emailsSet.add(user.email);
          namesSet.add(user.name || user.email);
        });
        break;
      case "dac_review":
        description = "Pending DAC Member(s)";
        const pendingDacEmails = new Set<string>();
        const pendingDacNames = new Set<string>();

        const proposalsInDacReview = proposals.filter(
          (p) => p.status === firstStatus
        );
        const proposalDetailsPromises = proposalsInDacReview.map((p) =>
          api.get(`/phd/proposal/drcConvener/viewProposal/${p.id}`)
        );
        const results = await Promise.all(proposalDetailsPromises);

        results.forEach((res) => {
          const proposalDetail = res.data;
          const reviewedEmails = new Set(
            (proposalDetail.dacReviews || [])
              .map((r: any) => r.dacMember?.email)
              .filter(Boolean)
          );
          (proposalDetail.dacMembers || []).forEach((member: any) => {
            const memberEmail =
              member.dacMember?.email || member.dacMemberEmail;
            const memberName =
              member.dacMember?.name || member.dacMemberName || memberEmail;
            if (memberEmail && !reviewedEmails.has(memberEmail)) {
              pendingDacEmails.add(memberEmail);
              pendingDacNames.add(memberName || memberEmail);
            }
          });
        });
        emailsSet = pendingDacEmails;
        namesSet = pendingDacNames;
        break;
      case "seminar_pending":
      case "dac_accepted":
        description = "Selected Supervisor(s)";
        const seminarSupervisorEmails = proposals
          .filter((p) => p.status === firstStatus)
          .map((p) => p.supervisorEmail)
          .filter(Boolean);
        seminarSupervisorEmails.forEach((email) => emailsSet.add(email));
        const seminarSupervisorNameMap = await getFacultyNames(
          seminarSupervisorEmails
        );
        seminarSupervisorEmails.forEach((email) =>
          namesSet.add(seminarSupervisorNameMap.get(email) || email)
        );
        break;
      default:
        description = `Recipient group for status "${formatStatus(firstStatus)}"`;
        break;
    }
  } catch (error) {
    toast.error("Could not determine recipients accurately.");
    console.error("Error fetching recipients:", error);
    description = "Error fetching recipients";
  }

  return {
    emails: Array.from(emailsSet),
    description,
    names: Array.from(namesSet),
  };
};

const RequestSeminarDetailsDialog: React.FC<
  RequestSeminarDetailsDialogProps
> = ({ isOpen, setIsOpen, proposals, type, onSuccess }) => {
  const editorTheme = useTheme();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [deadline, setDeadline] = useState("");
  const [recipients, setRecipients] = useState<string[]>([]);
  const [recipientDescription, setRecipientDescription] =
    useState("Loading...");
  const [recipientNamesPreview, setRecipientNamesPreview] = useState<string[]>(
    []
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

  const templateName = useMemo(() => {
    if (type === "request") {
      return "request_seminar_details";
    }

    // type is "reminder"
    const firstStatus = proposals[0]?.status;
    if (firstStatus === "draft") return "reminder_student_draft";
    if (firstStatus === "supervisor_review")
      return "reminder_supervisor_review";
    if (firstStatus === "drc_review") return "reminder_drc_review";
    if (firstStatus === "dac_review") return "reminder_dac_review";
    if (firstStatus === "supervisor_revert")
      return "reminder_supervisor_revert_student";
    if (firstStatus === "drc_revert") return "reminder_drc_revert_student";
    if (firstStatus === "dac_revert") return "reminder_dac_revert_student";
    if (["seminar_pending", "dac_accepted"].includes(firstStatus ?? "")) {
      return "reminder_seminar_details";
    }

    // Fallback for reminder if no specific status matches
    return "reminder_seminar_details";
  }, [type, proposals]);

  const template = useMemo(
    () => templates.find((t) => t.name === templateName),
    [templates, templateName]
  );

  useEffect(() => {
    let isMounted = true;
    if (isOpen && proposals.length > 0) {
      getRecipients(proposals).then((result) => {
        if (isMounted) {
          setRecipients(result.emails);
          setRecipientDescription(result.description);
          setRecipientNamesPreview(result.names || result.emails);
        }
      });
    } else if (!isOpen) {
      setRecipients([]);
      setRecipientDescription("No recipients");
      setRecipientNamesPreview([]);
      setSubject("");
      setBody("");
      setDeadline("");
    }
    return () => {
      isMounted = false;
    };
  }, [proposals, isOpen]);

  useEffect(() => {
    if (!isOpen || proposals.length === 0) return;

    const firstProposal = proposals[0];

    let link = FRONTEND_URL;
    if (templateName.includes("student"))
      link = `${FRONTEND_URL}/phd/phd-student/proposals`;
    if (
      templateName.includes("supervisor") ||
      templateName.includes("seminar_details")
    )
      link = `${FRONTEND_URL}/phd/supervisor/proposal/`;
    if (templateName.includes("drc"))
      link = `${FRONTEND_URL}/phd/drc-convenor/proposal-management/`;
    if (templateName.includes("dac"))
      link = `${FRONTEND_URL}/phd/dac/proposals/`;

    if (
      proposals.length === 1 &&
      !templateName.includes("draft") &&
      !templateName.includes("review") // Don't append ID for generic review reminders
    ) {
      link = `${link}${firstProposal.id}`;
    }

    const view = {
      supervisorName: "Supervisor",
      studentName: firstProposal.student.name || "Student",
      dacMemberName: "DAC Member",
      drcConvenerName: "DRC Convenor",
      proposalTitle: firstProposal.title || "your proposal",
      link: link,
    };

    if (template) {
      try {
        setSubject(Mustache.render(template.subject, view));
        setBody(Mustache.render(template.body, view));
      } catch (e) {
        console.error("Mustache rendering error:", e);
        toast.error("Error applying email template variables.");
        setSubject("Default Subject - Template Error");
        setBody("Default body content - Template Error.");
      }
    } else {
      console.warn(
        `Email template "${templateName}" not found. Using default content.`
      );
      setSubject(
        type === "request"
          ? "Action Required: PhD Proposal Seminar Details"
          : "Reminder: PhD Proposal Action Needed"
      );
      setBody(
        type === "request"
          ? `Dear Supervisor,\n\nPlease set the seminar details for your student, ${
              firstProposal.student.name || "N/A"
            }.\n\nLink: ${view.link}`
          : `Dear Recipient,\n\nThis is a reminder regarding the PhD proposal process.\n\nPlease log in to the portal to take the necessary action.`
      );
    }
  }, [template, templateName, proposals, type, isOpen]);

  const mutation = useMutation({
    mutationFn: (data: { endpoint: string; payload: any }) => {
      return api.post(data.endpoint, data.payload);
    },
    onSuccess: (_, variables) => {
      if (!(variables.payload.targetEmails && proposals.length > 0)) {
        toast.success(
          `${type === "request" ? "Request" : "Reminder"} sent successfully!`
        );
      }
      onSuccess();
      if (!(variables.payload.targetEmails && proposals.length > 0)) {
        setIsOpen(false);
      }
    },
    onError: (err) => {
      toast.error(
        (err as { response: { data: { message: string } } }).response?.data
          ?.message || "Failed to send one or more notifications."
      );
    },
  });

  const handleSend = () => {
    if (!subject.trim() || !body.trim()) {
      toast.error("Subject and body cannot be empty.");
      return;
    }
    if (recipients.length === 0) {
      toast.error("No recipients identified for this reminder.");
      return;
    }

    const deadlineDate = deadline ? new Date(deadline) : undefined;

    if (type === "request") {
      const requests = proposals.map((p) => ({
        proposalId: p.id,
        subject,
        body,
        deadline: deadlineDate,
      }));
      const parsed = phdSchemas.requestSeminarDetailsSchema.safeParse({
        requests,
      });
      if (!parsed.success) {
        toast.error(`Invalid data: ${parsed.error.errors[0]?.message}`);
        return;
      }
      mutation.mutate({
        endpoint: "/phd/proposal/drcConvener/requestSeminarDetails",
        payload: parsed.data,
      });
    } else if (type === "reminder") {
      const bulkReminderData: BulkReminderPayload = {
        targetEmails: recipients,
        proposalIds: proposals.map((p) => p.id),
        subject,
        body,
        deadline: deadlineDate,
      };
      const parsed = bulkReminderSchema.safeParse(bulkReminderData);
      if (!parsed.success) {
        toast.error(`Invalid bulk data: ${parsed.error.errors[0]?.message}`);
        return;
      }

      mutation.mutate({
        endpoint: "/phd/proposal/drcConvener/sendBulkReminder",
        payload: parsed.data,
      });

      toast.info(`Initiated sending ${recipients.length} reminder(s)...`);
      onSuccess();
      setIsOpen(false);
    }
  };

  const recipientsPreview =
    recipientNamesPreview.slice(0, 5).join(", ") +
    (recipientNamesPreview.length > 5
      ? ` and ${recipientNamesPreview.length - 5} more...`
      : "");

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col">
        <DialogHeader>
          <DialogTitle>
            {type === "request"
              ? "Request Seminar Details"
              : "Send General Reminder"}
          </DialogTitle>
          <DialogDescription>
            Sending to {recipients.length} recipient(s) ({recipientDescription}
            ): {recipientsPreview || "None identified"}
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
          <Button
            onClick={handleSend}
            disabled={mutation.isLoading || recipients.length === 0}
          >
            {mutation.isLoading && <LoadingSpinner className="mr-2 h-4 w-4" />}
            Send Notification
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RequestSeminarDetailsDialog;
