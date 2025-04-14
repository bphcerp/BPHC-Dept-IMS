import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { LoadingSpinner } from "@/components/ui/spinner";

interface EmailTemplateEditorProps {
  examType: string;
  dates: {
    deadline: string;
    examStartDate?: string;
    examEndDate?: string;
    vivaDate?: string;
  };
  onClose: () => void;
}

const EmailTemplateEditor: React.FC<EmailTemplateEditorProps> = ({
  examType,
  dates,
  onClose,
}) => {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  // Initialize default templates when component mounts
  useEffect(() => {
    const deadlineDate = new Date(dates.deadline).toLocaleString();
    const startDate = dates.examStartDate ? new Date(dates.examStartDate).toLocaleString() : 'N/A';
    const endDate = dates.examEndDate ? new Date(dates.examEndDate).toLocaleString() : 'N/A';
    const vivaDate = dates.vivaDate ? new Date(dates.vivaDate).toLocaleString() : 'N/A';

    // Set default subject
    setSubject(`New ${examType} Deadline Announced`);

    // Set default body based on exam type
    if (examType === "Regular Qualifying Exam") {
      setBody(`
<p>Dear Student,</p>

<p>We are pleased to announce that a new <strong>${examType}</strong> has been scheduled.</p>

<p><strong>Important Dates:</strong></p>
<ul>
  <li><strong>Registration Deadline:</strong> ${deadlineDate}</li>
  <li><strong>Exam Start Date:</strong> ${startDate}</li>
  <li><strong>Exam End Date:</strong> ${endDate}</li>
  <li><strong>Viva Date:</strong> ${vivaDate}</li>
</ul>

<p>Please make sure to submit your application before the registration deadline.</p>

<p>Best regards,<br>
PhD Administration</p>
      `);
    } else if (examType === "Thesis Proposal") {
      setBody(`
<p>Dear Student,</p>

<p>We are pleased to announce that a new <strong>${examType}</strong> deadline has been set.</p>

<p><strong>Important Dates:</strong></p>
<ul>
  <li><strong>Submission Deadline:</strong> ${deadlineDate}</li>
</ul>

<p>Please make sure to submit your thesis proposal before the deadline.</p>

<p>Best regards,<br>
PhD Administration</p>
      `);
    }
  }, [examType, dates]);

  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post("/phd/staff/notifyAllUsers", {
        subject,
        body,
        examType,
        dates,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Notification emails sent successfully");
      onClose();
    },
    onError: (error) => {
      toast.error("Failed to send notification emails");
      console.error("Email sending error:", error);
    },
  });

  return (
    <div className="space-y-6 p-6 bg-white rounded-md shadow-lg">
      <h2 className="text-xl font-bold">Email Notification Template</h2>
      
      <div className="space-y-2">
        <label htmlFor="subject" className="font-medium">
          Subject
        </label>
        <Input
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Email subject"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="body" className="font-medium">
          Body
        </label>
        <Textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={12}
          className="min-h-[300px] font-mono"
        />
      </div>

      <div className="bg-gray-100 border p-4 rounded-md">
        <h3 className="font-medium mb-2">Preview:</h3>
        <div 
          className="p-4 bg-white border rounded-md" 
          dangerouslySetInnerHTML={{ __html: body }}
        />
      </div>

      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={() => sendEmailMutation.mutate()}
          disabled={sendEmailMutation.isLoading}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          {sendEmailMutation.isLoading ? (
            <>
              <LoadingSpinner className="mr-2 h-4 w-4" />
              Sending...
            </>
          ) : (
            "Send Notification"
          )}
        </Button>
      </div>
    </div>
  );
};

export default EmailTemplateEditor;
