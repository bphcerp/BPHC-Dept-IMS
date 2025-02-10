import { Link } from "react-router-dom";
import { Edit, Trash } from "lucide-react";
import api from "@/lib/axios-instance.ts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { isAxiosError } from "axios";
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
} from "../ui/alert-dialog.tsx";

export interface Role {
  roleName: string;
  memberCount: number;
}

export default function RoleList({ roles }: { roles: Role[] }) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (role: string) => api.post("/admin/role/delete", { role }),
    onSuccess: (_, role) => {
      toast.success(`Role "${role}" deleted successfully`);
      void queryClient.invalidateQueries(["roles"]);
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        const { response } = error;
        if (response?.status === 404) {
          toast.error("Role does not exist");
        } else {
          toast.error("Failed to delete role");
        }
      }
    },
  });

  return (
    <div className="flex flex-col gap-2">
      {roles.map(({ roleName: role, memberCount }) => (
        <div key={role} className="grid grid-cols-3 gap-4 border-b pb-2">
          <p className="text-lg font-bold">{role}</p>
          <p className="mx-auto text-lg text-muted-foreground">
            {memberCount} {memberCount !== 1 ? "members" : "member"}
          </p>
          <div className="ml-auto flex gap-1">
            <Link to={`${role}`} className="rounded-md p-1 hover:bg-muted/50">
              <Edit className="h-5 w-5" />
            </Link>
            <AlertDialog>
              <AlertDialogTrigger className="rounded-md p-1 hover:bg-muted/50">
                <Trash className="h-5 w-5" />
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this role?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMutation.mutate(role)}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      ))}
    </div>
  );
}
