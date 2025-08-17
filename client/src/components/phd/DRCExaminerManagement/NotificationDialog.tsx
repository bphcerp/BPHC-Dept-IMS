import React, { useState, useEffect, lazy, Suspense } from "react";
import { useMutation } from "@tanstack/react-query";
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
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingSpinner } from "@/components/ui/spinner";
import { useTheme } from "@/hooks/use-theme";
import type { phdSchemas } from "lib";

const MDEditor = lazy(() => import("@uiw/react-md-editor"));

interface NotificationDialogProps {
  isOpen: boolean;
  onClose: (val: boolean) => void;
  initialData: {
    recipients: string[];
    subject: string;
    body: string;
    link?: string;
  };
}

const NotificationDialog: React.FC<NotificationDialogProps> = ({
  isOpen,
  onClose,
  initialData,
}) => {
  const editorTheme = useTheme();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [channels, setChannels] = useState<phdSchemas.NotificationChannels>({
    email: true,
    notification: true,
    todo: false,
  });

  useEffect(() => {
    if (isOpen) {
      setSubject(initialData.subject);
      setBody(initialData.body);
    }
  }, [isOpen, initialData]);

  const sendNotificationMutation = useMutation({
    mutationFn: (payload: phdSchemas.NotificationPayload) =>
      api.post("/sendNotification", payload),
    onSuccess: () => {
      toast.success("Notifications sent successfully!");
      onClose(false);
    },
    onError: () => {
      toast.error("Failed to send notifications.");
    },
  });

  const handleSend = () => {
    if (!subject.trim() || !body.trim()) {
      toast.error("Subject and body cannot be empty.");
      return;
    }
    if (!channels.email && !channels.notification && !channels.todo) {
      toast.error("Please select at least one channel.");
      return;
    }
    sendNotificationMutation.mutate({
      recipients: initialData.recipients,
      subject,
      body,
      channels,
      link: initialData.link,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col">
        <DialogHeader>
          <DialogTitle>Send Notification</DialogTitle>
          <DialogDescription>
            Sending to {initialData.recipients.length} recipient(s). Edit the
            message and choose the delivery channels.
          </DialogDescription>
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
          <div className="mr-auto flex items-center space-x-4">
            <Label>Channels:</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="email-channel"
                checked={channels.email}
                onCheckedChange={(checked) =>
                  setChannels((c) => ({ ...c, email: !!checked }))
                }
              />
              <Label htmlFor="email-channel">Email</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="notification-channel"
                checked={channels.notification}
                onCheckedChange={(checked) =>
                  setChannels((c) => ({ ...c, notification: !!checked }))
                }
              />
              <Label htmlFor="notification-channel">Notification</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="todo-channel"
                checked={channels.todo}
                onCheckedChange={(checked) =>
                  setChannels((c) => ({ ...c, todo: !!checked }))
                }
              />
              <Label htmlFor="todo-channel">To-do</Label>
            </div>
          </div>
          <Button variant="outline" onClick={() => onClose(false)}>
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

export default NotificationDialog;
