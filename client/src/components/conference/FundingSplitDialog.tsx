import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Trash2, Plus } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { conferenceSchemas } from "lib";

export interface FundingSplit {
  source: string;
  amount?: string;
}

interface FundingSplitDialogProps {
  totalAmount: number;
  fundingSplit: FundingSplit[];
  onFundingSplitChange: (split: FundingSplit[]) => void;
}

export function FundingSplitDialog({
  totalAmount,
  fundingSplit,
  onFundingSplitChange,
}: FundingSplitDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localSplit, setLocalSplit] = useState<FundingSplit[]>(fundingSplit);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleOpen = () => {
    setLocalSplit(fundingSplit);
    setValidationErrors([]);
    setIsOpen(true);
  };

  const validateFundingSplit = (split: FundingSplit[]) => {
    const errors: string[] = [];

    try {
      conferenceSchemas.upsertApplicationClientSchema.shape.fundingSplit.parse(
        split
      );
    } catch (error: unknown) {
      if (error && typeof error === "object" && "errors" in error) {
        const zodError = error as { errors: Array<{ message: string }> };
        errors.push(...zodError.errors.map((e) => e.message));
      }
    }

    // Additional validation for total amount mismatch
    const fundingTotal = split.reduce(
      (sum, item) => sum + parseFloat(item.amount || "0"),
      0
    );

    if (Math.abs(fundingTotal - totalAmount) > 0.01) {
      errors.push(
        `Total funding split (₹${fundingTotal.toFixed(
          2
        )}) must equal total reimbursement amount (₹${totalAmount.toFixed(2)})`
      );
    }

    return errors;
  };

  const handleSave = () => {
    // Filter out any splits with 0 amount before validation and saving
    const filteredSplit = localSplit.filter(
      (split) => parseFloat(split.amount || "0") > 0
    );

    const errors = validateFundingSplit(filteredSplit);

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Final validation before saving
    const finalTotal = filteredSplit.reduce(
      (sum, split) => sum + parseFloat(split.amount || "0"),
      0
    );

    if (Math.abs(finalTotal - totalAmount) > 0.01) {
      // Auto-adjust to match total exactly
      const ratio = totalAmount / (finalTotal || 1);
      const adjustedSplit = filteredSplit.map((split) => ({
        ...split,
        amount: (parseFloat(split.amount || "0") * ratio).toFixed(2),
      }));
      onFundingSplitChange(adjustedSplit);
    } else {
      onFundingSplitChange(filteredSplit);
    }
    setIsOpen(false);
  };

  const handleCancel = () => {
    setLocalSplit(fundingSplit);
    setValidationErrors([]);
    setIsOpen(false);
  };

  const addFundingSource = () => {
    const remainingAmount = Math.max(0, totalAmount - totalAllocated);
    setLocalSplit([
      ...localSplit,
      { source: "", amount: remainingAmount.toFixed(2) },
    ]);
  };

  const removeFundingSource = (index: number) => {
    setLocalSplit(localSplit.filter((_, i) => i !== index));
  };

  const updateAmountFromSlider = (index: number, percentage: number) => {
    const newAmount = (percentage / 100) * totalAmount;
    const updated = localSplit.map((split, i) => ({
      ...split,
      amount: i === index ? newAmount.toFixed(2) : split.amount,
    }));
    const newTotal = updated.reduce(
      (sum, split) => sum + parseFloat(split.amount || "0"),
      0
    );
    // If the new total exceeds the limit, proportionally adjust ALL splits
    if (newTotal > totalAmount + 0.001) {
      const ratio = totalAmount / newTotal;
      updated.forEach((split) => {
        split.amount = (parseFloat(split.amount || "0") * ratio).toFixed(2);
      });
    }

    setLocalSplit(updated);
  };

  const updateFundingSource = (
    index: number,
    field: keyof FundingSplit,
    value: string
  ) => {
    const updated = localSplit.map((split, i) =>
      i === index ? { ...split, [field]: value } : split
    );
    // If updating amount, ensure total doesn't exceed totalAmount
    if (field === "amount") {
      const newTotal = updated.reduce(
        (sum, split) => sum + parseFloat(split.amount || "0"),
        0
      );
      if (newTotal > totalAmount + 0.001) {
        // Proportionally reduce all amounts to fit within total
        const ratio = totalAmount / newTotal;
        updated.forEach((split) => {
          split.amount = (parseFloat(split.amount || "0") * ratio).toFixed(2);
        });
      }
    }

    setLocalSplit(updated);
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const getPercentage = (amount: string) => {
    if (totalAmount === 0) return 0;
    return (parseFloat(amount || "0") / totalAmount) * 100;
  };

  const totalAllocated = localSplit.reduce(
    (sum, split) => sum + parseFloat(split.amount || "0"),
    0
  );

  const currentValidationErrors = validateFundingSplit(localSplit);
  const hasValidationErrors = currentValidationErrors.length > 0;

  const isFullyAllocated = Math.abs(totalAmount - totalAllocated) <= 0.001;

  const canSave =
    isFullyAllocated && !hasValidationErrors && localSplit.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          onClick={handleOpen}
          className="min-w-[140px]"
        >
          {fundingSplit.length > 0 ? "Edit Funding" : "Split Funding"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Split Funding Sources</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Total Amount: ₹{totalAmount.toFixed(2)}
            </span>
            <span className="text-sm text-muted-foreground">
              Allocated: ₹{totalAllocated.toFixed(2)}
            </span>
          </div>

          <Separator />

          {/* Display validation errors */}
          {validationErrors.length > 0 && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3">
              <div className="mb-2 text-sm font-medium text-red-700">
                Please fix the following errors:
              </div>
              <ul className="space-y-1 text-sm text-red-600">
                {validationErrors.map((error, index) => (
                  <li key={index} className="list-inside list-disc">
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Display current validation errors (real-time) */}
          {validationErrors.length === 0 && hasValidationErrors && (
            <div className="rounded-md border border-orange-200 bg-orange-50 p-3">
              <div className="mb-2 text-sm font-medium text-orange-700">
                Validation warnings:
              </div>
              <ul className="space-y-1 text-sm text-orange-600">
                {currentValidationErrors.map((error, index) => (
                  <li key={index} className="list-inside list-disc">
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-4">
            {localSplit.map((split, index) => (
              <div key={index} className="space-y-4 rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Label
                      htmlFor={`source-${index}`}
                      className="text-sm font-medium"
                    >
                      Funding Source
                    </Label>
                    <Input
                      id={`source-${index}`}
                      placeholder="e.g., Department Funds, Personal Funds"
                      value={split.source}
                      onChange={(e) =>
                        updateFundingSource(index, "source", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFundingSource(index)}
                    className="mt-6"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Label
                        htmlFor={`amount-${index}`}
                        className="text-sm font-medium"
                      >
                        Amount (₹)
                      </Label>
                      <Input
                        id={`amount-${index}`}
                        type="number"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={parseFloat(split.amount || "0").toFixed(2)}
                        step="0.01"
                        max={totalAmount}
                        onChange={(e) => {
                          let value = e.target.value;
                          const decimalIndex = value.indexOf(".");
                          if (
                            decimalIndex !== -1 &&
                            value.length > decimalIndex + 3
                          ) {
                            value = value.substring(0, decimalIndex + 3);
                          }
                          if (parseFloat(value || "0") <= totalAmount + 0.001) {
                            updateFundingSource(index, "amount", value);
                          }
                        }}
                        onBlur={(e) => {
                          // Format to 2 decimals on blur
                          const value = parseFloat(
                            e.target.value || "0"
                          ).toFixed(2);
                          updateFundingSource(index, "amount", value);
                        }}
                        className="mt-1"
                      />
                    </div>
                    <div className="mt-6 text-sm text-muted-foreground">
                      {getPercentage(split.amount ?? "0").toFixed(2)}%
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Percentage of Total
                    </Label>
                    <Slider
                      value={[getPercentage(split.amount ?? "0")]}
                      onValueChange={([value]) =>
                        updateAmountFromSlider(index, value)
                      }
                      max={100}
                      step={0.01}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={addFundingSource}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Funding Source
          </Button>

          {Math.abs(totalAmount - totalAllocated) > 0.001 && (
            <div
              className={`rounded-md border p-3 ${
                totalAllocated > totalAmount + 0.001
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-orange-200 bg-orange-50 text-orange-700"
              }`}
            >
              <div className="text-sm font-medium">
                {totalAllocated > totalAmount + 0.001
                  ? `Over-allocated by ₹${(
                      totalAllocated - totalAmount
                    ).toFixed(2)}`
                  : `Remaining ₹${(totalAmount - totalAllocated).toFixed(2)} to allocate`}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!canSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
