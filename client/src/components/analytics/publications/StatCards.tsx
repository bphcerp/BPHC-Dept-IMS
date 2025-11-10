import { Card, CardContent } from "@/components/ui/card";
import { analyticsSchemas } from "lib";
import { Award, BookOpen, TrendingUp, Users } from "lucide-react";

export function StatCard({
  value,
  label,
  icon: Icon,
}: {
  value: number | string;
  label: string;
  icon: React.ElementType;
  color?: string;
}) {
  return (
    <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-gray-50/50 shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-xl dark:from-gray-900 dark:to-gray-800/50">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground/80">
              {label}
            </p>
            <p className="text-3xl font-bold tracking-tight text-foreground">
              {value}
            </p>
          </div>
          <div
            className={`rounded-2xl bg-primary/10 p-4 ring-1 ring-primary/20 transition-all duration-300 group-hover:scale-110`}
          >
            <Icon className={`h-7 w-7 text-primary`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function StatCardRow({
  singleMetrics,
}: {
  singleMetrics: analyticsSchemas.SingleMetrics;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Total Publications"
        value={singleMetrics.totalPublicationsAllTime}
        icon={BookOpen}
      />
      <StatCard
        label="Last Year"
        value={singleMetrics.totalPublicationsLastYear}
        icon={Award}
      />
      <StatCard
        label="Last Month"
        value={singleMetrics.totalPublicationsLastMonth}
        icon={Users}
      />
      <StatCard
        label="Avg Citations/Paper"
        value={singleMetrics.averageCitationsPerPaper.toFixed(1)}
        icon={TrendingUp}
      />
    </div>
  );
}
