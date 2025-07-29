import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

export interface PatentFilterState {
  searchTerm: string;
  statusFilter: string;
  departmentFilter: string;
  campusFilter: string;
}

interface PatentFilterProps {
  filterState: PatentFilterState;
  onFilterChange: (filters: PatentFilterState) => void;
}

const PatentFilter = ({ filterState, onFilterChange }: PatentFilterProps) => {
  const handleFilterChange = (key: keyof PatentFilterState, value: string) => {
    onFilterChange({
      ...filterState,
      [key]: value,
    });
  };

  const clearFilters = () => {
    onFilterChange({
      searchTerm: "",
      statusFilter: "all",
      departmentFilter: "all",
      campusFilter: "all",
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filterState.searchTerm) count++;
    if (filterState.statusFilter !== "all") count++;
    if (filterState.departmentFilter !== "all") count++;
    if (filterState.campusFilter !== "all") count++;
    return count;
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search patents..."
          value={filterState.searchTerm}
          onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
          className="w-64"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Label htmlFor="status-filter" className="text-sm font-medium">
          Status:
        </Label>
        <Select
          value={filterState.statusFilter}
          onValueChange={(value) => handleFilterChange("statusFilter", value)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Filed">Filed</SelectItem>
            <SelectItem value="Granted">Granted</SelectItem>
            <SelectItem value="Abandoned">Abandoned</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Label htmlFor="department-filter" className="text-sm font-medium">
          Department:
        </Label>
        <Select
          value={filterState.departmentFilter}
          onValueChange={(value) => handleFilterChange("departmentFilter", value)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            <SelectItem value="EEE">EEE</SelectItem>
            <SelectItem value="CSE">CSE</SelectItem>
            <SelectItem value="ME">ME</SelectItem>
            <SelectItem value="CE">CE</SelectItem>
            <SelectItem value="CHE">CHE</SelectItem>
            <SelectItem value="BT">BT</SelectItem>
            <SelectItem value="PHY">PHY</SelectItem>
            <SelectItem value="CHEM">CHEM</SelectItem>
            <SelectItem value="MATH">MATH</SelectItem>
            <SelectItem value="HUM">HUM</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Label htmlFor="campus-filter" className="text-sm font-medium">
          Campus:
        </Label>
        <Select
          value={filterState.campusFilter}
          onValueChange={(value) => handleFilterChange("campusFilter", value)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All campuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All campuses</SelectItem>
            <SelectItem value="Hyderabad">Hyderabad</SelectItem>
            <SelectItem value="Pilani">Pilani</SelectItem>
            <SelectItem value="Goa">Goa</SelectItem>
            <SelectItem value="Dubai">Dubai</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {getActiveFilterCount() > 0 && (
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            {getActiveFilterCount()} active filter(s)
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-auto p-0 ml-1"
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        </div>
      )}
    </div>
  );
};

export default PatentFilter; 