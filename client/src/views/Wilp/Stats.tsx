import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/axios-instance";
import StatsTable from "@/components/Wilp/StatsTable";

interface FacultyStat {
  faculty: { name: string; email: string };
  selected: number;
  required: number;
}

interface StatsResponse {
  range: { min: number | null; max: number | null };
  projects: { total: number; selected: number; unselected: number };
  facultyList: FacultyStat[];
}

export default function Stats() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void api
      .get<StatsResponse>("/wilpProject/stats")
      .then((res) => setStats(res.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto p-8">
      <h2 className="text-3xl font-bold mb-6">WILP Project Stats</h2>
      <Card className="mb-8 p-6">
        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <div className="flex gap-8 mb-4">
            <div>
              <div className="text-lg font-semibold">Selection Range</div>
              <div>
                Min: <span className="font-mono">{stats?.range.min ?? "-"}</span>
                {" | "}
                Max: <span className="font-mono">{stats?.range.max ?? "-"}</span>
              </div>
            </div>
            <div>
              <div className="text-lg font-semibold">Projects</div>
              <div>
                Total: <span className="font-mono">{stats?.projects.total ?? "-"}</span>
                {" | "}
                Selected: <span className="font-mono">{stats?.projects.selected ?? "-"}</span>
                {" | "}
                Left: <span className="font-mono">{stats?.projects.unselected ?? "-"}</span>
              </div>
            </div>
          </div>
        )}
      </Card>
      <Card className="p-6">
        <div className="text-xl font-semibold mb-4">Faculty-wise Selection</div>
        {loading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <StatsTable facultyList={stats?.facultyList ?? []} />
        )}
      </Card>
    </div>
  );
}
