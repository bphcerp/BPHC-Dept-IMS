import type React from "react";
import { useCallback, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, UserCircle2, X, User } from "lucide-react";
import { DeactivateUserDialog } from "./DeactivateUserDialog";
import { Button } from "@/components/ui/button";
import { AssignRoleComboBox } from "./AssignRoleDialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { adminSchemas, phdSchemas } from "lib";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import DeleteUserDialog from "./DeleteUserDialog";
import ProfileImageUploader from "@/components/shared/ProfileImageUploader";

interface UserDetailsProps {
  data: adminSchemas.MemberDetailsResponse;
}

const editableFields = [
  "name",
  "phone",
  "department",
  "designation",
  "room",
  "psrn",
  "authorId",
  "idNumber",
  "erpId",
  "instituteEmail",
  "mobile",
  "personalEmail",
  "notionalSupervisorEmail",
  "supervisorEmail",
  "emergencyPhoneNumber",
  "phdType",
] as const;

export const UserDetails: React.FC<UserDetailsProps> = ({ data }) => {
  const queryClient = useQueryClient();
  const form = useForm<adminSchemas.EditDetailsBody>({
    resolver: zodResolver(adminSchemas.editDetailsBodySchema),
  });

  const editRoleMutation = useMutation({
    mutationFn: async (data: adminSchemas.EditRolesBody) => {
      await api.post("/admin/member/editroles", data);
    },
    onMutate(data) {
      void queryClient.cancelQueries({ queryKey: ["member", data.email] });
      const previousData =
        queryClient.getQueryData<adminSchemas.MemberDetailsResponse>([
          "member",
          data.email,
        ]);
      queryClient.setQueryData<adminSchemas.MemberDetailsResponse>(
        ["member", data.email],
        (oldData) => {
          if (!oldData) return oldData;
          const roles = oldData.roles.filter(
            (role) => role !== (data.add ?? data.remove)!
          );
          return {
            ...oldData,
            roles: data.add ? [...roles, data.add] : roles,
          };
        }
      );
      return { previousData };
    },
    onError: (_err, _variables, context) => {
      queryClient.setQueryData<adminSchemas.MemberDetailsResponse>(
        ["member", data.email],
        context?.previousData
      );
      toast.error("An error occurred while editing roles");
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["member", data.email] });
      void queryClient.invalidateQueries({ queryKey: ["members"] });
      void queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });

  const editDataMutation = useMutation({
    mutationFn: async (data: adminSchemas.EditDetailsBody) => {
      await api.post("/admin/member/editdetails", data);
    },
    onMutate(data) {
      void queryClient.cancelQueries({ queryKey: ["member", data.email] });
      const previousData =
        queryClient.getQueryData<adminSchemas.MemberDetailsResponse>([
          "member",
          data.email,
        ]);
      queryClient.setQueryData<adminSchemas.MemberDetailsResponse>(
        ["member", data.email],
        (oldData) => {
          if (!oldData) return oldData;
          return { ...oldData, ...data };
        }
      );
      return { previousData };
    },
    onError: (err, _variables, context) => {
      queryClient.setQueryData<adminSchemas.MemberDetailsResponse>(
        ["member", data.email],
        context?.previousData
      );
      const errorMessage = "An error occurred while editing details";
      toast.error(
        isAxiosError(err)
          ? ((err.response?.data as string) ?? errorMessage)
          : errorMessage
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["member", data.email] });
    },
  });

  const [isEditing, setIsEditing] = useState(false);

  const onSubmit: SubmitHandler<adminSchemas.EditDetailsBody> = (formData) => {
    void editDataMutation.mutateAsync(formData).then(() => setIsEditing(false));
  };

  const renderValue = useCallback(
    (key: string, value?: string[] | number | boolean | string | null) => {
      if (value === undefined || value === null) return "-";
      if (Array.isArray(value)) {
        if (value.length === 0) return "-";
        return (
          <div className="flex flex-wrap items-center gap-2">
            {value.map((item, index) =>
              key === "roles" ? (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex gap-1 pt-1"
                >
                  {item}
                  <button
                    className="p-1 pr-0"
                    onClick={() => {
                      editRoleMutation.mutate({
                        email: data.email,
                        remove: item,
                      });
                    }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ) : (
                <span key={index} className="underline">
                  {item}
                </span>
              )
            )}
          </div>
        );
      }
      if (typeof value === "boolean") {
        return value === true ? "Yes" : "No";
      }
      return String(value);
    },
    [data.email, editRoleMutation]
  );

  return (
    <div className="space-y-6">
      <Card className="mx-auto max-w-5xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Image
          </CardTitle>
          <p className="text-sm text-gray-600">
            Manage user&apos;s profile image
          </p>
        </CardHeader>
        <CardContent>
          <ProfileImageUploader email={data.email} isAdmin={true} />
        </CardContent>
      </Card>

      {/* User Details Section */}
      <Card className="mx-auto max-w-5xl">
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold">User Details</CardTitle>
        </CardHeader>

        {isEditing ? (
          <Form {...form}>
            <form
              onSubmit={(e) => {
                void form.handleSubmit(onSubmit)(e);
              }}
            >
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {Object.keys(data).map((key) => {
                    const fieldName = key as (typeof editableFields)[number];
                    if (!editableFields.includes(fieldName)) return null;

                    if (data.type === "phd" && fieldName === "designation")
                      return null;
                    if (data.type !== "phd" && fieldName === "phdType")
                      return null;

                    return (
                      <div key={fieldName} className="space-y-1">
                        <FormField
                          control={form.control}
                          name={fieldName}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {fieldName
                                  .replace(/([A-Z]+)/g, " $1")
                                  .toUpperCase()}
                              </FormLabel>
                              <FormControl>
                                {fieldName === "phdType" ? (
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value ?? undefined}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select PhD Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {phdSchemas.phdTypes.map((type) => (
                                        <SelectItem key={type} value={type}>
                                          {type}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Input
                                    {...field}
                                    value={field.value ?? ""}
                                    className="col-span-3"
                                  />
                                )}
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button type="submit" disabled={editDataMutation.isLoading}>
                  Save
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={editDataMutation.isLoading}
                >
                  Cancel
                </Button>
              </CardFooter>
            </form>
          </Form>
        ) : (
          <>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <UserCircle2 className="h-16 w-16 text-gray-400" />
                <div>
                  <h2 className="text-xl font-semibold">
                    {data.name ?? "Invite pending"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {data.type?.toUpperCase() || "N/A"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {Object.entries(data).map(([key, value]) => {
                  if (key === "name" || key === "type") return null;
                  if (data.type === "phd" && key === "designation") return null;
                  if (data.type !== "phd" && key === "phdType") return null;

                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex gap-2 text-sm uppercase text-muted-foreground">
                        {key.replace(/([A-Z]+)/g, " $1").toUpperCase()}
                        {key === "roles" && !data.deactivated && (
                          <AssignRoleComboBox
                            existing={data.roles}
                            callback={(role) => {
                              editRoleMutation.mutate({
                                email: data.email,
                                add: role,
                              });
                            }}
                          >
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-5 w-5 items-start"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </AssignRoleComboBox>
                        )}
                      </div>
                      <div className="text-sm">
                        {renderValue(key, value as any)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <div className="flex items-center gap-2">
                {!data.deactivated && (
                  <DeactivateUserDialog email={data.email} />
                )}
                <DeleteUserDialog email={data.email} />
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(true);
                  form.reset(
                    Object.fromEntries(
                      Object.entries(data).map(([key, value]) => [
                        key,
                        value ?? "",
                      ])
                    ) as any
                  );
                }}
              >
                Edit
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
};

export default UserDetails;
