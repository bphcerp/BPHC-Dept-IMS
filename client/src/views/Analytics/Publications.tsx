import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import {
  LineChart,
  Legend,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const fetchPublicationData = async () => {
  const response = await api.get("/analytics/publications");
  return response.data;
};

export default function PublicationAnalytics() {
  const { data: publicationsData, isLoading } = useQuery({
    queryKey: ["publications:all"],
    queryFn: fetchPublicationData,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  if (isLoading || !publicationsData) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const cumulativeData = publicationsData.statsByYear.reduce(
    (acc: any[], curr: any, index: number) => {
      const prevTotal = index > 0 ? acc[index - 1].total : 0;
      const prevCitations = index > 0 ? acc[index - 1].citations : 0;

      acc.push({
        year: curr.year,
        total: prevTotal + curr.pubCount,
        citations: prevCitations + curr.citCount,
      });
      return acc;
    },
    []
  );

  const totalPublications =
    cumulativeData[cumulativeData.length - 1]?.total || 0;
  const totalCitations =
    cumulativeData[cumulativeData.length - 1]?.citations || 0;

  const publicationsThisYear = publicationsData.mostRecentYear
    ? publicationsData.statsByYear.find(
        (stat: any) => stat.year === publicationsData.mostRecentYear
      )?.pubCount || 0
    : 0;

  const journalArticles = publicationsData.publicationsByType?.journal || 0;
  const conferenceArticles =
    publicationsData.publicationsByType?.conference || 0;

  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-7xl space-y-6">
        {/* Heading */}
        <div className="flex justify-center">
          <h1 className="text-2xl font-semibold">Publication Statistics</h1>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - Main Charts */}
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Publications per Year</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    pubCount: {
                      label: "Publications",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-[280px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={publicationsData.statsByYear}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="pubCount"
                        stroke="var(--color-pubCount)"
                        strokeWidth={2}
                        name="Publications"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Citations per Year</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    citCount: {
                      label: "Citations",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="h-[280px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={publicationsData.statsByYear}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="citCount"
                        stroke="var(--color-citCount)"
                        strokeWidth={2}
                        name="Citations"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Citations Over Time */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Cumulative Citations</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    citations: {
                      label: "Citations",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="h-[160px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={cumulativeData}>
                      <Line
                        type="monotone"
                        dataKey="citations"
                        stroke="var(--color-citations)"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <div className="mt-3 text-center">
                  <div className="text-2xl font-bold">{totalCitations}</div>
                  <div className="text-xs text-muted-foreground">
                    Total Citations
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Publications */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  Cumulative Publications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    total: {
                      label: "Total Publications",
                      color: "hsl(var(--chart-3))",
                    },
                  }}
                  className="h-[160px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={cumulativeData}>
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="var(--color-total)"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <div className="mt-3 text-center">
                  <div className="text-2xl font-bold">{totalPublications}</div>
                  <div className="text-xs text-muted-foreground">
                    Cumulative Total
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Metrics Row */}
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          <Card className="mx-auto">
            <CardContent className="p-6 text-center">
              <div className="mb-2 text-4xl font-bold">
                {publicationsThisYear}
              </div>
              <div className="text-sm text-muted-foreground">
                Publications in {publicationsData.mostRecentYear}
              </div>
            </CardContent>
          </Card>

          <Card className="mx-auto">
            <CardContent className="p-6 text-center">
              <div className="mb-2 text-4xl font-bold">
                {publicationsData.averageCitationsPerPaper.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">
                Avg Citations per Paper
              </div>
            </CardContent>
          </Card>

          <Card className="mx-auto">
            <CardContent className="p-6 text-center">
              <div className="mb-2 text-4xl font-bold">{journalArticles}</div>
              <div className="text-sm text-muted-foreground">
                Journal Articles
              </div>
            </CardContent>
          </Card>

          <Card className="mx-auto">
            <CardContent className="p-6 text-center">
              <div className="mb-2 text-4xl font-bold">
                {conferenceArticles}
              </div>
              <div className="text-sm text-muted-foreground">
                Conference Papers
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
