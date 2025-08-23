import React, { useState, useEffect, lazy, Suspense, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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

const MDEditor = lazy(() => import("@uiw/react-md-editor"));

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
  const areExaminersSuggested = useMemo(
    () => !!Object.keys(application.examinerSuggestions).length,
    [application.examinerSuggestions]
  );
  const supervisorTodosExists = application.supervisorTodoExists;
  const queryClient = useQueryClient();

  useEffect(() => {
    setSubject(
      !areExaminersSuggested
        ? supervisorTodosExists
          ? "Reminder for suggesting examiners"
          : "Request Examiner Suggestions"
        : "Re-request Examiner Suggestions"
    );
    setBody(
      !areExaminersSuggested
        ? supervisorTodosExists
          ? "Reminder:"
          : "Please suggest examiners for this application."
        : "Please provide an update on the suggested examiners."
    );
  }, [areExaminersSuggested, supervisorTodosExists]);

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
