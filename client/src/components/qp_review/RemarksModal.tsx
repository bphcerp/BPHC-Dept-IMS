"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function RemarksModal({
  open,
  onOpenChange,
  initialValue,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValue: string;
  onSave: (remarks: string) => void;
}) {
  const [remarks, setRemarks] = useState(initialValue);

  useEffect(() => {
    setRemarks(initialValue);
  }, [initialValue]);

  const handleSave = () => {
    onSave(remarks);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Additional Remarks</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <Textarea
            placeholder="Enter your detailed remarks here..."
            className="min-h-[200px]"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Remarks</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
