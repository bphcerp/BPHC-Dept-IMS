import { useEffect, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import api from "@/lib/axios-instance";
import { useAuth } from "@/hooks/Auth";
import WilpTable, { WilpProject } from "@/components/Wilp/WilpTable";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function YourWilpProjects() {
  const { authState, checkAccess } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<WilpProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deselecting, setDeselecting] = useState<number | null>(null);

  const fetchProjects = () => {
    setLoading(true);
    setError(null);
    api.get("/wilpProject/view/selected")
      .then(res => {
        setProjects(res.data as WilpProject[]);
      })
      .catch(() => setError("Failed to load your WILP projects"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDeselect = async (id: number) => {
    setDeselecting(id);
    try {
      await api.patch("/wilpProject/deselect", { idList: [id] });
      toast.success("Project deselected successfully");
      fetchProjects();
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || "Deselect failed";
      toast.error(errorMsg);
    } finally {
      setDeselecting(null);
    }
  };

  if (!authState) return <Navigate to="/" replace />;
  if (!checkAccess("wilp:project:view-selected")) return <Navigate to="/404" replace />;

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center gap-6 bg-background-faded p-8">
      <div className="flex w-full items-center justify-between">
        <h2 className="text-3xl font-normal">Your WILP Projects</h2>
      </div>
      <table className="w-full border-collapse bg-white rounded shadow">
        <thead>
          <tr>
            <th className="px-4 py-2">S. No.</th>
            <th className="px-4 py-2">Student ID</th>
            <th className="px-4 py-2">Student Name</th>
            <th className="px-4 py-2">Organization</th>
            <th className="px-4 py-2">Dissertation Title</th>
            <th className="px-4 py-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {projects.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-4">No projects found.</td>
            </tr>
          ) : (
            projects.map((project, idx) => (
              <tr key={project.id} className="border-t">
                <td className="px-4 py-2 cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/wilp/${project.id}`)}>{idx + 1}</td>
                <td className="px-4 py-2 cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/wilp/${project.id}`)}>{project.studentId}</td>
                <td className="px-4 py-2 cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/wilp/${project.id}`)}>{project.studentName}</td>
                <td className="px-4 py-2 cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/wilp/${project.id}`)}>{project.organization}</td>
                <td className="px-4 py-2 cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/wilp/${project.id}`)}>{project.dissertationTitle}</td>
                <td className="px-4 py-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={deselecting === project.id}
                    onClick={e => { e.stopPropagation(); handleDeselect(project.id); }}
                  >
                    {deselecting === project.id ? "Deselecting..." : "Deselect"}
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
} 