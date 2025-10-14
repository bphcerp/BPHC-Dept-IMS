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
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { Skeleton } from "../ui/skeleton";

export type AllocationClientField = NewAllocationFormTemplateField & {
  id: string;
  value?: string | number;
  preferences?: { courseCode: string; takenConsecutively: boolean }[];
};

const formatPreferenceType = (
  type?: AllocationFormTemplatePreferenceFieldType
) => {
  if (!type) return "";
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
};

const fetchCourses = async () => {
  const response = await api.get<Course[]>("/allocation/course/get");
  return response.data;
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
  const { data: allCourses } = useQuery(["courses"], fetchCourses);

  const filteredCourses = field.groupId ? allCourses?.filter(
    (course: Course) => course.groupId === field.groupId
  ) : allCourses

  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);

  const handleCourseChange = (courseCode: string, index: number) => {
    const updatedSelectedCourses = [...selectedCourses];
    updatedSelectedCourses[index] = courseCode;
    setSelectedCourses(updatedSelectedCourses);
  };

  switch (field.type) {
    case "TEACHING_ALLOCATION":
      return (
        <div>
          <div className="relative w-32">
            {form ? (
              <Input
                {...form.register(`${field.id}_teachingAllocation`, {
                  required: true,
                })}
                disabled={create}
                required
                type="number"
                placeholder="e.g., 50"
              />
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
          {(!form || create) && (
            <span className="text-xs text-destructive">
              This field will not be visible to non-faculty members
            </span>
          )}
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
                  {form ? (
                    <Controller
                      name={`${field.id}_preference_${i}`}
                      control={form.control}
                      rules={{
                        required: true,
                      }}
                      render={({ field: controllerField }) => (
                        <Select
                          disabled={create}
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
                          {!create && (
                            filteredCourses ? <SelectContent>
                              {filteredCourses
                                .filter(
                                  (course) =>
                                    !selectedCourses.includes(course.code) ||
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
                            </SelectContent> : <Skeleton className="w-full h-full" />
                          )}
                        </Select>
                      )}
                    />
                  ) : (
                    <Select
                      disabled
                      value={
                        courses.find(
                          (c) => c.code === field.preferences?.[i]?.courseCode
                        )?.code || ""
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a course..." />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
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
            ))}
          </div>
          {( !form || create) && (
            <div className="flex w-fit flex-col space-y-2 rounded-sm border p-2 text-xs italic text-muted-foreground">
              {field.preferenceType === "LECTURE" ? (
                <span className="text-destructive">
                  This field ( Lecture ) will not be visible to non-faculty
                  members
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
          <div className="text-xs italic text-muted-foreground">
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
