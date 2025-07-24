import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter, ArrowUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type SortOrder = "desc" | "asc";
export type StatusFilter = "all" | "ongoing" | "completed";

export interface ProjectFilterState {
  sortOrder: SortOrder;
  statusFilter: StatusFilter;
  yearRangeFilter: {
    min: number | null;
    max: number | null;
  };
}

interface ProjectFilterProps {
  filterState: ProjectFilterState;
  onFilterChange: (newState: ProjectFilterState) => void;
}

export default function ProjectFilter({ filterState, onFilterChange }: ProjectFilterProps) {
  const { sortOrder, statusFilter, yearRangeFilter } = filterState;

  const getActiveFilterCount = () => {
    let count = 0;
    if (sortOrder !== "desc") count++;
    if (statusFilter !== "all") count++;
    if (yearRangeFilter.min !== null) count++;
    if (yearRangeFilter.max !== null) count++;
    return count;
  };

  const handleSortOrderChange = (value: SortOrder) => {
    onFilterChange({
      ...filterState,
      sortOrder: value,
    });
  };

  const handleStatusFilterChange = (value: StatusFilter) => {
    onFilterChange({
      ...filterState,
      statusFilter: value,
    });
  };

  const resetFilters = () => {
    onFilterChange({
      sortOrder: "desc",
      statusFilter: "all",
      yearRangeFilter: { min: null, max: null },
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          Filter
          {getActiveFilterCount() > 0 && (
            <Badge className="ml-1 flex h-5 w-5 items-center justify-center p-0">
              {getActiveFilterCount()}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Filter Projects</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Sort by Start Date
          </DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={sortOrder}
            onValueChange={(value) => handleSortOrderChange(value as SortOrder)}
          >
            <DropdownMenuRadioItem value="desc">
              <ArrowUpDown className="mr-2 h-4 w-4 rotate-180" />
              Newest first
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="asc">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              Oldest first
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Filter by Status
          </DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={statusFilter}
            onValueChange={(value) => handleStatusFilterChange(value as StatusFilter)}
          >
            <DropdownMenuRadioItem value="all">
              All statuses
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="ongoing">
              Ongoing
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="completed">
              Completed
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>

        {getActiveFilterCount() > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={resetFilters}>
              Reset filters
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 