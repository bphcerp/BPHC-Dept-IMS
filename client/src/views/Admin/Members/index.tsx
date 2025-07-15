import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/spinner";
import { Search, SortAsc, SortDesc } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import InviteDialog from "@/components/admin/InviteDialog";
import MemberList, { type Member } from "@/components/admin/MemberList";
import api from "@/lib/axios-instance";
import { useSearchParams } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useDebounce from "@/hooks/useDebounce";

const MembersView = () => {
  const [search, setSearch] = useState("");
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();

  const typeFilter = searchParams.get("type") || "all";
  const roleFilter = searchParams.get("role") || "all";
  const sortBy = searchParams.get("sort") || "name";
  const sortOrder = searchParams.get("order") || "asc";

  const debouncedSearch = useDebounce(search, 300);

  const { data: members, isFetching } = useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const response = await api.get<Member[]>("/admin/member/search");
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });

  const uniqueRoles = useMemo(() => {
    if (!members) return [];
    const roleSet = new Set<string>();
    members.forEach((member) => {
      member.roles.forEach((role) => roleSet.add(role));
    });
    return Array.from(roleSet).sort();
  }, [members]);

  useEffect(() => {
    if (members) {
      let filtered = [...members];

      if (debouncedSearch) {
        const searchLower = debouncedSearch.toLowerCase();
        filtered = filtered.filter(
          (member) =>
            member.name?.toLowerCase().includes(searchLower) ||
            member.email.toLowerCase().includes(searchLower) ||
            member.type.toLowerCase().includes(searchLower) ||
            member.roles.some((role) =>
              role.toLowerCase().includes(searchLower)
            )
        );
      }

      if (typeFilter !== "all") {
        filtered = filtered.filter((member) => member.type === typeFilter);
      }

      if (roleFilter !== "all") {
        filtered = filtered.filter((member) =>
          member.roles.includes(roleFilter)
        );
      }

      filtered.sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        switch (sortBy) {
          case "name":
            aValue = a.name || "";
            bValue = b.name || "";
            break;
          case "email":
            aValue = a.email;
            bValue = b.email;
            break;
          case "type":
            aValue = a.type;
            bValue = b.type;
            break;
          case "roles":
            aValue = a.roles.length;
            bValue = b.roles.length;
            break;
          default:
            aValue = a.name || "";
            bValue = b.name || "";
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

      setFilteredMembers(filtered);
    }
  }, [members, debouncedSearch, typeFilter, roleFilter, sortBy, sortOrder]);

  const types = ["faculty", "staff", "phd"];

  const handleFilterChange = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === "all") {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    setSearchParams(newParams);
  };

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

  const clearFilters = () => {
    setSearchParams({});
    setSearch("");
  };

  const hasActiveFilters =
    typeFilter !== "all" || roleFilter !== "all" || search.length > 0;

  return (
    <div className="mx-auto flex max-w-7xl flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">Members</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          Showing {filteredMembers.length} of {members?.length || 0} members
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 transform text-gray-400" />
              <Input
                type="search"
                placeholder="Search members by name, email, type, or role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-96 pl-9"
              />
            </div>

            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
          <InviteDialog />
        </div>

        <div className="flex items-center gap-4 rounded-lg border p-4">
          <span className="text-sm font-medium text-muted-foreground">
            Filters:
          </span>

          <Select
            value={typeFilter}
            onValueChange={(value) => handleFilterChange("type", value)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {types.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={roleFilter}
            onValueChange={(value) => handleFilterChange("role", value)}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {uniqueRoles.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="ml-auto flex items-center gap-2">
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
              variant={sortBy === "email" ? "default" : "outline"}
              size="sm"
              onClick={() => handleSortChange("email")}
              className="flex items-center gap-1"
            >
              Email {getSortIcon("email")}
            </Button>

            <Button
              variant={sortBy === "type" ? "default" : "outline"}
              size="sm"
              onClick={() => handleSortChange("type")}
              className="flex items-center gap-1"
            >
              Type {getSortIcon("type")}
            </Button>

            <Button
              variant={sortBy === "roles" ? "default" : "outline"}
              size="sm"
              onClick={() => handleSortChange("roles")}
              className="flex items-center gap-1"
            >
              Role Count {getSortIcon("roles")}
            </Button>
          </div>
        </div>
      </div>

      {isFetching ? (
        <LoadingSpinner />
      ) : !filteredMembers.length ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg text-muted-foreground">No members found</p>
          {hasActiveFilters && (
            <p className="mt-2 text-sm text-muted-foreground">
              Try adjusting your filters or search query
            </p>
          )}
        </div>
      ) : (
        <MemberList members={filteredMembers} />
      )}
    </div>
  );
};

export default MembersView;
