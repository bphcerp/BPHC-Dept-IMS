import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InventoryItem } from "node_modules/lib/src/types/inventory";
import { AlertTriangleIcon } from "lucide-react";

const SAFETY_TIMEOUT = 5000;

interface DeleteConfirmationDialogProps {
  onConfirm: () => void;
  selectedItem: InventoryItem;
}

const DeleteItemConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  onConfirm,
  selectedItem,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [safetyTimeout, setSafetyTimeout] = useState(SAFETY_TIMEOUT);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (step === 1 && safetyTimeout > 0) {
      timer = setTimeout(() => {
        setSafetyTimeout((prev) => {
          if (prev <= 1000) {
            if (timer) clearTimeout(timer);
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [step, safetyTimeout]);

  const handleNext = () => setStep(2);

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          setStep(1);
          setSafetyTimeout(SAFETY_TIMEOUT);
        }
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
      <DialogContent className="!max-w-[800px]">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? "Confirm Deletion" : "Final Confirmation"}
          </DialogTitle>
        </DialogHeader>
        {step === 1 ? (
          <span>Are you sure you want to delete this item?</span>
        ) : (
          <div className="flex flex-col space-y-2 text-red-500 text-center">
            <span className="text-lg font-semibold">This action is IRREVERSIBLE</span>
            <span>Are you absolutely sure you want to proceed with the deletion?</span>
          </div>
        )}
        <div className={`flex space-x-2 ${step === 1 ? 'text-secondary' : 'text-red-500'}`}>
          <AlertTriangleIcon />
          <span>
            This is a item with quantity {selectedItem.quantity}, deleting this
            item will delete all {selectedItem.quantity} entries with the serial number {selectedItem.serialNumber.toString().padStart(4, '0')}
          </span>
        </div>
        <div className="max-h-48 overflow-y-auto rounded border">
          <table className="w-full table-auto border-collapse text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-4 py-2">Equipment ID</th>
                <th className="border px-4 py-2">Name</th>
                <th className="border px-4 py-2">Lab</th>
                <th className="border px-4 py-2">PO Number</th>
              </tr>
            </thead>
            <tbody>
              {
                <tr key={selectedItem.id}>
                  <td className="border px-4 py-2">
                    {selectedItem.equipmentID}
                  </td>
                  <td className="border px-4 py-2">{selectedItem.itemName}</td>
                  <td className="border px-4 py-2">{selectedItem.lab.name}</td>
                  <td className="border px-4 py-2">{selectedItem.poNumber}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <DialogFooter>
          {step === 1 ? (
              <Button
                variant="destructive"
                onClick={handleNext}
                disabled={!!safetyTimeout}
              >
                {safetyTimeout
                  ? `Wait (${safetyTimeout / 1000}s)`
                  : "Yes, Delete"}
              </Button>
          ) : (
              <Button variant="destructive" onClick={onConfirm}>
                Confirm Deletion
              </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteItemConfirmationDialog;
