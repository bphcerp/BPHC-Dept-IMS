import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Loader2 } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import "@/components/analytics/utils/config/setup";

import ChartControls from "@/components/analytics/publications/ChartControls";
import QuartileTable from "@/components/analytics/publications/QuartileTable";
import StatCardRow from "@/components/analytics/publications/StatCards";
import { chartColors } from "@/components/analytics/utils/config/colors";
import BarChart from "@/components/analytics/utils/graphs/BarChart";
import LineChart from "@/components/analytics/utils/graphs/LineChart";

const fetchAnalytics = async (
  params: analyticsSchemas.AnalyticsQuery
): Promise<analyticsSchemas.AnalyticsResponse> => {
  const response = await api.get("/analytics/publications", { params });
  return response.data as analyticsSchemas.AnalyticsResponse;
};

export type ChartType = "bar" | "line";
export type DataType = "total" | "cumulative";
export type MetricType = "publications" | "citations" | "both";

const SECTION_OPTIONS = [
  { id: "chart", label: "Graph" },
  { id: "quartile", label: "Quartile Table" },
  { id: "stats", label: "Summary Stats" },
];

export default function AnalyticsDashboard() {
  const [queryParams, setQueryParams] =
    useState<analyticsSchemas.AnalyticsQuery | null>(null);

  const [chartType, setChartType] = useState<ChartType>("bar");
  const [dataType, setDataType] = useState<DataType>("total");
  const [metricType, setMetricType] = useState<MetricType>("publications");

  const [visibleSections, setVisibleSections] = useState<string[]>([
    "chart",
    "quartile",
    "stats",
  ]);

  const toggleSection = (id: string) => {
    setVisibleSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const { data, isLoading, error, isError } = useQuery<
    analyticsSchemas.AnalyticsResponse,
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

  // --- Prepare Chart.js Data ---
  const publications = data?.publicationTimeSeries ?? [];
  const citations = data?.citationTimeSeries ?? [];

  const chartConfig = {
    publications: {
      color: chartColors.blue,
      label: "Publications",
      totalLabel: "Publications Per Period",
      cumulativeLabel: "Cumulative Publications",
    },
    citations: {
      color: chartColors.green,
      label: "Citations",
      totalLabel: "Citations Per Period",
      cumulativeLabel: "Cumulative Citations",
    },
  };

  const config = chartConfig[metricType === "citations" ? "citations" : "publications"];
  const chartTitle =
    dataType === "total"
      ? (metricType === "both"
          ? "Publications & Citations Per Period"
          : config.totalLabel)
      : (metricType === "both"
          ? "Cumulative Publications & Citations"
          : config.cumulativeLabel);
  const chartDescription =
    dataType === "total"
      ? "Metric count per selected time interval"
      : "Metric growth over time";

  // --- Build Chart.js Dataset ---
  let chartJsData;

  if (metricType === "both") {
    chartJsData = {
      labels: publications.map((d) => d.period),
      datasets: [
        {
          label: chartConfig.publications.label,
          data: publications.map((d) => d[dataType]),
          backgroundColor: chartConfig.publications.color.background,
          borderColor: chartConfig.publications.color.border,
        },
        {
          label: chartConfig.citations.label,
          data: citations.map((d) => d[dataType]),
          backgroundColor: chartConfig.citations.color.background,
          borderColor: chartConfig.citations.color.border,
        },
      ],
    };
  } else {
    const chartSource =
      metricType === "publications" ? publications : citations;

    chartJsData = {
      labels: chartSource.map((d) => d.period),
      datasets: [
        {
          label: config.label,
          data: chartSource.map((d) => d[dataType]),
          backgroundColor: config.color.background,
          borderColor: config.color.border,
        },
      ],
    };
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-12">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
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

            <div className="col-span-5 space-y-10">
              {isLoading && (
                <div className="flex h-full w-full items-center justify-center">
                  <Loader2 className="mr-2 h-20 w-20 animate-spin" />
                </div>
              )}

              {data && (
                <>
                  <Card className="border-0 p-3 shadow-xl">
                    <div className="flex flex-wrap gap-4">
                      {SECTION_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => toggleSection(opt.id)}
                          className={`rounded-lg border px-4 py-2 transition ${
                            visibleSections.includes(opt.id)
                              ? "border-primary bg-primary text-white"
                              : "border-muted bg-background text-foreground"
                          }`}
                        >
                          <Check className="mr-2 inline-block h-4 w-4" />
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </Card>

                  <Separator />

                  {visibleSections.includes("chart") && (
                    <>
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

                      <Card className="border-0 shadow-xl">
                        <CardHeader>
                          <CardTitle className="text-2xl font-bold">
                            {chartTitle}
                          </CardTitle>
                          <CardDescription>{chartDescription}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {chartType === "bar" ? (
                            <BarChart title={chartTitle} data={chartJsData} />
                          ) : (
                            <LineChart
                              title={chartTitle}
                              data={chartJsData}
                              smooth
                              fill={dataType === "cumulative"}
                            />
                          )}
                        </CardContent>
                      </Card>
                    </>
                  )}

                  {visibleSections.includes("quartile") && (
                    <QuartileTable qualityIndex={data.qualityIndex} />
                  )}

                  {visibleSections.includes("stats") && (
                    <StatCardRow singleMetrics={data.singleMetrics} />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
