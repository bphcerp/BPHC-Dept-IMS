import { CreateRoleDialog } from "@/components/admin/CreateRoleDialog";
import RoleList, { type Role } from "@/components/admin/RoleList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/spinner";
import api from "@/lib/axios-instance";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useState } from "react";

const RolesView = () => {
  const [search, setSearch] = useState("");
  const [queryKey, setQueryKey] = useState("");

  const { data: roles, isFetching } = useQuery({
    queryKey: queryKey.length ? ["roles", queryKey] : ["roles"],
    queryFn: async () => {
      const response = await api.get<Role[]>("/admin/role/all", {
        params: {
          q: queryKey,
        },
      });
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });

  return (
    <div className="mx-auto flex max-w-5xl flex-1 flex-col gap-4 p-4">
      <h1 className="text-3xl font-bold text-primary">Roles</h1>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 transform text-gray-400" />
            <Input
              type="search"
              placeholder="Search roles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 pl-9"
            />
          </div>
          <Button onClick={() => setQueryKey(search)}>Search</Button>
        </div>
        <CreateRoleDialog />
      </div>
      {isFetching ? (
        <LoadingSpinner />
      ) : !roles?.length ? (
        <p>No roles found</p>
      ) : (
        <RoleList roles={roles} />
      )}
    </div>
  );
};

export default RolesView;
