import {
  AllocationFormTemplatePreferenceFieldType,
  NewAllocationFormTemplateField,
} from "node_modules/lib/src/types/allocationFormBuilder";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { Course } from "node_modules/lib/src/types/allocation";
import { Controller, FieldValues, UseFormReturn } from "react-hook-form";

export type AllocationClientField = NewAllocationFormTemplateField & {
  id: string;
  value?: string | number;
  preferences?: { courseId: number; takenConsecutively: boolean }[];
};

const formatPreferenceType = (
  type?: AllocationFormTemplatePreferenceFieldType
) => {
  if (!type) return "";
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
};

export const FormTemplateFieldComponent = ({
  field,
  create,
  courses,
  form,
}: {
  field: AllocationClientField;
  create: boolean;
  courses: Course[];
  form?: UseFormReturn<FieldValues, any, undefined>;
}) => {
  switch (field.type) {
    case "TEACHING_ALLOCATION":
      return (
        <div className="relative w-32">
          <Input
            {...form?.register(`${field.id}_teachingAllocation`, {
              required: true,
            })}
            disabled={create}
            required
            type="number"
            placeholder="e.g., 50"
          />
          <span className="absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
            %
          </span>
        </div>
      );

    case "PREFERENCE":
      return (
        <div className="space-y-4">
          <div className="space-y-3">
            {Array.from({ length: field.preferenceCount || 1 }).map((_, i) => (
              <div key={i} className="flex items-end gap-4">
                <div className="flex-grow space-y-2">
                  <Label>
                    Preference {i + 1} (
                    {formatPreferenceType(field.preferenceType)})
                  </Label>
                  <Controller
                    name={`${field.id}_preference_${i}`}
                    control={form?.control}
                    rules={{
                      required: true,
                    }}
                    render={({ field }) => (
                      <Select
                        disabled={create}
                        {...field}
                        required
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a course..." />
                        </SelectTrigger>
                        {!create && (
                          <SelectContent>
                            {courses.map((course) => (
                              <SelectItem key={course.code} value={course.code}>
                                {course.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        )}
                      </Select>
                    )}
                  />
                </div>
                <div className="flex shrink-0 items-center pb-2">
                  <Controller
                    name={`${field.id}_courseAgain_${i}`}
                    control={form?.control}
                    render={({ field: controllerField }) => (
                      <Checkbox
                        {...controllerField}
                        checked={controllerField.value}
                        onCheckedChange={controllerField.onChange}
                        id={`course-again-${field.id}-${i}`}
                        disabled={create}
                      />
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="text-xs italic text-muted-foreground">
            {create && (
              <p>Note: The list of courses will be populated automatically.</p>
            )}
            <p>
              {" "}
              Check the box if you have been the course's In-Charge more than 2
              times consecutively.
            </p>
          </div>
        </div>
      );

    default:
      return null;
  }
};
