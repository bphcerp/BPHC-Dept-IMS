import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function ResubmissionDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Resubmission</DialogTitle>
        </DialogHeader>
        <div className="p-4 text-gray-600">
          This is a placeholder for resubmission details or actions.
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ResubmissionDialog;
