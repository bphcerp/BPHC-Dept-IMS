import { useState } from "react";
import { Patent } from "./PatentTable";
import { PatentFilterState } from "./PatentFilter";

export const usePatentFilter = () => {
  const [filterState, setFilterState] = useState<PatentFilterState>({
    searchTerm: "",
    statusFilter: "all",
    departmentFilter: "all",
    campusFilter: "all",
  });

  const filterPatents = (patents: Patent[]) => {
    return patents.filter((patent) => {
      // Search term filter
      if (filterState.searchTerm) {
        const searchLower = filterState.searchTerm.toLowerCase();
        const matchesSearch =
          patent.applicationNumber.toLowerCase().includes(searchLower) ||
          patent.inventorsName.toLowerCase().includes(searchLower) ||
          patent.title.toLowerCase().includes(searchLower) ||
          patent.department.toLowerCase().includes(searchLower) ||
          patent.campus.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filterState.statusFilter !== "all") {
        if (patent.status !== filterState.statusFilter) return false;
      }

      // Department filter
      if (filterState.departmentFilter !== "all") {
        if (patent.department !== filterState.departmentFilter) return false;
      }

      // Campus filter
      if (filterState.campusFilter !== "all") {
        if (patent.campus !== filterState.campusFilter) return false;
      }

      return true;
    });
  };

  return {
    filterState,
    setFilterState,
    filterPatents,
  };
}; 