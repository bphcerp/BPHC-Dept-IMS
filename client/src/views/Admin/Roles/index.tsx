import { CreateRoleDialog } from "@/components/admin/CreateRoleDialog";
import RoleList, { type Role } from "@/components/admin/RoleList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/spinner";
import api from "@/lib/axios-instance";
import { useQuery } from "@tanstack/react-query";
import { Search, SortAsc, SortDesc } from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const RolesView = () => {
  const [search, setSearch] = useState("");
  const [filteredRoles, setFilteredRoles] = useState<Role[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();

  const sortBy = searchParams.get("sort") || "name";
  const sortOrder = searchParams.get("order") || "asc";

  const debouncedSearch = useDebounce(search, 300);

  const { data: roles, isFetching } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const response = await api.get<Role[]>("/admin/role");
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (roles) {
      let filtered = [...roles];

      if (debouncedSearch) {
        const searchLower = debouncedSearch.toLowerCase();
        filtered = filtered.filter((role) =>
          role.roleName.toLowerCase().includes(searchLower)
        );
      }

      filtered.sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        switch (sortBy) {
          case "name":
            aValue = a.roleName;
            bValue = b.roleName;
            break;
          case "members":
            aValue = a.memberCount;
            bValue = b.memberCount;
            break;
          default:
            aValue = a.roleName;
            bValue = b.roleName;
        }

        if (typeof aValue === "string" && typeof bValue === "string") {
          const comparison = aValue.localeCompare(bValue);
          return sortOrder === "asc" ? comparison : -comparison;
        }

        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
        }

        return 0;
      });

      setFilteredRoles(filtered);
    }
  }, [roles, debouncedSearch, sortBy, sortOrder]);

  const handleSortChange = (newSortBy: string) => {
    const newParams = new URLSearchParams(searchParams);

    if (sortBy === newSortBy) {
      const newOrder = sortOrder === "asc" ? "desc" : "asc";
      newParams.set("order", newOrder);
    } else {
      newParams.set("sort", newSortBy);
      newParams.set("order", "asc");
    }

    setSearchParams(newParams);
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return null;
    return sortOrder === "asc" ? (
      <SortAsc className="h-4 w-4" />
    ) : (
      <SortDesc className="h-4 w-4" />
    );
  };

  const clearSearch = () => {
    setSearch("");
  };

  const hasActiveSearch = search.length > 0;

  return (
    <div className="mx-auto flex max-w-6xl flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">Roles</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          Showing {filteredRoles.length} of {roles?.length || 0} roles
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 transform text-gray-400" />
              <Input
                type="search"
                placeholder="Search roles by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-80 pl-9"
              />
            </div>

            {hasActiveSearch && (
              <Button variant="outline" onClick={clearSearch}>
                Clear Search
              </Button>
            )}
          </div>
          <CreateRoleDialog />
        </div>

        <div className="flex items-center gap-4 rounded-lg border p-4">
          <span className="text-sm font-medium text-muted-foreground">
            Sort by:
          </span>

          <Button
            variant={sortBy === "name" ? "default" : "outline"}
            size="sm"
            onClick={() => handleSortChange("name")}
            className="flex items-center gap-1"
          >
            Name {getSortIcon("name")}
          </Button>

          <Button
            variant={sortBy === "members" ? "default" : "outline"}
            size="sm"
            onClick={() => handleSortChange("members")}
            className="flex items-center gap-1"
          >
            Member Count {getSortIcon("members")}
          </Button>
        </div>
      </div>

      {isFetching ? (
        <LoadingSpinner />
      ) : !filteredRoles.length ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg text-muted-foreground">No roles found</p>
          {hasActiveSearch && (
            <p className="mt-2 text-sm text-muted-foreground">
              Try adjusting your search query
            </p>
          )}
        </div>
      ) : (
        <RoleList roles={filteredRoles} />
      )}
    </div>
  );
};

export default RolesView;
