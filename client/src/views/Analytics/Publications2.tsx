import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Loader2, TrendingUp, BookOpen, Users, Award } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

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

// --- Chart Configuration Controls
type ChartType = "bar" | "line";
type DataType = "total" | "cumulative";
type MetricType = "publications" | "citations";

function ChartControls({
  chartType,
  setChartType,
  dataType,
  setDataType,
  metricType,
  setMetricType,
}: {
  chartType: ChartType;
  setChartType: (type: ChartType) => void;
  dataType: DataType;
  setDataType: (type: DataType) => void;
  metricType: MetricType;
  setMetricType: (type: MetricType) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Chart Type</Label>
        <Select
          value={chartType}
          onValueChange={(val) => setChartType(val as ChartType)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bar">Bar Chart</SelectItem>
            <SelectItem value="line">Line Chart</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Data Type</Label>
        <Select
          value={dataType}
          onValueChange={(val) => setDataType(val as DataType)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="total">Per Period</SelectItem>
            <SelectItem value="cumulative">Cumulative</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Metric</Label>
        <Select
          value={metricType}
          onValueChange={(val) => setMetricType(val as MetricType)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="publications">Publications</SelectItem>
            <SelectItem value="citations">Citations</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// --- Main Dashboard
export default function AnalyticsDashboard() {
  const [queryParams, setQueryParams] =
    useState<analyticsSchemas.AnalyticsQuery | null>(null);

  // Chart configuration state
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [dataType, setDataType] = useState<DataType>("total");
  const [metricType, setMetricType] = useState<MetricType>("publications");

  const { data, isLoading, error, isError } = useQuery<
    analyticsSchemas.AnalyticsResponse,
    Error
  >({
    queryKey: ["analytics", queryParams],
    queryFn: () => fetchAnalytics(queryParams!),
    enabled: !!queryParams,
  });

  console.log("Analytics Data:", data);

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

  // Prepare chart data based on metric selection
  const chartData =
    metricType === "publications"
      ? data?.publicationTimeSeries
      : data?.citationTimeSeries;

  // Determine chart color and labels
  const chartConfig = {
    publications: {
      color: "#3b82f6",
      label: "Publications",
      totalLabel: "Publications Per Period",
      cumulativeLabel: "Cumulative Publications",
    },
    citations: {
      color: "#22c55e",
      label: "Citations",
      totalLabel: "Citations Per Period",
      cumulativeLabel: "Cumulative Citations",
    },
  };

  const config = chartConfig[metricType];
  const chartTitle =
    dataType === "total" ? config.totalLabel : config.cumulativeLabel;
  const chartDescription =
    dataType === "total"
      ? `${config.label} count per selected time interval`
      : `${config.label} growth over time`;

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
                  {/* Chart Controls */}
                  <Card className="border-0 shadow-xl">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold">
                        Chart Configuration
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartControls
                        chartType={chartType}
                        setChartType={setChartType}
                        dataType={dataType}
                        setDataType={setDataType}
                        metricType={metricType}
                        setMetricType={setMetricType}
                      />
                    </CardContent>
                  </Card>

                  {/* Single Configurable Chart */}
                  <Card className="border-0 shadow-xl">
                    <CardHeader>
                      <CardTitle className="text-2xl font-bold">
                        {chartTitle}
                      </CardTitle>
                      <CardDescription>{chartDescription}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={{
                          [dataType]: {
                            label: config.label,
                            color: config.color,
                          },
                        }}
                      >
                        <ResponsiveContainer width="100%" height={500}>
                          {chartType === "bar" ? (
                            <BarChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="period" />
                              <YAxis />
                              <ChartTooltip content={<ChartTooltipContent />} />
                              <Bar dataKey={dataType} fill={config.color} />
                            </BarChart>
                          ) : (
                            <LineChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="period" />
                              <YAxis />
                              <ChartTooltip content={<ChartTooltipContent />} />
                              <Line
                                type="monotone"
                                dataKey={dataType}
                                stroke={config.color}
                                strokeWidth={3}
                                dot={false}
                              />
                            </LineChart>
                          )}
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  {/* Journal Quality Index Table */}
                  <Card className="border-0 shadow-xl">
                    <CardHeader>
                      <CardTitle className="text-2xl font-bold">
                        Journal Quality Index
                      </CardTitle>
                      <CardDescription>
                        Yearly distribution of journal quality and citation
                        metrics
                      </CardDescription>
                    </CardHeader>

                    <CardContent>
                      <Table className="min-w-full">
                        <TableHeader className="bg-gray-100">
                          <TableRow>
                            <TableHead className="px-4 py-2 text-left">
                              Year
                            </TableHead>
                            <TableHead className="px-4 py-2 text-left">
                              Avg CiteScore
                            </TableHead>
                            <TableHead className="px-4 py-2 text-left">
                              Avg Impact Factor
                            </TableHead>
                            <TableHead className="px-4 py-2 text-left">
                              Highest CiteScore
                            </TableHead>
                            <TableHead className="px-4 py-2 text-left">
                              Highest Impact Factor
                            </TableHead>
                            <TableHead className="px-4 py-2 text-left">
                              Q1 %
                            </TableHead>
                            <TableHead className="px-4 py-2 text-left">
                              Q2 %
                            </TableHead>
                            <TableHead className="px-4 py-2 text-left">
                              Q3 %
                            </TableHead>
                            <TableHead className="px-4 py-2 text-left">
                              Q4 %
                            </TableHead>
                            <TableHead className="px-4 py-2 text-left">
                              No Quartile %
                            </TableHead>
                          </TableRow>
                        </TableHeader>

                        <TableBody className="divide-y divide-gray-200">
                          {data.qualityIndex?.length ? (
                            data.qualityIndex.slice(0, 5).map((row) => (
                              <TableRow
                                key={row.year}
                                className="odd:bg-white even:bg-gray-50"
                              >
                                <TableCell className="px-4 py-2 font-medium">
                                  {row.year}
                                </TableCell>
                                <TableCell className="px-4 py-2">
                                  {row.avgCiteScore?.toFixed(2)}
                                </TableCell>
                                <TableCell className="px-4 py-2">
                                  {row.avgImpactFactor?.toFixed(2)}
                                </TableCell>
                                <TableCell className="px-4 py-2">
                                  {row.highestCiteScore}
                                </TableCell>
                                <TableCell className="px-4 py-2">
                                  {row.highestImpactFactor}
                                </TableCell>
                                <TableCell className="px-4 py-2">
                                  {row.q1Percent?.toFixed(2)}%
                                </TableCell>
                                <TableCell className="px-4 py-2">
                                  {row.q2Percent?.toFixed(2)}%
                                </TableCell>
                                <TableCell className="px-4 py-2">
                                  {row.q3Percent?.toFixed(2)}%
                                </TableCell>
                                <TableCell className="px-4 py-2">
                                  {row.q4Percent?.toFixed(2)}%
                                </TableCell>
                                <TableCell className="px-4 py-2">
                                  {row.noQuartilePercent?.toFixed(2)}%
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={10}
                                className="px-4 py-6 text-center text-muted-foreground"
                              >
                                No quality index data available
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

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
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
