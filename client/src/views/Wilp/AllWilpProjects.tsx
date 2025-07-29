import { useEffect, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import api from "@/lib/axios-instance";
import { useAuth } from "@/hooks/Auth";
import WilpTable, { WilpProject } from "@/components/Wilp/WilpTable";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download } from "lucide-react";

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
    if (selected.length === 0) {
      toast.warning("No projects selected.");
      return;
    }
    setConfirming(true);
    try {
      const response = await api.patch("/wilpProject/select", { idList: selected });
      const data = response.data as { message?: string };
      toast.success(data.message || "Projects selected successfully");
      setSelected([]);
    } catch (err) {
      const errorMsg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Selection failed";
      toast.error(errorMsg);
    } finally {
      setConfirming(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await api.get("/wilpProject/download", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "wilp-projects.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download WILP projects");
    }
  };

  const handleClear = async () => {
    if (!window.confirm("Are you sure you want to clear all WILP projects? This action cannot be undone.")) return;
    try {
      const response = await api.delete("/wilpProject/clear");
      const data = response.data as { message?: string };
      toast.success(data.message || "All WILP projects cleared.");
      // Refresh the project list
      setLoading(true);
      setError(null);
      api.get("/wilpProject/view/all")
        .then(res => {
          setProjects(res.data as WilpProject[]);
        })
        .catch(() => setError("Failed to load WILP projects"))
        .finally(() => setLoading(false));
    } catch {
      toast.error("Failed to clear WILP projects");
    }
  };

  if (!authState) return <Navigate to="/" replace />;
  if (!checkAccess("wilp:project:view-all")) return <Navigate to="/404" replace />;

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center gap-6 bg-background-faded p-8">
      <div className="flex w-full items-center justify-between">
        <h2 className="text-3xl font-normal">All WILP Projects</h2>
        <div className="flex items-center gap-2 ml-auto">
          {checkAccess("wilp:project:download") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleDownload()}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          )}
          {checkAccess("wilp:project:clear") && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => void handleClear()}
              className="flex items-center gap-2"
            >
              Clear
            </Button>
          )}
          {selected.length > 0 && (
            <Button
              onClick={() => void handleConfirm()}
              disabled={confirming}
              className="ml-2"
            >
              {confirming ? "Confirming..." : "Confirm Selection"}
            </Button>
          )}
        </div>
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