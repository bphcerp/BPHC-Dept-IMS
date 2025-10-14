import { useEffect, useState } from "react";
import api from "@/lib/axios-instance";
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
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, PlusCircle, AlertTriangle } from "lucide-react";
import {
  AllocationFormTemplate,
  AllocationFormTemplateFieldType,
  AllocationFormTemplatePreferenceFieldType,
  NewAllocationFormTemplate,
} from "node_modules/lib/src/types/allocationFormBuilder";
import {
  AllocationClientField,
  FormTemplateFieldComponent,
} from "@/components/allocation/FormTemplateFieldComponent";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import { Course, CourseGroup } from "node_modules/lib/src/types/allocation";

export const fieldTypes: AllocationFormTemplateFieldType[] = [
  "PREFERENCE",
  "TEACHING_ALLOCATION",
];

export const DEFAULT_LABELS: Record<AllocationFormTemplateFieldType, string> = {
  PREFERENCE: "Please rank your course preferences.",
  TEACHING_ALLOCATION: "What is your teaching allocation?",
};

const FormTemplateView = ({ create = true }) => {
  const [fields, setFields] = useState<AllocationClientField[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [groups, setGroups] = useState<CourseGroup[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const navigate = useNavigate();

  const [templateToView, setTemplateToView] =
    useState<AllocationFormTemplate | null>(null);

  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    console.log("wau", create);
    if (!create) {
      const fetchCourses = async () => {
        try {
          const response = await api.get("/allocation/course/get");
          setCourses(response.data);
        } catch (error) {
          console.error("Error fetching courses:", error);
        }
      };

      const fetchTemplate = async () => {
        try {
          const response = await api.get(
            `/allocation/builder/template/get/${id}`
          );
          console.log(response.data);
          setTemplateToView(response.data);
        } catch (error) {
          console.error("Error fetching courses:", error);
        }
      };

      fetchTemplate();
      fetchCourses();
    }

    const fetchGroups = async () => {
      try {
        const response = await api.get("/allocation/groups/get");
        setGroups(response.data);
      } catch (error) {
        console.error("Error fetching groups:", error);
      }
    };

    fetchGroups();
  }, [create, id]);

  const addField = () => {
    setFields((prevFields) => [
      ...prevFields,
      {
        id: Date.now().toString(),
        label: DEFAULT_LABELS.PREFERENCE,
        type: "PREFERENCE",
        preferenceCount: 3,
        preferenceType: "LECTURE",
      },
    ]);
  };

  const updateField = (
    id: string,
    key: keyof AllocationClientField,
    value: AllocationClientField[keyof AllocationClientField]
  ) => {
    setFields((prevFields) =>
      prevFields.map((field) =>
        field.id === id ? { ...field, [key]: value } : field
      )
    );
  };

  const handleTypeChange = (
    fieldId: string,
    oldType: AllocationFormTemplateFieldType,
    newType: AllocationFormTemplateFieldType
  ) => {
    updateField(fieldId, "type", newType);

    const currentField = fields.find((f) => f.id === fieldId);
    if (!currentField) return;

    if (currentField.label === DEFAULT_LABELS[oldType]) {
      updateField(fieldId, "label", DEFAULT_LABELS[newType]);
    }
  };

  const removeField = (id: string) => {
    setFields((prevFields) => prevFields.filter((field) => field.id !== id));
  };

  const handleSaveTemplate = async () => {
    if (!templateName || !templateDescription || !fields.length){
      toast.warning("Please fill all required fields")
      return
    }
    try {
      const templateCreateData: NewAllocationFormTemplate = {
        name: templateName,
        description: templateDescription,
        fields: fields.map(({ id, ...field }) => field),
      };
      await api.post("/allocation/builder/template/create", templateCreateData);
      toast.success("Template saved successfully!");
      navigate("/allocation/templates");
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Failed to save template.");
    }
  };

  return (
    (create || templateToView) && (
      <div className="mx-auto max-w-4xl space-y-8 p-4 md:p-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            {create ? "Create Form Template" : "Preview Form Template"}
          </h1>
          <p className="text-muted-foreground">
            {create
              ? "Define the template details, then add and configure your fields."
              : "Preview the form template details."}
          </p>
        </div>
        {create ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                placeholder="e.g., Course Preference Form"
                className="text-lg"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Description</Label>
              <Input
                id="description"
                placeholder="e.g., Form to collect course preferences from students"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
              />
            </div>
          </div>
        ) : (
          <div>
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold text-primary">
                {templateToView!.name}
              </h2>
              <p className="text-muted-foreground">
                {templateToView!.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-4 text-sm">
              <p>
                <span className="text-muted-foreground">By: </span>
                <span className="font-medium text-foreground">
                  {templateToView!.createdBy.name}
                </span>
              </p>
              <p>
                <span className="text-muted-foreground">On: </span>
                <span className="text-foreground">
                  {new Date(templateToView!.createdAt).toLocaleString("en-IN", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Asia/Kolkata",
                    timeZoneName: "short",
                  })}
                </span>
              </p>
            </div>
          </div>
        )}
        <Separator />

        <div className="space-y-6">
          {(create ? fields : templateToView!.fields!).map((field) => (
            <Card key={field.id} className="border-border">
              <CardHeader className="gap-4 bg-muted/50 p-4">
                <div className="flex items-center justify-between">
                  <Input
                    placeholder="Enter question label..."
                    value={field.label}
                    onChange={(e) =>
                      updateField(field.id, "label", e.target.value)
                    }
                    className="h-auto border-none bg-transparent p-0 text-base font-semibold shadow-none focus-visible:ring-0"
                    readOnly={!create}
                  />
                  {create && (
                    <div className="col-start-2 flex items-center gap-2 md:col-start-3">
                      <Select
                        value={field.type}
                        onValueChange={(value: AllocationFormTemplateFieldType) =>
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
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <FormTemplateFieldComponent
                  field={field}
                  create={create}
                  courses={courses}
                />
                {create && field.type === "PREFERENCE" && (
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
                          <Label className="text-xs">
                            This is preference for
                          </Label>
                          <RadioGroup
                            value={field.preferenceType}
                            onValueChange={(
                              value: AllocationFormTemplatePreferenceFieldType
                            ) => updateField(field.id, "preferenceType", value)}
                            className="flex items-center space-x-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem
                                value="LECTURE"
                                id={`r1-${field.id}`}
                              />
                              <Label htmlFor={`r1-${field.id}`}>Lecture</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem
                                value="TUTORIAL"
                                id={`r2-${field.id}`}
                              />
                              <Label htmlFor={`r2-${field.id}`}>Tutorial</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem
                                value="PRACTICAL"
                                id={`r3-${field.id}`}
                              />
                              <Label htmlFor={`r3-${field.id}`}>
                                Practical
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription className="text-xs">
                            This setting is important. Mismatching this with the
                            question label may lead to unexpected behavior
                            during allocation.
                          </AlertDescription>
                        </Alert>
                      </div>
                    </div>
                  </div>
                )}
                {create && field.type === "PREFERENCE" && (
                  <div className="space-y-4">
                    <Separator />
                    <Label className="text-sm font-medium">Group Setting</Label>
                    <div className="space-y-2">
                      <Label
                        htmlFor={`group-setting-${field.id}`}
                        className="text-xs"
                      >
                        Select a group for this preference field
                      </Label>
                      <Select
                        value={field.groupId || ""}
                        onValueChange={(value) =>
                          updateField(field.id, "groupId", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a group" />
                        </SelectTrigger>
                        <SelectContent>
                          {groups.map((group) => (
                            <SelectItem key={group.id} value={group.id}>
                              {group.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {create && (
          <div className="flex justify-center">
            <Button
              onClick={addField}
              variant="outline"
              className="w-full border-dashed md:w-1/2"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Add Field
            </Button>
          </div>
        )}
        {create && (
          <div className="flex justify-end pt-4">
            <Button size="lg" onClick={handleSaveTemplate}>
              Save Template
            </Button>
          </div>
        )}
      </div>
    )
  );
};

export default FormTemplateView;
