import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "@/lib/axios-instance";
import { useAuth } from "@/hooks/Auth";
import ProjectTable, { Project } from "../../components/project/ProjectTable";
import ProjectFilter from "../../components/project/ProjectFilter";
import { useProjectFilter } from "../../components/project/useProjectFilter";

export default function EditProjects() {
  const { authState, checkAccess } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { filterState, setFilterState, filterProjects } = useProjectFilter();

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.get("/project/list-all")
      .then(res => {
        setProjects(res.data as Project[]);
      })
      .catch(() => setError("Failed to load projects"))
      .finally(() => setLoading(false));
  }, []);

  const filteredProjects = filterProjects(projects);

  const handleEditSave = async (id: string, changes: Partial<Project>) => {
    await api.patch(`/project/${id}`, changes);
    setProjects(prev => prev.map(p => (p.id === id ? { ...p, ...changes } : p)));
  };

  if (!authState) return <Navigate to="/" replace />;
  if (!checkAccess("project:edit-all")) return <Navigate to="/404" replace />;

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center gap-6 bg-background-faded p-8">
      <div className="flex w-full items-center justify-between">
        <h2 className="text-3xl font-normal">Edit Projects</h2>
        <ProjectFilter 
          filterState={filterState}
          onFilterChange={setFilterState}
        />
      </div>
      <ProjectTable
        projects={filteredProjects}
        loading={loading}
        error={error}
        editable
        onEditSave={handleEditSave}
      />
    </div>
  );
} 