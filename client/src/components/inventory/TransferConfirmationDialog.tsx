import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import api from "@/lib/axios-instance";
import { InventoryItem } from "node_modules/lib/src/types/inventory";
import { AlertTriangleIcon } from "lucide-react";

interface TransferConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  selectedItems: InventoryItem[];
  onTransferSuccess: () => void;
}

export const TransferConfirmationDialog = ({
  open,
  onClose,
  selectedItems,
  onTransferSuccess,
}: TransferConfirmationDialogProps) => {
  const [labs, setLabs] = useState<{ id: string; name: string }[]>([]);
  const [selectedLabId, setSelectedLabId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      api
        .get("/inventory/labs/get")
        .then(({ data }) => setLabs(data))
        .catch(() => toast.error("Failed to fetch labs"));
    }
  }, [open]);

  const handleTransfer = () => {
    if (!selectedLabId) {
      toast.error("Please select a destination lab");
      return;
    }

    setLoading(true);
    api
      .patch("/inventory/transfer", {
        itemIds: selectedItems.map((item) => item.id),
        destLabId: selectedLabId,
      })
      .then(() => {
        toast.success("Items transferred successfully");
        onTransferSuccess();
        onClose();
      })
      .catch(() => toast.error("Failed to transfer items"))
      .finally(() => setLoading(false));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Transfer Items</DialogTitle>
        </DialogHeader>
        <div
          className="flex space-x-2 text-secondary"
        >
          <AlertTriangleIcon />
          <span>The transfer functionality is still a <u>work in progress</u>. There is a possibility of unexpected behaviour. Please use with caution.</span>
        </div>
        <div className="space-y-4">
          <p>Review the items to be transferred:</p>
          <div className="max-h-48 overflow-y-auto rounded border">
            <table className="w-full table-auto border-collapse text-left">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-4 py-2">Equipment ID</th>
                  <th className="border px-4 py-2">Name</th>
                  <th className="border px-4 py-2">Source Lab</th>
                </tr>
              </thead>
              <tbody>
                {selectedItems.map((item, index) => (
                  <tr
                    key={item.id}
                    className={index % 2 === 0 ? "bg-gray-50" : ""}
                  >
                    <td className="border px-4 py-2">{item.equipmentID}</td>
                    <td className="border px-4 py-2">{item.itemName}</td>
                    <td className="border px-4 py-2">{item.lab.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>Select the destination lab for the selected items:</p>
          <Select onValueChange={setSelectedLabId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a lab" />
            </SelectTrigger>
            <SelectContent>
              {labs.map((lab) => (
                <SelectItem key={lab.id} value={lab.id}>
                  {lab.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleTransfer}
              disabled={loading || !selectedLabId}
            >
              {loading ? "Transferring..." : "Transfer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
