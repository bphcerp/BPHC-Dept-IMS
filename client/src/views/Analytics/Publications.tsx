import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  Loader2,
  TrendingUp,
  BookOpen,
  Users,
  Award,
  PieChart as PieChartIcon,
  BarChart3,
  LineChart as LineChartIcon,
} from "lucide-react";

import { AnalyticsFilters } from "@/components/analytics/publications/AnalyticsFilter";
import { analyticsSchemas } from "lib";
import api from "@/lib/axios-instance";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

// --- Colors
const COLORS = [
  "#3b82f6", // blue
  "#22c55e", // green
  "#f97316", // orange
  "#a855f7", // violet
  "#ec4899", // pink
  "#14b8a6", // teal
  "#facc15", // yellow
];

const fetchAnalytics = async (
  params: analyticsSchemas.AnalyticsQuery
): Promise<analyticsSchemas.AnalyticsResponse> => {
  const response = await api.get("/analytics/publications", { params });
  return response.data as analyticsSchemas.AnalyticsResponse;
};

// --- Stat Card
function StatCard({
  value,
  label,
  icon: Icon,
  color = "primary",
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
            className={`rounded-2xl bg-${color}/10 p-4 ring-1 ring-${color}/20 transition-all duration-300 group-hover:scale-110`}
          >
            <Icon className={`h-7 w-7 text-${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Main Dashboard
export default function AnalyticsDashboard() {
  const [queryParams, setQueryParams] =
    useState<analyticsSchemas.AnalyticsQuery | null>(null);

  const { data, isLoading, error, isError } = useQuery<
    analyticsSchemas.AnalyticsResponse & {
      authorContributions: { authorId: string; name: string; count: number }[];
    },
    Error
  >({
    queryKey: ["analytics", queryParams],
    queryFn: () => fetchAnalytics(queryParams!),
    enabled: !!queryParams,
  });

  if (isError) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center bg-gradient-to-br from-background to-muted/30">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <p className="mb-2 text-xl font-semibold text-destructive">
              Error loading data
            </p>
            <p className="text-sm text-muted-foreground">
              {error.message || "Something went wrong. Please try again later."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-12">
          {/* Filters + content */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
            {/* Filters */}
            <div className="lg:col-span-2">
              <AnalyticsFilters
                onSubmit={(filters) =>
                  setQueryParams({
                    ...filters,
                    authorIds: filters.authorIds as [string, ...string[]],
                  })
                }
              />
            </div>

            {/* Charts + stats */}
            <div className="col-span-5 space-y-10">
              {isLoading && (
                <div className="flex h-full w-full items-center justify-center">
                  <Loader2 className="mr-2 h-20 w-20 animate-spin" />
                </div>
              )}

              {data && (
                <>
                  {/* Stat cards */}
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                      label="Total Publications"
                      value={data.singleMetrics.totalPublicationsAllTime}
                      icon={BookOpen}
                      color="blue"
                    />
                    <StatCard
                      label="Last Year"
                      value={data.singleMetrics.totalPublicationsLastYear}
                      icon={Award}
                      color="emerald"
                    />
                    <StatCard
                      label="Last Month"
                      value={data.singleMetrics.totalPublicationsLastMonth}
                      icon={Users}
                      color="amber"
                    />
                    <StatCard
                      label="Avg Citations/Paper"
                      value={data.singleMetrics.averageCitationsPerPaper.toFixed(
                        1
                      )}
                      icon={TrendingUp}
                      color="purple"
                    />
                  </div>

                  {/* Graphs in 2-column grid */}
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Publications per period (bar) */}
                    <Card className="border-0 shadow-xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
                      <CardHeader className="flex items-center space-x-2 pb-6">
                        <BarChart3 className="h-6 w-6 text-blue-600" />
                        <div>
                          <CardTitle className="text-xl font-bold">
                            Publications Per Period
                          </CardTitle>
                          <CardDescription>
                            Number of publications per selected interval
                          </CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ChartContainer
                          config={{
                            total: { label: "Publications", color: "#3b82f6" },
                          }}
                        >
                          <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={data.publicationTimeSeries}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="period" />
                              <YAxis />
                              <ChartTooltip content={<ChartTooltipContent />} />
                              <Bar dataKey="total" fill="#3b82f6" />
                            </BarChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      </CardContent>
                    </Card>

                    {/* Publications cumulative (line) */}
                    <Card className="border-0 shadow-xl">
                      <CardHeader className="flex items-center space-x-2 pb-6">
                        <LineChartIcon className="h-6 w-6 text-indigo-600" />
                        <div>
                          <CardTitle className="text-xl font-bold">
                            Publications Over Time
                          </CardTitle>
                          <CardDescription>
                            Cumulative publication growth
                          </CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ChartContainer
                          config={{
                            cumulative: {
                              label: "Publications",
                              color: "#6366f1",
                            },
                          }}
                        >
                          <ResponsiveContainer width="100%" height={400}>
                            <LineChart data={data.publicationTimeSeries}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="period" />
                              <YAxis />
                              <ChartTooltip content={<ChartTooltipContent />} />
                              <Line
                                type="monotone"
                                dataKey="cumulative"
                                stroke="#6366f1"
                                strokeWidth={3}
                                dot={false}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      </CardContent>
                    </Card>

                    {/* Citations per period (bar) */}
                    <Card className="border-0 shadow-xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
                      <CardHeader className="flex items-center space-x-2 pb-6">
                        <BarChart3 className="h-6 w-6 text-emerald-600" />
                        <div>
                          <CardTitle className="text-xl font-bold">
                            Citations Per Period
                          </CardTitle>
                          <CardDescription>
                            Citations received per selected interval
                          </CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ChartContainer
                          config={{
                            total: { label: "Citations", color: "#22c55e" },
                          }}
                        >
                          <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={data.citationTimeSeries}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="period" />
                              <YAxis />
                              <ChartTooltip content={<ChartTooltipContent />} />
                              <Bar dataKey="total" fill="#22c55e" />
                            </BarChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      </CardContent>
                    </Card>

                    {/* Citations cumulative (line) */}
                    <Card className="border-0 shadow-xl">
                      <CardHeader className="flex items-center space-x-2 pb-6">
                        <LineChartIcon className="h-6 w-6 text-green-600" />
                        <div>
                          <CardTitle className="text-xl font-bold">
                            Citations Over Time
                          </CardTitle>
                          <CardDescription>
                            Cumulative citations growth
                          </CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ChartContainer
                          config={{
                            cumulative: {
                              label: "Citations",
                              color: "#10b981",
                            },
                          }}
                        >
                          <ResponsiveContainer width="100%" height={400}>
                            <LineChart data={data.citationTimeSeries}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="period" />
                              <YAxis />
                              <ChartTooltip content={<ChartTooltipContent />} />
                              <Line
                                type="monotone"
                                dataKey="cumulative"
                                stroke="#10b981"
                                strokeWidth={3}
                                dot={false}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Pie Charts side by side */}
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Publication Type Breakdown */}
                    <Card className="border-0 shadow-xl">
                      <CardHeader className="flex items-center justify-center space-x-2 pb-6">
                        <PieChartIcon className="h-5 w-5 text-purple-600" />
                        <CardTitle className="text-2xl font-bold">
                          Publication Type Breakdown
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ChartContainer
                          config={{
                            count: { label: "Publications", color: "#a855f7" },
                          }}
                        >
                          <ResponsiveContainer width="100%" height={400}>
                            <PieChart>
                              <Pie
                                data={data.publicationTypeBreakdown}
                                dataKey="count"
                                nameKey="type"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                stroke="white"
                                strokeWidth={2}
                                label
                              >
                                {data.publicationTypeBreakdown.map((_, idx) => (
                                  <Cell
                                    key={idx}
                                    fill={COLORS[idx % COLORS.length]}
                                  />
                                ))}
                              </Pie>
                              <Legend />
                              <ChartTooltip content={<ChartTooltipContent />} />
                            </PieChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      </CardContent>
                    </Card>

                    {/* Author Contributions */}
                    <Card className="border-0 shadow-xl">
                      <CardHeader className="flex items-center justify-center space-x-2 pb-6">
                        <PieChartIcon className="h-5 w-5 text-blue-600" />
                        <CardTitle className="text-2xl font-bold">
                          Author Contributions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ChartContainer
                          config={{
                            count: { label: "Publications", color: "#3b82f6" },
                          }}
                        >
                          <ResponsiveContainer width="100%" height={400}>
                            <PieChart>
                              <Pie
                                data={data.authorContributions}
                                dataKey="count"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                stroke="white"
                                strokeWidth={2}
                                label
                              >
                                {data.authorContributions.map((_, idx) => (
                                  <Cell
                                    key={idx}
                                    fill={COLORS[idx % COLORS.length]}
                                  />
                                ))}
                              </Pie>
                              <Legend />
                              <ChartTooltip content={<ChartTooltipContent />} />
                            </PieChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
