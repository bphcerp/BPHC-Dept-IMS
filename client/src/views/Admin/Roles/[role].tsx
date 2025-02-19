import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/spinner";
import { useAllPermissions } from "@/hooks/Admin/AllPermissions";
import api from "@/lib/axios-instance";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Edit, Minus, X } from "lucide-react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

interface Role {
  role: string;
  allowed: string[];
  disallowed: string[];
}

const RoleDetailsView = () => {
  const params = useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const role = params["role"];
  const { data: roleData } = useQuery({
    queryKey: ["role", role],
    queryFn: async () => {
      const res = await api.get<Role>(`admin/role/${role}`);
      return res.data;
    },
  });
  const {
    data: allPermissions,
    isFetching: isFetchingPermissions,
    isError: isErrorPermissions,
  } = useAllPermissions();

  // ✅ Mutation for updating role name
  const updateRoleMutation = useMutation({
    mutationFn: async (newRoleName: string) => {
      await api.post(`admin/role/rename`, {
        oldName: role,
        newName: newRoleName,
      });
    },
    onSuccess: () => {
      toast.success("Role updated successfully!");
      queryClient.invalidateQueries(["role", role]);
      navigate(`/admin/roles/${newRole}`);
    },
    onError: () => {
      toast.error("Failed to update role.");
    },
  });

  // ✅ Mutation for updating permissions
  const updatePermissionMutation = useMutation({
    mutationFn: async (data: {
      permission: string;
      action: "allow" | "disallow" | "none";
    }) => {
      await api.post(`admin/role/edit/${role}`, data);
    },
    onMutate: async ({ permission, action }) => {
      await queryClient.cancelQueries(["role", role]);
      const previousData = queryClient.getQueryData<Role>(["role", role]);
      // Optimistic update
      queryClient.setQueryData<Role>(["role", role], (oldData) => {
        if (!oldData) return;
        const role = oldData.role;
        const allowed = oldData.allowed.filter((p) => p !== permission);
        const disallowed = oldData.disallowed.filter((p) => p !== permission);
        if (action === "allow") {
          return {
            role,
            allowed: [...allowed, permission],
            disallowed,
          };
        } else if (action === "disallow") {
          return {
            role,
            allowed,
            disallowed: [...disallowed, permission],
          };
        } else {
          return {
            role,
            allowed,
            disallowed,
          };
        }
      });
      return { previousData };
    },
    onError: (_err, _variables, context) => {
      // If mutation fails, use context from onMutate to rollback
      queryClient.setQueryData<Role>(["role", role], context?.previousData);
      toast.error("An error occurred while updating role permissions.");
    },
    onSettled: () => {
      void queryClient.refetchQueries(["role", role]);
    },
  });

  // role rename dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState("");

  const handleRenameClick = () => {
    setIsDialogOpen(true);
  };

  const handleConfirmRename = () => {
    console.log(newRole);
    if (!newRole.trim()) {
      toast.error("Role name cannot be empty.");
      return;
    }
    updateRoleMutation.mutate(newRole);
    setIsDialogOpen(false);
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-1 flex-col gap-4 p-4">
      <h1 className="text-3xl font-bold text-primary">Role details</h1>
      <div className="flex flex-col text-lg">
        <div className="flex items-center gap-2">
          Role: <span className="font-bold text-primary">{role}</span>
          <Edit
            className="ml-2 h-5 w-5 cursor-pointer"
            onClick={handleRenameClick}
          />
        </div>
        <div>
          Allowed permissions:{" "}
          <span className="space-x-2">
            {roleData?.allowed.map((role) => (
              <Badge key={role} variant="secondary" className="pt-1">
                {role}
              </Badge>
            ))}
          </span>
        </div>
        <div>
          Disallowed permissions:{" "}
          <span className="space-x-2">
            {roleData?.disallowed.map((role) => (
              <Badge key={role} variant="secondary" className="pt-1">
                {role}
              </Badge>
            ))}
          </span>
        </div>
      </div>
      <h2 className="text-2xl font-bold text-primary">Edit permissions</h2>
      {isFetchingPermissions ? (
        <LoadingSpinner />
      ) : isErrorPermissions ? (
        <p>An error occurred.</p>
      ) : (
        allPermissions && (
          <div className="flex flex-col gap-2">
            {allPermissions.map(({ permission, description }) => (
              <div
                key={permission}
                className="flex items-center gap-4 border-b pb-2"
              >
                <div className="flex flex-1 flex-col">
                  <p className="text-lg font-bold">{permission}</p>
                  <p className="text-muted-foreground">{description}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      updatePermissionMutation.mutate({
                        permission,
                        action: "disallow",
                      });
                    }}
                    value="disallowed"
                    data-state={
                      roleData?.disallowed.includes(permission) ? "on" : "off"
                    }
                    aria-label="Toggle disallowed"
                    className="rounded-md p-1 hover:bg-muted/50 data-[state=on]:bg-destructive data-[state=on]:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => {
                      updatePermissionMutation.mutate({
                        permission,
                        action: "none",
                      });
                    }}
                    value="none"
                    data-state={
                      !roleData?.disallowed.includes(permission) &&
                      !roleData?.allowed.includes(permission)
                        ? "on"
                        : "off"
                    }
                    aria-label="Toggle None"
                    className="rounded-md p-1 hover:bg-muted/50 data-[state=on]:bg-muted/70 data-[state=on]:text-muted-foreground"
                  >
                    <Minus className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => {
                      updatePermissionMutation.mutate({
                        permission,
                        action: "allow",
                      });
                    }}
                    value="allowed"
                    data-state={
                      roleData?.allowed.includes(permission) ? "on" : "off"
                    }
                    aria-label="Toggle Allowed"
                    className="rounded-md p-1 hover:bg-muted/50 data-[state=on]:bg-success data-[state=on]:text-white"
                  >
                    <Check className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ✅ Confirmation Dialog for Renaming Role */}
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Role Name</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a new name for the role below.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            type="text"
            placeholder="New Role Name"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="mt-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRename}>
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RoleDetailsView;
