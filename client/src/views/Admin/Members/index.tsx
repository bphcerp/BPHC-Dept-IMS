import InviteDialog from "@/components/admin/InviteDialog";
import MemberList, { type Member } from "@/components/admin/MemberList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/spinner";
import api from "@/lib/axios-instance";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useState } from "react";

const MembersView = () => {
  const [search, setSearch] = useState("");

  const {
    data: members,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const response = await api.get<Member[]>("/admin/member/search", {
        params: {
          q: search,
        },
      });
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  return (
    <div className="mx-auto flex max-w-5xl flex-1 flex-col gap-4 p-4">
      <h1 className="text-3xl font-bold text-primary">Members</h1>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 transform text-gray-400" />
            <Input
              type="search"
              placeholder="Search members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 pl-9"
            />
          </div>
          <Button onClick={() => void refetch()}>Search</Button>
        </div>
        <InviteDialog />
      </div>
      {isFetching ? (
        <LoadingSpinner />
      ) : !members?.length ? (
        <p>No members found</p>
      ) : (
        <MemberList members={members} />
      )}
    </div>
  );
};

export default MembersView;
