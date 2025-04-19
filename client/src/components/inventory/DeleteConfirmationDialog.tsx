import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteConfirmationDialogProps {
  onConfirm: () => void;
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  onConfirm,
}) => {
  const [step, setStep] = useState<1 | 2>(1);

  const handleCancel = () => {
    setStep(1);
  };

  const handleNext = () => setStep(2);

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) setStep(1);
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="text-destructive hover:bg-background hover:text-red-700"
        >
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? "Confirm Deletion" : "Final Confirmation"}
          </DialogTitle>
        </DialogHeader>
        {step === 1 ? (
          <p>Are you sure you want to delete this item?</p>
        ) : (
          <p>Are you absolutely sure you want to proceed with the deletion?</p>
        )}
        <DialogFooter>
          {step === 1 ? (
            <>
              <Button variant="secondary" onClick={handleCancel}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleNext}>
                Yes, Delete
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={handleCancel}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={onConfirm}>
                Confirm Deletion
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmationDialog;
