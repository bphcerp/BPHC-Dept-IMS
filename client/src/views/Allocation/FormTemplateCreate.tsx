import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, PlusCircle, GripVertical, AlertTriangle } from "lucide-react";

type FieldType = "PREFERENCE" | "TEACHING_ALLOCATION";
type PreferenceType = "Lecture" | "Tutorial" | "Practical";

type Field = {
  id: number;
  label: string;
  type: FieldType;
  preferenceCount: number;
  preferenceType: PreferenceType;
};

const fieldTypes: FieldType[] = ["PREFERENCE", "TEACHING_ALLOCATION"];

const DEFAULT_LABELS: Record<FieldType, string> = {
  PREFERENCE: "Please rank your course preferences.",
  TEACHING_ALLOCATION: "What is your teaching allocation?",
};

const FormTemplateCreate = () => {
  const [fields, setFields] = useState<Field[]>([]);

  const addField = () => {
    setFields((prevFields) => [
      ...prevFields,
      {
        id: Date.now(),
        label: DEFAULT_LABELS.PREFERENCE,
        type: "PREFERENCE",
        preferenceCount: 3,
        preferenceType: "Lecture",
      },
    ]);
  };

  const updateField = (
    id: number,
    key: keyof Field,
    value: Field[keyof Field]
  ) => {
    setFields((prevFields) =>
      prevFields.map((field) =>
        field.id === id ? { ...field, [key]: value } : field
      )
    );
  };

  const handleTypeChange = (
    fieldId: number,
    oldType: FieldType,
    newType: FieldType
  ) => {
    updateField(fieldId, "type", newType);

    const currentField = fields.find((f) => f.id === fieldId);
    if (!currentField) return;

    if (currentField.label === DEFAULT_LABELS[oldType]) {
      updateField(fieldId, "label", DEFAULT_LABELS[newType]);
    }
  };

  const removeField = (id: number) => {
    setFields((prevFields) => prevFields.filter((field) => field.id !== id));
  };

  const renderFieldPreview = (field: Field) => {
    switch (field.type) {
      case "TEACHING_ALLOCATION":
        return (
          <div className="relative w-32">
            <Input disabled type="number" placeholder="e.g., 50" />
            <span className="absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
              %
            </span>
          </div>
        );
      case "PREFERENCE":
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              {Array.from({ length: field.preferenceCount || 1 }).map(
                (_, i) => (
                  <div key={i} className="flex items-end gap-4">
                    <div className="flex-grow space-y-2">
                      <Label>
                        Preference {i + 1} ({field.preferenceType})
                      </Label>
                      <Select disabled>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a course..." />
                        </SelectTrigger>
                      </Select>
                    </div>
                    <div className="flex shrink-0 items-center pb-2">
                      <Checkbox id={`course-again-${field.id}-${i}`} disabled />
                    </div>
                  </div>
                )
              )}
            </div>
            <p className="text-xs italic text-muted-foreground">
              Note: The list of courses will be populated automatically. Check
              the box if the student has taken that course more than 2 times
              consecutively.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 md:p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Create Form Template
        </h1>
        <p className="text-muted-foreground">
          Define the template details, then add and configure your fields.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="name">Template Name</Label>
        <Input
          id="name"
          placeholder="e.g., Course Preference Form"
          className="text-lg"
        />
      </div>
      <Separator />

      <div className="space-y-6">
        {fields.map((field) => (
          <Card key={field.id} className="border-border">
            <CardHeader className="grid grid-cols-[1fr_auto] items-center gap-4 bg-muted/50 p-4 md:grid-cols-[auto_1fr_auto]">
              <GripVertical className="hidden h-5 w-5 cursor-grab text-muted-foreground md:block" />
              <Input
                placeholder="Enter question label..."
                value={field.label}
                onChange={(e) => updateField(field.id, "label", e.target.value)}
                className="h-auto border-none bg-transparent p-0 text-base font-semibold shadow-none focus-visible:ring-0"
              />
              <div className="col-start-2 flex items-center gap-2 md:col-start-3">
                <Select
                  value={field.type}
                  onValueChange={(value: FieldType) =>
                    handleTypeChange(field.id, field.type, value)
                  }
                >
                  <SelectTrigger className="w-[220px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => removeField(field.id)}
                  variant="ghost"
                  size="icon"
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div>{renderFieldPreview(field)}</div>

              {field.type === "PREFERENCE" && (
                <div className="space-y-4">
                  <Separator />
                  <Label className="text-sm font-medium">Configuration</Label>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label
                        htmlFor={`pref-count-${field.id}`}
                        className="text-xs"
                      >
                        Number of Preferences
                      </Label>
                      <Input
                        id={`pref-count-${field.id}`}
                        type="number"
                        min="1"
                        max="10"
                        value={field.preferenceCount}
                        onChange={(e) =>
                          updateField(
                            field.id,
                            "preferenceCount",
                            parseInt(e.target.value, 10) || 1
                          )
                        }
                        className="w-24"
                      />
                    </div>
                    <div className="flex flex-col space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs">This is preference for</Label>
                        <RadioGroup
                          value={field.preferenceType}
                          onValueChange={(value: PreferenceType) =>
                            updateField(field.id, "preferenceType", value)
                          }
                          className="flex items-center space-x-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="Lecture"
                              id={`r1-${field.id}`}
                            />
                            <Label htmlFor={`r1-${field.id}`}>Lecture</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="Tutorial"
                              id={`r2-${field.id}`}
                            />
                            <Label htmlFor={`r2-${field.id}`}>Tutorial</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="Practical"
                              id={`r3-${field.id}`}
                            />
                            <Label htmlFor={`r3-${field.id}`}>Practical</Label>
                          </div>
                        </RadioGroup>
                      </div>
                      <Alert variant="destructive">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="size-8" />
                          <AlertDescription className="text-xs">
                            This setting is important. Mismatching this with the
                            question label may lead to unexpected behavior
                            during allocation.
                          </AlertDescription>
                        </div>
                      </Alert>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-center">
        <Button
          onClick={addField}
          variant="outline"
          className="w-full border-dashed md:w-1/2"
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Add Field
        </Button>
      </div>
      <div className="flex justify-end pt-4">
        <Button size="lg">Save Template</Button>
      </div>
    </div>
  );
};

export default FormTemplateCreate;
