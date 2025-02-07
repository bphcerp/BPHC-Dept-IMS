"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoadingSpinner } from "@/components/ui/spinner"
import { Search } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import InviteDialog from "@/components/admin/InviteDialog"
import MemberList, { type Member } from "@/components/admin/MemberList"
import api from "@/lib/axios-instance"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

const MembersView = () => {
  const [search, setSearch] = useState("")
  const [queryKey, setQueryKey] = useState("")
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])

  const { data: members, isFetching } = useQuery({
    queryKey: queryKey.length ? ["members", queryKey] : ["members"],
    queryFn: async () => {
      const response = await api.get<Member[]>("/admin/member/search", {
        params: {
          q: queryKey,
        },
      })
      return response.data
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  })

  const filteredMembers = members?.filter((member) => selectedTypes.length === 0 || selectedTypes.includes(member.type))

  const types = ["faculty", "staff", "phd"]

  const handleTypeChange = (types: string[]) => {
    setSelectedTypes(types)
  }

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
          <Button onClick={() => setQueryKey(search)}>Search</Button>
          <ToggleGroup
            type="multiple"
            value={selectedTypes}
            onValueChange={handleTypeChange}
            className="bg-transparent"
          >
            {types.map((type) => (
              <ToggleGroupItem
                key={type}
                value={type}
                aria-label={`Filter by ${type}`}
                className="border border-gray-300"
              >
                <span className="capitalize">{type}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <InviteDialog />
      </div>
      {isFetching ? (
        <LoadingSpinner />
      ) : !filteredMembers?.length ? (
        <p>No members found</p>
      ) : (
        <MemberList members={filteredMembers} />
      )}
    </div>
  )
}

export default MembersView

