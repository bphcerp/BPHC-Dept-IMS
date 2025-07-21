import { useState } from "react";
import { Project } from "./ProjectTable.tsx";
import { ProjectFilterState } from "./ProjectFilter";

function isValidProject(project: unknown): project is Project {
  return (
    typeof project === "object" &&
    project !== null &&
    "startDate" in project &&
    typeof (project as { startDate?: unknown }).startDate === "string"
  );
}

export function useProjectFilter() {
  const [filterState, setFilterState] = useState<ProjectFilterState>({
    sortOrder: "desc",
    statusFilter: "all",
    yearRangeFilter: {
      min: null,
      max: null,
    },
  });

  const filterProjects = (projects: Project[]): Project[] => {
    return projects
      .filter(isValidProject)
      .filter((project) => {
        if (filterState.statusFilter === "all") return true;
        const today = new Date();
        const startDate = project.startDate ? new Date(project.startDate) : null;
        const endDate = project.endDate ? new Date(project.endDate) : null;
        if (filterState.statusFilter === "ongoing") {
          if (!startDate) return false;
          if (startDate > today) return false;
          if (endDate && endDate < today) return false;
          return true;
        }
        if (filterState.statusFilter === "completed") {
          if (!endDate) return false;
          return endDate < today;
        }
        return true;
      })
      .sort((a, b) => {
        const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
        const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
        return filterState.sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      });
  };

  return {
    filterState,
    setFilterState,
    filterProjects,
  };
} 