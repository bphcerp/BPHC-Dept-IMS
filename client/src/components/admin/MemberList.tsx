import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { AssignRoleComboBox } from "./AssignRoleDialog";
import { Button, buttonVariants } from "../ui/button";
import { Pencil, Plus, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { type adminSchemas } from "lib";
import api from "@/lib/axios-instance";

export interface Member {
  name: string | null;
  email: string;
  roles: string[];
  type: string;
  deactivated: boolean;
}

export default function MemberList({ members }: { members: Member[] }) {
  const queryClient = useQueryClient();

  const editRoleMutation = useMutation({
    mutationFn: async (data: adminSchemas.EditRolesBody) => {
      await api.post("/admin/member/editroles", data);
    },
    onMutate(data) {
      // Optimistic update
      void queryClient.cancelQueries(["members"]);
      const previousData = queryClient.getQueryData<Member[]>(["members"]);
      queryClient.setQueryData<Member[]>(["members"], (oldData) => {
        if (!oldData) return [];
        return oldData.map((member) => {
          if (member.email === data.email) {
            const roles = member.roles.filter(
              (role) => role !== (data.add ?? data.remove)!
            );
            return {
              ...member,
              roles: data.add ? [...roles, data.add] : roles,
            };
          }
          return member;
        });
      });
      return { previousData };
    },
    onError: (_err, _variables, context) => {
      // If mutation fails, use context from onMutate to rollback
      queryClient.setQueryData<Member[]>(["members"], context?.previousData);
      toast.error("An error occurred while editing roles");
    },
    onSettled: () => {
      void queryClient.invalidateQueries(["members"]);
      void queryClient.invalidateQueries(["roles"]);
    },
  });

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {members.map((member) => (
        <Card
          key={member.email}
          className="relative h-full transition-shadow duration-200 hover:shadow-md"
        >
          <Link
            to={`${member.email}`}
            className={buttonVariants({
              size: "icon",
              variant: "outline",
              className: "absolute right-2 top-2",
            })}
          >
            <Pencil />
          </Link>
          <CardContent className="flex flex-col gap-2 p-4">
            <h2 className="text-xl font-semibold">
              {member.name ?? "Invite pending"}
            </h2>
            <p className="text-muted-foreground">{member.email}</p>
            <div className="flex flex-wrap gap-2">
              {member.deactivated ? (
                <Badge
                  variant="destructive"
                  className="absolute bottom-2 right-2"
                >
                  Deactivated
                </Badge>
              ) : (
                member.roles.map((role) => (
                  <Link
                    key={role}
                    className={badgeVariants({
                      variant: "secondary",
                      className: "flex gap-1 pt-1",
                    })}
                    to={`../roles/${role}`}
                  >
                    {role}
                    <button
                      className="p-1 pr-0"
                      onClick={(e) => {
                        e.preventDefault();
                        editRoleMutation.mutate({
                          email: member.email,
                          remove: role,
                        });
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Link>
                ))
              )}
              {!member.deactivated && (
                <AssignRoleComboBox
                  existing={member.roles}
                  callback={(role) => {
                    editRoleMutation.mutate({ email: member.email, add: role });
                  }}
                >
                  <Button variant="outline" size="icon" className="h-7 w-7">
                    <Plus className="h-3 w-3" />
                  </Button>
                </AssignRoleComboBox>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
