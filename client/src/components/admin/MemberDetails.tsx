import type React from "react";
import { Badge } from "../ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "../ui/card";
import { Plus, UserCircle2, X } from "lucide-react";
import { DeactivateUserDialog } from "./DeactivateUserDialog";
import { Button } from "../ui/button";
import { AssignRoleComboBox } from "./AssignRoleDialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { adminSchemas } from "lib";
import { toast } from "sonner";

interface UserData {
  email: string;
  roles: string[];
  type: string;
  deactivated: boolean;
  name: string | null;
  [key: string]: string[] | number | boolean | string | null | undefined;
}

interface UserDetailsProps {
  data: UserData;
}

export const UserDetails: React.FC<UserDetailsProps> = ({ data }) => {
  const queryClient = useQueryClient();

  const editRoleMutation = useMutation({
    mutationFn: async (data: adminSchemas.EditRolesBody) => {
      await api.post("/admin/member/editroles", data);
    },
    onMutate(data) {
      // Optimistic update
      void queryClient.cancelQueries(["member", data.email]);
      const previousData = queryClient.getQueryData<UserData>([
        "member",
        data.email,
      ]);
      queryClient.setQueryData<UserData>(["member", data.email], (oldData) => {
        if (!oldData) return oldData;
        const roles = oldData.roles.filter(
          (role) => role !== (data.add ?? data.remove)!
        );
        return {
          ...oldData,
          roles: data.add ? [...roles, data.add] : roles,
        };
      });
      return { previousData };
    },
    onError: (_err, _variables, context) => {
      // If mutation fails, use context from onMutate to rollback
      queryClient.setQueryData<UserData>(
        ["member", data.email],
        context?.previousData
      );
      toast.error("An error occurred while editing roles");
    },
    onSettled: () => {
      void queryClient.invalidateQueries(["member", data.email]);
      void queryClient.invalidateQueries(["members"]);
      void queryClient.invalidateQueries(["roles"]);
    },
  });

  const renderValue = (
    key: string,
    value?: string[] | number | boolean | string | null
  ) => {
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
  };

  return (
    <Card className="mx-auto max-w-5xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">User Details</CardTitle>
      </CardHeader>
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
          {Object.entries(data).map(
            ([key, value]) =>
              key !== "name" &&
              key !== "type" && (
                <div key={key} className="space-y-1">
                  <div className="flex gap-2 text-sm uppercase text-muted-foreground">
                    {key.replace(/_/g, " ").toUpperCase()}
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
                  <div className="text-sm">{renderValue(key, value)}</div>
                </div>
              )
          )}
        </div>
      </CardContent>

      {!data.deactivated && (
        <CardFooter>
          <DeactivateUserDialog email={data.email} />
        </CardFooter>
      )}
    </Card>
  );
};

export default UserDetails;
