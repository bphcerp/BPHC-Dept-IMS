import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
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
} from "recharts";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  BookOpen,
  Users,
  Award,
  BarChart3,
  PieChart as PieChartIcon,
} from "lucide-react";

const fetchPublicationData = async () => {
  const response = await api.get("/analytics/publications");
  if (!response) {
    throw new Error("Failed to fetch publication data");
  }
  return response.data;
};

// Loading skeleton component
const LoadingSkeleton = () => (
  <div className="flex w-full justify-center p-8">
    <div className="w-full max-w-7xl space-y-8">
      <Skeleton className="mx-auto h-12 w-80" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-36" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Skeleton className="h-[420px]" />
        <Skeleton className="h-[420px]" />
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Skeleton className="h-[420px]" />
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    </div>
  </div>
);

const StatCard = ({ value, label, icon: Icon, color = "primary" }: any) => (
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

const RADIAN = Math.PI / 180;

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-(midAngle ?? 0) * RADIAN);
  const y = cy + radius * Math.sin(-(midAngle ?? 0) * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      className="text-sm font-semibold drop-shadow-md"
    >
      {`${((percent ?? 1) * 100).toFixed(0)}%`}
    </text>
  );
};

export default function PublicationAnalytics() {
  const {
    data: publicationsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["publications:all"],
    queryFn: fetchPublicationData,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error || !publicationsData) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center bg-gradient-to-br from-background to-muted/30">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <BarChart3 className="h-8 w-8 text-destructive" />
            </div>
            <p className="mb-2 text-xl font-semibold text-destructive">
              Error loading data
            </p>
            <p className="text-sm text-muted-foreground">
              Failed to fetch publication data. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const publicationsThisYear = publicationsData.mostRecentYear
    ? publicationsData.statsByYear.find(
        (stat: any) => stat.year === publicationsData.mostRecentYear
      )?.pubCount || 0
    : 0;

  const journalArticles = publicationsData.publicationsByType?.journal || 0;
  const conferenceArticles =
    publicationsData.publicationsByType?.conference || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-12">
          <div className="space-y-4 text-center">
            <h1 className="whitespace-nowrap text-3xl font-bold text-primary">
              Publication Analytics
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Comprehensive insights into research output, collaboration
              patterns, and academic impact metrics
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              value={publicationsThisYear}
              label={`Publications in ${publicationsData.mostRecentYear}`}
              icon={BookOpen}
              color="blue"
            />
            <StatCard
              value={publicationsData.averageCitationsPerPaper.toFixed(1)}
              label="Avg Citations per Paper"
              icon={TrendingUp}
              color="emerald"
            />
            <StatCard
              value={journalArticles}
              label="Journal Articles"
              icon={Award}
              color="amber"
            />
            <StatCard
              value={conferenceArticles}
              label="Conference Papers"
              icon={Users}
              color="purple"
            />
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <Card className="border-0 shadow-xl transition-all duration-300 hover:shadow-2xl">
              <CardHeader className="space-y-2 pb-6">
                <div className="flex items-center space-x-2">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-bold">
                    Publications Over Time
                  </CardTitle>
                </div>
                <CardDescription className="text-base">
                  Track your research output trends and publication frequency
                  across years
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-8">
                <ChartContainer
                  config={{
                    pubCount: {
                      label: "Publications",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-[400px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={publicationsData.statsByYear}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted/20"
                      />
                      <XAxis
                        dataKey="year"
                        className="text-sm"
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                      />
                      <YAxis
                        className="text-sm"
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                      />
                      <ChartTooltip
                        content={<ChartTooltipContent />}
                        cursor={{ strokeDasharray: "5 5" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="pubCount"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        name="Publications"
                        dot={{
                          fill: "hsl(var(--primary))",
                          strokeWidth: 2,
                          r: 5,
                        }}
                        activeDot={{
                          r: 8,
                          stroke: "hsl(var(--primary))",
                          strokeWidth: 2,
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl transition-all duration-300 hover:shadow-2xl">
              <CardHeader className="space-y-2 pb-6">
                <div className="flex items-center space-x-2">
                  <div className="rounded-lg bg-emerald-500/10 p-2">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                  </div>
                  <CardTitle className="text-2xl font-bold">
                    Citations Over Time
                  </CardTitle>
                </div>
                <CardDescription className="text-base">
                  Monitor your research impact and citation growth patterns
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-8">
                <ChartContainer
                  config={{
                    citCount: {
                      label: "Citations",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="h-[400px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={publicationsData.statsByYear}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted/20"
                      />
                      <XAxis
                        dataKey="year"
                        className="text-sm"
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                      />
                      <YAxis
                        className="text-sm"
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                      />
                      <ChartTooltip
                        content={<ChartTooltipContent />}
                        cursor={{ strokeDasharray: "5 5" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="citCount"
                        stroke="hsl(var(--chart-2))"
                        strokeWidth={3}
                        name="Citations"
                        dot={{
                          fill: "hsl(var(--chart-2))",
                          strokeWidth: 2,
                          r: 5,
                        }}
                        activeDot={{
                          r: 8,
                          stroke: "hsl(var(--chart-2))",
                          strokeWidth: 2,
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
          <div className="flex justify-center">
            <Card className="w-full max-w-4xl border-0 shadow-xl transition-all duration-300 hover:shadow-2xl">
              <CardHeader className="space-y-2 pb-6">
                <div className="flex items-center justify-center space-x-2">
                  <div className="rounded-lg bg-purple-500/10 p-2">
                    <PieChartIcon className="h-5 w-5 text-purple-600" />
                  </div>
                  <CardTitle className="text-2xl font-bold">
                    Top Contributing Authors
                  </CardTitle>
                </div>
                <CardDescription className="text-center text-base">
                  Distribution of publications among your most prolific
                  researchers
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-8">
                <ChartContainer
                  config={{
                    count: {
                      label: "Publications",
                      color: "hsl(var(--chart-3))",
                    },
                  }}
                  className="h-[400px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={publicationsData.topAuthors}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        fill="hsl(var(--chart-3))"
                        label={renderCustomizedLabel}
                        stroke="white"
                        strokeWidth={2}
                      >
                        {publicationsData.topAuthors.map(
                          (entry: any, index: number) => (
                            <Cell
                              key={`cell-${entry.name}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          )
                        )}
                      </Pie>
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="rounded-xl border-0 bg-white p-4 shadow-xl dark:bg-gray-900">
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <div
                                      className="h-3 w-3 rounded-full"
                                      style={{
                                        backgroundColor:
                                          payload[0].payload.fill,
                                      }}
                                    />
                                    <span className="font-semibold text-foreground">
                                      {payload[0].payload.name}
                                    </span>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    <span className="font-medium">
                                      {payload[0].value}
                                    </span>{" "}
                                    publications
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
