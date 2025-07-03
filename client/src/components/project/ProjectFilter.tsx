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
export type AmountFilter = "all" | "high" | "medium" | "low";
export type StatusFilter = "all" | "ongoing" | "completed";

export interface ProjectFilterState {
  sortOrder: SortOrder;
  amountFilter: AmountFilter;
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
  const { sortOrder, amountFilter, statusFilter, yearRangeFilter } = filterState;

  const getActiveFilterCount = () => {
    let count = 0;
    if (sortOrder !== "desc") count++;
    if (amountFilter !== "all") count++;
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

  const handleAmountFilterChange = (value: AmountFilter) => {
    onFilterChange({
      ...filterState,
      amountFilter: value,
    });
  };

  const handleStatusFilterChange = (value: StatusFilter) => {
    onFilterChange({
      ...filterState,
      statusFilter: value,
    });
  };

  const handleYearRangeChange = (field: "min" | "max", value: number | null) => {
    onFilterChange({
      ...filterState,
      yearRangeFilter: {
        ...yearRangeFilter,
        [field]: value,
      },
    });
  };

  const resetFilters = () => {
    onFilterChange({
      sortOrder: "desc",
      amountFilter: "all",
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
            Filter by Amount
          </DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={amountFilter}
            onValueChange={(value) => handleAmountFilterChange(value as AmountFilter)}
          >
            <DropdownMenuRadioItem value="all">
              All amounts
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="high">
              ₹10L+ (High)
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="medium">
              ₹5L - ₹10L (Medium)
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="low">
              &lt; ₹5L (Low)
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

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Filter by Start Year Range
          </DropdownMenuLabel>
          <div className="px-2 py-1.5">
            <div className="mb-2 flex items-center gap-2">
              <label htmlFor="min-year" className="text-xs">
                From:
              </label>
              <input
                id="min-year"
                type="number"
                placeholder="Min year"
                className="w-full rounded-md border px-2 py-1 text-sm"
                value={yearRangeFilter.min || ""}
                onChange={(e) => {
                  const value = e.target.value ? Number(e.target.value) : null;
                  handleYearRangeChange("min", value);
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="max-year" className="text-xs">
                To:
              </label>
              <input
                id="max-year"
                type="number"
                placeholder="Max year"
                className="w-full rounded-md border px-2 py-1 text-sm"
                value={yearRangeFilter.max || ""}
                onChange={(e) => {
                  const value = e.target.value ? Number(e.target.value) : null;
                  handleYearRangeChange("max", value);
                }}
              />
            </div>
          </div>
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