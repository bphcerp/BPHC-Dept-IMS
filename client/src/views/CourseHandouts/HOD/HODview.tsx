import React, { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import HandoutList from "@/components/coursehandouts/HandoutList";

/** Example data to demonstrate the statuses. */
const handoutData = [
  {
    handoutName: "Handout Name",
    professorName: "Professor Name",
    status: "Verified",
  },
  {
    handoutName: "Handout Name",
    professorName: "Professor Name",
    status: "Not Verified",
  },
  {
    handoutName: "Handout Name",
    professorName: "Professor Name",
    status: "Resubmission",
  },
  {
    handoutName: "Handout Name",
    professorName: "Professor Another",
    status: "Verified",
  },
  {
    handoutName: "Handout Name",
    professorName: "Professor Another",
    status: "Not Verified",
  },
];

const statuses = ["Verified", "Not Verified", "Resubmission"];

export const HodView = () => {
  const [search, setSearch] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(statuses);

  const handleStatusChange = (values: string[]) => {
    if (values.length === 0) {
      setSelectedStatuses(["Verified"]);
    } else {
      setSelectedStatuses(values);
    }
  };

  const handleSearch = () => {
    console.log("Searching for:", search);
  };

  return (
    <div className="flex w-full flex-col gap-4 px-10 pt-4">
      <h1 className="text-3xl font-bold text-primary">Handout Approvals</h1>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 transform text-gray-400" />
          <Input
            type="search"
            placeholder="Search handouts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 pl-9"
          />
        </div>

        <Button onClick={handleSearch}>Search</Button>

        <ToggleGroup
          type="multiple"
          value={selectedStatuses}
          onValueChange={handleStatusChange}
          className="bg-transparent"
        >
          {statuses.map((status) => (
            <ToggleGroupItem
              key={status}
              value={status}
              aria-label={`Filter by ${status}`}
              className="border border-gray-300 capitalize"
            >
              {status}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <HandoutList
        handouts={handoutData}
        search={search}
        selectedStatuses={selectedStatuses}
      />
    </div>
  );
};
