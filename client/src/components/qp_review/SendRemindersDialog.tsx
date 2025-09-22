import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mail, AlertCircle } from "lucide-react";

interface SendReminderDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onConfirm?: () => Promise<void> | void;
  recipientCount?: number;
  disabled?: boolean;
}

export default function SendReminderDialog({ 
  trigger, 
  open, 
  onOpenChange, 
  onConfirm,
  recipientCount = 0,
  disabled = false
}: SendReminderDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    } else {
      setIsOpen(newOpen);
    }
  };

  const handleConfirm = async () => {
    if (!onConfirm) return;
    
    setSending(true);
    try {
      await onConfirm();
      handleOpenChange(false);
    } catch (error) {
      console.error("Error sending reminders:", error);
    } finally {
      setSending(false);
    }
  };

  const dialogOpen = open !== undefined ? open : isOpen;

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            Send Email Reminders
          </DialogTitle>
          <DialogDescription className="text-left">
            Are you sure you want to send email reminders?
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-800 mb-1">
              This will send email notifications to:
            </p>
            <ul className="text-amber-700 space-y-1">
              <li>• Instructors with pending document submissions</li>
              <li>• Reviewers with pending review assignments</li>
              {recipientCount > 0 && (
                <li className="font-medium">
                  • Total recipients: {recipientCount}
                </li>
              )}
            </ul>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={sending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={sending || disabled}
            className="flex items-center gap-2"
          >
            <Mail className="h-4 w-4" />
            {sending ? "Sending..." : "Send Reminders"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
