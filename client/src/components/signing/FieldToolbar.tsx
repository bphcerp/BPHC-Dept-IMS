import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { PenTool, Calendar, Type, Plus } from "lucide-react";
import { SignatureField } from "@/views/Signing/Dashboard";

interface FieldToolbarProps {
  onFieldAdd: (field: Omit<SignatureField, "id">) => void;
  disabled?: boolean;
}

export const FieldToolbar: React.FC<FieldToolbarProps> = ({
  onFieldAdd,
  disabled = false,
}) => {
  const [selectedFieldType, setSelectedFieldType] = useState<"signature" | "date" | "text" | null>(null);
  const [fieldPlaceholder, setFieldPlaceholder] = useState("");

  const fieldTypes = [
    {
      type: "signature" as const,
      label: "Signature",
      icon: PenTool,
      description: "Add a signature field",
      color: "text-blue-600",
      bgColor: "hover:bg-blue-50",
      defaultSize: { width: 200, height: 80 },
    },
    {
      type: "date" as const,
      label: "Date",
      icon: Calendar,
      description: "Add a date field",
      color: "text-green-600",
      bgColor: "hover:bg-green-50",
      defaultSize: { width: 150, height: 40 },
    },
    {
      type: "text" as const,
      label: "Text",
      icon: Type,
      description: "Add a text input field",
      color: "text-orange-600",
      bgColor: "hover:bg-orange-50",
      defaultSize: { width: 180, height: 40 },
    },
  ];

  const handleAddField = (type: "signature" | "date" | "text") => {
    const fieldType = fieldTypes.find(ft => ft.type === type);
    if (!fieldType) return;

    const newField: Omit<SignatureField, "id"> = {
      type,
      position: { x: 100, y: 100 }, // Default position
      size: fieldType.defaultSize,
      page: 1, // Default to first page
      placeholder: fieldPlaceholder || `Enter ${type}`,
    };

    onFieldAdd(newField);
    setFieldPlaceholder("");
    setSelectedFieldType(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Fields
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Field Type Buttons */}
        <div className="grid gap-2">
          {fieldTypes.map((fieldType) => {
            const Icon = fieldType.icon;
            return (
              <Button
                key={fieldType.type}
                variant={selectedFieldType === fieldType.type ? "default" : "outline"}
                className={`justify-start h-auto p-3 ${fieldType.bgColor}`}
                onClick={() => {
                  if (disabled) return;
                  setSelectedFieldType(
                    selectedFieldType === fieldType.type ? null : fieldType.type
                  );
                }}
                disabled={disabled}
              >
                <Icon className={`w-4 h-4 mr-3 ${fieldType.color}`} />
                <div className="text-left">
                  <div className="font-medium">{fieldType.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {fieldType.description}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>

        {/* Field Configuration */}
        {selectedFieldType && (
          <>
            <Separator />
            <div className="space-y-3">
              <div>
                <Label htmlFor="placeholder">Placeholder Text</Label>
                <Input
                  id="placeholder"
                  placeholder={`Enter ${selectedFieldType} placeholder...`}
                  value={fieldPlaceholder}
                  onChange={(e) => setFieldPlaceholder(e.target.value)}
                  disabled={disabled}
                />
              </div>

              <Button
                onClick={() => handleAddField(selectedFieldType)}
                className="w-full"
                disabled={disabled}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add {fieldTypes.find(ft => ft.type === selectedFieldType)?.label} Field
              </Button>
            </div>
          </>
        )}

      </CardContent>
    </Card>
  );
};
