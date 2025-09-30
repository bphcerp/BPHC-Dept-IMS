import React from "react";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Search } from "lucide-react";

// Define the specific statuses for qpReview module
export const qpReviewStatuses = ["review pending", "reviewed", "notsubmitted"];

// Define the request types
export const requestTypes = ["Mid Sem", "Comprehensive", "Both"];

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  activeCategoryFilters: string[];
  onCategoryFilterChange: (values: string[]) => void;
  activeStatusFilters: string[];
  onStatusFilterChange: (values: string[]) => void;
  activeRequestTypeFilters: string[];
  onRequestTypeFilterChange: (values: string[]) => void;
}

export const QpFilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  activeCategoryFilters,
  onCategoryFilterChange,
  activeStatusFilters,
  onStatusFilterChange,
  activeRequestTypeFilters,
  onRequestTypeFilterChange,
}) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="relative w-full">
        <Input
          type="search"
          placeholder="SEARCH"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full border-gray-300 pl-9 sm:w-96"
        />
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Category Filters */}
        <ToggleGroup
          type="multiple"
          value={activeCategoryFilters}
          onValueChange={onCategoryFilterChange}
          className="flex flex-wrap gap-2 bg-transparent"
        >
          <ToggleGroupItem
            value="FD"
            className="border border-gray-300 bg-white text-sm data-[state=on]:bg-gray-100"
          >
            FD
          </ToggleGroupItem>
          <ToggleGroupItem
            value="HD"
            className="border border-gray-300 bg-white text-sm data-[state=on]:bg-gray-100"
          >
            HD
          </ToggleGroupItem>
        </ToggleGroup>

        {/* Request Type Filters */}
        <ToggleGroup
          type="multiple"
          value={activeRequestTypeFilters}
          onValueChange={onRequestTypeFilterChange}
          className="flex flex-wrap gap-2 bg-transparent"
        >
          {requestTypes.map((requestType) => (
            <ToggleGroupItem
              key={requestType}
              value={requestType}
              className="border border-gray-300 bg-white text-xs data-[state=on]:bg-gray-100 md:text-sm"
            >
              {requestType}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        {/* Status Filters */}
        <ToggleGroup
          type="multiple"
          value={activeStatusFilters}
          onValueChange={onStatusFilterChange}
          className="flex flex-wrap gap-2 bg-transparent"
        >
          {qpReviewStatuses.map((status) => (
            <ToggleGroupItem
              key={status}
              value={status}
              className="border border-gray-300 bg-white text-xs capitalize data-[state=on]:bg-gray-100 md:text-sm"
            >
              {status}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </div>
  );
};
