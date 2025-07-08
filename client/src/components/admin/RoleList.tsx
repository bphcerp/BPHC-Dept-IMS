import { Link } from "react-router-dom";
import { Edit, Trash, Users } from "lucide-react";
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
} from "@/components/ui/alert-dialog.tsx";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {roles.map(({ roleName: role, memberCount }) => (
        <Card
          key={role}
          className="transition-all duration-200 hover:shadow-md hover:shadow-primary/10"
        >
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Role Header */}
              <div className="flex items-center gap-2">
                <h3 className="truncate text-lg font-semibold" title={role}>
                  {role}
                </h3>
              </div>

              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-sm">
                  {memberCount} {memberCount !== 1 ? "members" : "member"}
                </Badge>

                {memberCount > 0 && (
                  <Link
                    to={`../members?role=${encodeURIComponent(role)}`}
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                    })}
                    title={`View all members with ${role} role`}
                  >
                    <Users className="mr-1 h-4 w-4" />
                    View Members
                  </Link>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link to={`${role}`}>
                    <Edit className="mr-1 h-4 w-4" />
                    Edit Role
                  </Link>
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Trash className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Role</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete the role &ldquo;{role}
                        &rdquo;? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteMutation.mutate(role)}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Delete Role
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
