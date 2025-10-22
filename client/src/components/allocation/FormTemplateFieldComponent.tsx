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
import {
  Course,
  CourseGroupMinimal,
} from "node_modules/lib/src/types/allocation";
import { Controller, FieldValues, UseFormReturn } from "react-hook-form";
import { useState } from "react";
import { Skeleton } from "../ui/skeleton";
import { Role } from "../admin/RoleList";

export type AllocationClientField = NewAllocationFormTemplateField & {
  id: string;
  value?: string | number;
  preferences?: { courseCode: string; takenConsecutively: boolean }[];
  group?: CourseGroupMinimal | null;
  viewableByRole?: Role | null;
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
  preview = false,
  form,
}: {
  field: AllocationClientField;
  create: boolean;
  courses: Course[];
  preview?: boolean;
  form?: UseFormReturn<FieldValues, any, undefined>;
}) => {
  const filteredCourses = field.groupId
    ? courses?.filter((course: Course) =>
        course.groups?.some((group) => group.id === field.groupId)
      )
    : courses;

  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);

  const handleCourseChange = (courseCode: string, index: number) => {
    const updatedSelectedCourses = [...selectedCourses];
    updatedSelectedCourses[index] = courseCode;
    setSelectedCourses(updatedSelectedCourses);
  };

  const renderError = (name: string) => {
    const error = form?.formState.errors?.[name];
    if (!error) return null;
    return (
      <p className="mt-1 text-xs text-destructive">
        {(error as any)?.message || "This field is required"}
      </p>
    );
  };

  switch (field.type) {
    case "TEACHING_ALLOCATION":
      return (
        <div>
          <div className="relative w-32">
            {form ? (
              <>
                <Input
                  {...form.register(`${field.id}_teachingAllocation`, {
                    required: "Teaching allocation is required",
                  })}
                  disabled={create}
                  required
                  type="number"
                  placeholder="e.g., 50"
                />
                {renderError(`${field.id}_teachingAllocation`)}
              </>
            ) : (
              <Input
                value={field.value || ""}
                disabled
                type="number"
                placeholder="e.g., 50"
              />
            )}
            <span className="absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
              %
            </span>
          </div>
          {(!form || create) && !!field.viewableByRole && (
            <span className="text-xs text-destructive">
              This field will not be visible to members without the "
              {field.viewableByRole.roleName}" role
            </span>
          )}
        </div>
      );

    case "PREFERENCE":
      return (
        <div className="space-y-4">
          <div className="space-y-3">
            {Array.from({ length: field.preferenceCount || 1 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-1">
                <div className="flex items-end gap-4">
                  <div className="flex-grow space-y-2">
                    <Label>
                      Preference {i + 1} (
                      {formatPreferenceType(field.preferenceType)})
                      { (i < field.noOfRequiredPreferences!) && <span className="text-red-500 text-lg">*</span> }
                    </Label>
                    {form ? (
                      <>
                        <Controller
                          name={`${field.id}_preference_${i}`}
                          control={form.control}
                          rules={{
                            required: (!!field.noOfRequiredPreferences && i < field.noOfRequiredPreferences) ? "Please select a course" : false,
                          }}
                          render={({ field: controllerField }) => (
                            <Select
                              required
                              onValueChange={(value) => {
                                controllerField.onChange(value);
                                handleCourseChange(value, i);
                              }}
                              value={controllerField.value}
                            >
                              <SelectTrigger {...controllerField}>
                                <SelectValue placeholder="Select a course..." />
                              </SelectTrigger>
                              {filteredCourses ? (
                                <SelectContent>
                                  {filteredCourses
                                    .filter(
                                      (course) =>
                                        !selectedCourses.includes(
                                          course.code
                                        ) ||
                                        course.code === controllerField.value
                                    )
                                    .map((course) => (
                                      <SelectItem
                                        key={course.code}
                                        value={course.code}
                                      >
                                        {course.code} {course.name}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              ) : (
                                <Skeleton className="h-full w-full" />
                              )}
                            </Select>
                          )}
                        />
                        {renderError(`${field.id}_preference_${i}`)}
                      </>
                    ) : (
                      <Select
                        value={
                          filteredCourses.find(
                            (c) => c.code === field.preferences?.[i]?.courseCode
                          )?.code || ""
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a course..." />
                        </SelectTrigger>
                        <SelectContent>
                          {!!filteredCourses &&
                            filteredCourses.map((course) => (
                              <SelectItem key={course.code} value={course.code}>
                                {course.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center pb-2">
                    {form ? (
                      <Controller
                        name={`${field.id}_courseAgain_${i}`}
                        control={form.control}
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
                    ) : (
                      <Checkbox
                        checked={
                          field.preferences?.[i]?.takenConsecutively || false
                        }
                        id={`course-again-${field.id}-${i}`}
                        disabled
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {(!form || create) && !preview && (
            <div className="flex w-fit flex-col space-y-2 rounded-sm border p-2 text-xs italic text-muted-foreground">
              {field.viewableByRole ? (
                <span className="text-destructive">
                  This field will not be visible to members without the "
                  {field.viewableByRole.roleName}" role
                </span>
              ) : (
                <span className="text-success">
                  This field will be visible to all members who have access to
                  this form
                </span>
              )}
              <p>The list of courses will be populated automatically.</p>
            </div>
          )}
          <div className="flex flex-col space-y-2 text-xs italic text-muted-foreground">
            <p>
              Check the box if you have been the course's In-Charge more than 2
              times consecutively.
            </p>

            {!!field.group && (
              <p>
                This field is populated with courses from group:{" "}
                {field.group.name}
              </p>
            )}
          </div>
        </div>
      );

    default:
      return null;
  }
};
