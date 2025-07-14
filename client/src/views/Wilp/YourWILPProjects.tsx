import { useEffect, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import api from "@/lib/axios-instance";
import { useAuth } from "@/hooks/Auth";
import ProjectTable, { Project } from "@/components/project/ProjectTable";

export default function YourWilpProjects() {
  const { authState, checkAccess } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.get("/wilp/project/view-your")
      .then(res => {
        setProjects(res.data as Project[]);
      })
      .catch(() => setError("Failed to load your WILP projects"))
      .finally(() => setLoading(false));
  }, []);

  if (!authState) return <Navigate to="/" replace />;
  if (!checkAccess("wilp:project:view-selected")) return <Navigate to="/404" replace />;

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center gap-6 bg-background-faded p-8">
      <div className="flex w-full items-center justify-between">
        <h2 className="text-3xl font-normal">Your WILP Projects</h2>
      </div>
      <ProjectTable
        projects={projects}
        loading={loading}
        error={error}
        onRowClick={project => navigate(`/wilp/details/${project.id}`)}
      />
    </div>
  );
} 