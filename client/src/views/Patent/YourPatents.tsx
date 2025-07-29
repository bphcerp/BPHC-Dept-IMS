import { useEffect, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import api from "@/lib/axios-instance";
import { useAuth } from "@/hooks/Auth";
import PatentTable, { Patent } from "../../components/patent/PatentTable";

export default function YourPatents() {
  const { authState, checkAccess } = useAuth();
  const navigate = useNavigate();
  const [patents, setPatents] = useState<Patent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.get("/patent/list")
      .then(res => {
        setPatents(res.data as Patent[]);
      })
      .catch(() => setError("Failed to load patents"))
      .finally(() => setLoading(false));
  }, []);

  if (!authState) return <Navigate to="/" replace />;
  if (!checkAccess("patent:view")) return <Navigate to="/404" replace />;

  return (
    <div className="w-full h-screen overflow-y-auto bg-background-faded">
      <div className="flex flex-col items-center gap-6 p-8">
        <div className="flex w-full items-center justify-between">
          <h2 className="text-3xl font-normal">Your Patents</h2>
        </div>
        <PatentTable
          patents={patents}
          loading={loading}
          error={error}
          onRowClick={patent => navigate(`/patent/details/${patent.id}`)}
        />
      </div>
    </div>
  );
} 