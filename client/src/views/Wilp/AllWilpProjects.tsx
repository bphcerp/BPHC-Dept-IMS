import { useEffect, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import api from "@/lib/axios-instance";
import { useAuth } from "@/hooks/Auth";
import WilpTable, { WilpProject } from "@/components/Wilp/WilpTable";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AllWilpProjects() {
  const { authState, checkAccess } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<WilpProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.get("/wilpProject/view/all")
      .then(res => {
        setProjects(res.data as WilpProject[]);
      })
      .catch(() => setError("Failed to load WILP projects"))
      .finally(() => setLoading(false));
  }, []);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const response = await api.patch("/wilpProject/select", { idList: selected });
      toast.success(response.data.message || "Projects selected successfully");
      setSelected([]);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || "Selection failed";
      toast.error(errorMsg);
    } finally {
      setConfirming(false);
    }
  };

  if (!authState) return <Navigate to="/" replace />;
  if (!checkAccess("wilp:project:view-all")) return <Navigate to="/404" replace />;

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center gap-6 bg-background-faded p-8">
      <div className="flex w-full items-center justify-between">
        <h2 className="text-3xl font-normal">All WILP Projects</h2>
        {selected.length > 0 && (
          <Button
            onClick={handleConfirm}
            disabled={confirming}
            className="ml-auto"
          >
            {confirming ? "Confirming..." : "Confirm Selection"}
          </Button>
        )}
      </div>
      <WilpTable
        projects={projects}
        loading={loading}
        error={error}
        selected={selected}
        onSelect={(id, checked) => {
          setSelected(prev => checked ? [...prev, id] : prev.filter(x => x !== id));
        }}
        onRowClick={project => navigate(`/wilp/${project.id}`)}
      />
    </div>
  );
} 