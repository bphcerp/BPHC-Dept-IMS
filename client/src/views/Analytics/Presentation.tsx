// Make sure to add this at the top of your file
"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import {
    Collapsible,
} from "@/components/ui/collapsible";
import { Plus, Trash2 } from "lucide-react";
import { AnalyticsFilters } from "@/components/analytics/publications/AnalyticsFilter";
import { analyticsSchemas } from "lib";
import { ChartTooltip, ChartTooltipContent, ChartContainer } from "@/components/ui/chart";
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
import api from "@/lib/axios-instance";
import { toBlob } from "html-to-image";
import { toast } from "sonner";

const GRAPH_OPTIONS = [
    { value: "line", label: "Line Chart", component: LineChart },
    { value: "pie", label: "Pie Chart", component: PieChart },
    { value: "bar", label: "Bar Chart", component: BarChart },
] as const;

type GraphTypes = (typeof GRAPH_OPTIONS)[number]["component"];
type GraphValue = (typeof GRAPH_OPTIONS)[number]['value'];

const Y_AXIS_ALLOWED_TYPES = {
    "Publications": ["bar"],
    "Publications Over Time": ["bar", "line"],
    "Citations": ["bar"],
    "Citations Over Time": ["bar", "line"],
    "Publication Type Breakdown": ["pie", "bar"],
    "Author Contributions": ["pie", "bar"]
} as const;

const COLORS = [
    "#3b82f6", // blue
    "#22c55e", // green
    "#f97316", // orange
    "#a855f7", // violet
    "#ec4899", // pink
    "#14b8a6", // teal
    "#facc15", // yellow
] as const;

interface Slide {
    id: string;
    yAxis: keyof typeof Y_AXIS_ALLOWED_TYPES | null;
    graphType: (typeof GRAPH_OPTIONS)[number]['value'] | null;
    isGraphVisible: boolean;
    filters: analyticsSchemas.AnalyticsQuery | null;
    graph: GraphTypes | null;
    color: (typeof COLORS)[number]
}

const fetchAnalytics = async (
    params: analyticsSchemas.AnalyticsQuery
): Promise<analyticsSchemas.AnalyticsResponse> => {
    const response = await api.get("/analytics/publications", { params });
    return response.data as analyticsSchemas.AnalyticsResponse;
};

interface SlideGraphProps {
    slide: Slide;
    chartRefCallback: (el: HTMLDivElement | null) => void;
}

// This component is responsible for its own data fetching
function SlideGraph({ slide, chartRefCallback }: SlideGraphProps) {

    const chartRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chartRefCallback(chartRef.current);
    }, [chartRef.current]);

    const { data, isLoading, error: _error, isError } = useQuery<
        analyticsSchemas.AnalyticsResponse,
        Error
    >({
        queryKey: ["analytics", slide.filters],
        queryFn: () => fetchAnalytics(slide.filters!),
        enabled: !!slide.filters,
    });

    if (isError || !data) {

    }
    const chartConfig = useMemo(() => {
        if (!data || !slide.yAxis) return null;

        const { yAxis } = slide;

        if (yAxis === "Publications Over Time" || yAxis === "Publications") {
            return {
                chartData: data.publicationTimeSeries,
                xKey: "period",
                yKey: yAxis === "Publications" ? "total" : "cumulative",
            };
        }
        if (yAxis === "Citations Over Time" || yAxis === "Citations") {
            return {
                chartData: data.citationTimeSeries,
                xKey: "period",
                yKey: yAxis === "Citations" ? "total" : "cumulative",
            };
        }
        if (yAxis === "Author Contributions") {
            return {
                chartData: data.authorContributions,
                xKey: "name",
                yKey: "count",
            };
        }
        if (yAxis === "Publication Type Breakdown") {
            return {
                chartData: data.publicationTypeBreakdown,
                xKey: "type",
                yKey: "count",
            };
        }
        return null;
    }, [data, slide.yAxis]);

    const subtitle = useMemo(() => {

        if (!chartConfig || !slide.filters) {
            return null;
        }

        const { startYear, startMonth, endYear, endMonth } = slide.filters;

        // Helper function to format the date
        const formatDate = (year: number, month: number) => {
            const date = new Date(year, month - 1); // month is 0-indexed
            return date.toLocaleString('default', { month: 'short' }) + ` ${year}`;
        };

        // Create the string: "Jan 2023 – Oct 2025"
        return `${formatDate(startYear, startMonth)} – ${formatDate(endYear, endMonth)}`;
    }, [chartConfig, slide.filters]);

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="mr-2 h-20 w-20 animate-spin" />
            </div>
        )
    }

    if (isError || !data || !chartConfig) {
        return (
            <div className="flex items-center justify-center p-12 bg-gradient-to-br from-background to-muted/30">
                <Card className="border-0 shadow-xl">
                    <CardContent className="p-8 text-center min-w-[300px]">
                        <p className="mb-2 text-xl font-semibold text-destructive">
                            Error loading data
                        </p>
                        <p className="text-sm p-15 text-muted-foreground">
                            Something went wrong. Please try again later.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const { chartData, xKey, yKey } = chartConfig;

    return (
        <div className="flex flex-col items-center w-full" ref={chartRef}>
            <h1 className="text-lg font-medium text-black">{slide.yAxis}</h1>
            {subtitle && (
                <h2 className="text-sm text-muted-foreground mb-2">{subtitle}</h2>
            )}
            {(slide.graphType == 'bar') ?

                <ChartContainer config={{ [yKey]: { label: slide.yAxis, color: "#22c55e" } }} className="w-full">
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey={xKey} />
                            <YAxis />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey={yKey} fill={slide.color} isAnimationActive={false}/>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
                : (slide.graphType == "line") ?
                    <ChartContainer config={{ [yKey]: { label: slide.yAxis, color: "#10b981" } }} className="w-full">
                        <ResponsiveContainer width="100%" height={400}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey={xKey} />
                                <YAxis />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Line type="monotone" dataKey={yKey} stroke={slide.color} strokeWidth={3} dot={false} isAnimationActive={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                    : (slide.graphType == "pie") ?
                        <ChartContainer config={{ [yKey]: { label: slide.yAxis, color: "#a855f7" } }} className="w-full">
                            <ResponsiveContainer width="100%" height={400}>
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        dataKey={yKey}
                                        nameKey={xKey}
                                        isAnimationActive={false}
                                    >
                                        {chartData.map((_, idx) => (
                                            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Legend />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                        :
                        <div className="flex items-center justify-center p-12 bg-gradient-to-br from-background to-muted/30">
                            <Card className="border-0 shadow-xl">
                                <CardContent className="p-8 text-center min-w-[300px]">
                                    <p className="text-lg font-medium text-muted-foreground">
                                        Please select a graph type to generate
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
            }
        </div>
    )
}

export default function PresentationCreator() {
    const [title, setTitle] = useState("Enter Title..");
    const [slides, setSlides] = useState<Slide[]>([]);
    const [openSlides, setOpenSlides] = useState<Record<string, boolean>>({});
    const chartRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const addSlide = () => {
        const newSlide: Slide = {
            id: crypto.randomUUID(),
            yAxis: null,
            graphType: null,
            isGraphVisible: false,
            filters: null,
            graph: null,
            color: "#14b8a6"
        };
        setSlides([...slides, newSlide]);
    };

    const getPresentation = async () => {
        const allOpenState = slides.reduce((acc, slide) => {
            acc[slide.id] = true;
            return acc;
        }, {} as Record<string, boolean>);

        setOpenSlides(allOpenState);

        setTimeout(async () => {
            const form = new FormData();
            let filesToUpload = 0;

            for (const [index, slide] of slides.entries()) {
                const ref = chartRefs.current[slide.id];
                if (!ref) {
                    console.warn(`Skipping slide ${index + 1}: chart not rendered.`);
                    continue;
                }

                try {
                    const blob = await toBlob(ref, {
                        cacheBust: true,
                        backgroundColor: "white",
                        filter: (node) => {
                            if (!(node instanceof HTMLElement)) {
                                return true;
                            }
                            if (node.classList.contains("recharts-tooltip-wrapper")) {
                                return false; 
                            }
                            return true; 
                        },
                        skipFonts: true
                    });

                    if (!blob) {
                        // Use `index + 1` for a readable number
                        toast.error(`Could not render chart for slide ${index + 1}`);
                        continue;
                    }

                    form.append('image', blob, slide.id);
                    filesToUpload++;

                } catch (err) {
                    toast.error(`Failed to render slide ${index + 1} : ${err}`);
                }
            }

            if (filesToUpload === 0) {
                toast.error("No charts are rendered. Cannot create presentation.");
                return;
            }

            try {
                const res = await api.post("/analytics/presentation", form, {
                    params: {
                        title
                    },
                    responseType: 'blob'
                });

                if (res.status !== 200) {
                    toast.error("Failed to generate presentation");
                    return;
                }

                const blob = res.data;
                const url = window.URL.createObjectURL(blob);

                const a = document.createElement("a");
                a.href = url;
                a.download = "presentation.pptx";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);

            } catch (err) {
                toast.error(`Error generating presentation: ${err}`);
            }
        }, 500);
    };

    const deleteSlide = (id: string) => {
        setSlides(slides.filter((slide) => { return slide.id !== id }));
        delete chartRefs.current[id];
    };

    const updateSlide = (id: string, field: keyof Slide, value: any) => {
        setSlides(prevSlides =>
            prevSlides.map(slide => {
                let updatedSlide = slide; 

                if (slide.id === id) {
                    updatedSlide = { ...slide, [field]: value };
                }

                if (updatedSlide.yAxis && updatedSlide.graphType) {
                    const allowedTypes = Y_AXIS_ALLOWED_TYPES[updatedSlide.yAxis] as readonly GraphValue[];

                    if (!allowedTypes.includes(updatedSlide.graphType)) {

                        updatedSlide = {
                            ...updatedSlide,
                            graphType: allowedTypes[0] ?? null
                        };
                    }
                }

                return updatedSlide;
            })
        );
    };
    // --- Render ---

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-4 py-16">
            <div className="flex flex-col items-center space-y-4">
                <Input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full max-w-lg bg-transparent border-0 border-b-2 border-slate-300 dark:border-slate-700 rounded-none shadow-none p-6 text-center text-3xl md:text-4xl font-bold tracking-tight focus-visible:ring-0 focus:border-indigo-500 transition-all"
                />
                <Button
                    onClick={addSlide}
                    variant="outline"
                    size="icon"
                    className="mt-6 rounded-full w-12 h-12 shadow-sm"
                    aria-label="Add new slide"
                >
                    <Plus className="h-6 w-6" />
                </Button>
                <div className="w-full max-w-4xl mt-10 space-y-4">
                    {slides.map((slide, index) => (
                        <Collapsible
                            key={slide.id}
                            titleClassName="flex flex-wrap justify-between items-center p-4 border rounded-lg bg-card shadow-sm dark:bg-slate-800"
                            // forceMount={true}
                            title={
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="text-lg font-semibold text-muted-foreground mr-2">
                                        {index + 1}.
                                    </span>
                                    <Button
                                        onClick={() => deleteSlide(slide.id)}
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Delete slide"
                                    >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>

                                    <Select
                                        value={slide.yAxis ?? ""}
                                        onValueChange={(value) =>
                                            updateSlide(slide.id, "yAxis", value)
                                        }
                                    >
                                        <SelectTrigger className="w-[150px]">
                                            <SelectValue placeholder="Y-Axis" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {
                                                (Object.keys(Y_AXIS_ALLOWED_TYPES)).map((opt) =>
                                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                )
                                            }
                                        </SelectContent>
                                    </Select>
                                    <Select
                                        value={slide.graphType ?? ""}
                                        onValueChange={(value) =>
                                            updateSlide(slide.id, "graphType", value)
                                        }
                                        disabled={!slide.yAxis}
                                    >
                                        <SelectTrigger className="w-[150px]" disabled={!slide.yAxis}>
                                            <SelectValue placeholder="Graph Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {
                                                slide.yAxis &&
                                                GRAPH_OPTIONS.filter((obj) =>
                                                    // Cast the array to 'readonly GraphValue[]'
                                                    (Y_AXIS_ALLOWED_TYPES[slide.yAxis as keyof typeof Y_AXIS_ALLOWED_TYPES] as readonly GraphValue[]).includes(obj.value)
                                                ).map((opt) => (
                                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                                ))
                                            }
                                        </SelectContent>
                                    </Select>
                                    <Select
                                        value={slide.color}
                                        onValueChange={(value) =>
                                            updateSlide(slide.id, "color", value)
                                        }
                                    >
                                        <SelectTrigger className="w-[150px]">
                                            <SelectValue placeholder="Color" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {
                                                (COLORS.map((opt) =>
                                                    <SelectItem className={`bg-[${opt}]`} key={opt} value={opt}>{opt}</SelectItem>
                                                )
                                                )
                                            }
                                        </SelectContent>
                                    </Select>
                                </div>
                            }
                            open={openSlides[slide.id] || false}
                            onOpenChange={(isOpen) =>
                                setOpenSlides(prev => ({ ...prev, [slide.id]: isOpen }))
                            }
                        >
                            <div className="lg:col-span-2">
                                <AnalyticsFilters
                                    onSubmit={(filters) =>
                                        updateSlide(slide.id, "filters", {
                                            ...filters,
                                            authorIds: filters.authorIds as [string, ...string[]],
                                        })
                                    }
                                />
                            </div>
                            <SlideGraph slide={slide} chartRefCallback={(el) => (chartRefs.current[slide.id] = el)} />
                        </Collapsible>
                    ))}
                </div>

                <Button
                    onClick={getPresentation}
                    className="py-2"
                    type="submit"
                    aria-label="Get Presentation"
                >
                    Get Presentation
                </Button>
            </div>
        </div >
    );
}