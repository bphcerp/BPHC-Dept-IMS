"use client";

import { useState, useMemo, useRef, useEffect, forwardRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, X, Plus, Trash2, LayoutGrid } from "lucide-react";
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
import { cn } from "@/lib/utils";

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

interface GraphConfig {
    id: string;
    yAxis: keyof typeof Y_AXIS_ALLOWED_TYPES | null;
    graphType: (typeof GRAPH_OPTIONS)[number]['value'] | null;
    filters: analyticsSchemas.AnalyticsQuery | null;
    graph: GraphTypes | null;
    color: (typeof COLORS)[number]
}

interface Slide {
    id: string;
    graphs: GraphConfig[];
}

const fetchAnalytics = async (
    params: analyticsSchemas.AnalyticsQuery
): Promise<analyticsSchemas.AnalyticsResponse> => {
    const response = await api.get("/analytics/publications", { params });
    return response.data as analyticsSchemas.AnalyticsResponse;
};

interface GraphRendererProps {
    config: GraphConfig;
    onRender?: () => void;
}

const GraphRenderer = forwardRef<HTMLDivElement, GraphRendererProps>(
    ({ config, onRender }, ref) => {

        const { data, isLoading, error: _error, isError } = useQuery<
            analyticsSchemas.AnalyticsResponse | null,
            Error
        >({
            queryKey: ["analytics", config.filters, config.yAxis],
            queryFn: () => {
                if (config.filters)
                    return fetchAnalytics(config.filters);
                return null;
            }
        });

        const chartConfig = useMemo(() => {
            if (!data || !config.yAxis) return null;
            const { yAxis } = config;

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
        }, [data, config.yAxis]);

        const subtitle = useMemo(() => {
            if (!chartConfig || !config.filters) return null;
            const { startYear, startMonth, endYear, endMonth } = config.filters ?? {};
            if (!startYear || !endYear) return null;
            const formatDate = (year: number, month: number) => {
                const date = new Date(year, month - 1); // month is 0-indexed
                return date.toLocaleString('default', { month: 'short' }) + ` ${year}`;
            };
            return `${formatDate(startYear, startMonth)} – ${formatDate(endYear, endMonth)}`;
        }, [chartConfig, config.filters]);

        useEffect(() => {
            if (!isLoading && onRender) {
                setTimeout(onRender, 100);
            }
        }, [isLoading, onRender]);

        if (isLoading) {
            return (
                <div className="flex h-full w-full items-center justify-center min-h-[400px]" ref={ref}>
                    <Loader2 className="mr-2 h-10 w-10 animate-spin" />
                </div>
            )
        }

        if (isError) {
            return (
                <div className="flex items-center justify-center p-12 bg-gradient-to-br from-background to-muted/30 min-h-[400px]" ref={ref}>
                    <Card className="border-0 shadow-xl">
                        <CardContent className="p-8 text-center min-w-[300px]">
                            <p className="mb-2 text-xl font-semibold text-destructive">
                                Error loading data
                            </p>
                            <p className="text-sm p-15 text-muted-foreground">
                                Could not load graph. Check filters.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        if (!data || !chartConfig) {
            return (
                <div className="flex items-center justify-center p-12 bg-gradient-to-br from-background to-muted/30 min-h-[400px]" ref={ref}>
                    <Card className="border-0 shadow-xl">
                        <CardContent className="p-8 text-center min-w-[300px]">
                            <p className="mb-2 text-xl font-semibold text-destructive">
                                Error processing data
                            </p>
                            <p className="text-sm p-15 text-muted-foreground">
                                The data received could not be processed.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        const { chartData, xKey, yKey } = chartConfig;

        return (
            <div className="flex flex-col items-center w-full shadow-md border rounded-lg p-4 bg-white" ref={ref}>
                <h1 className="text-lg font-medium text-black">{config.yAxis}</h1>
                {subtitle && (
                    <h2 className="text-sm text-muted-foreground mb-2">{subtitle}</h2>
                )}
                {(config.graphType == 'bar') ?
                    <ChartContainer config={{ [yKey]: { label: config.yAxis, color: "#22c55e" } }} className="w-full">
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey={xKey} />
                                <YAxis />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey={yKey} fill={config.color} isAnimationActive={false} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                    : (config.graphType == "line") ?
                        <ChartContainer config={{ [yKey]: { label: config.yAxis, color: "#10b981" } }} className="w-full">
                            <ResponsiveContainer width="100%" height={400}>
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey={xKey} />
                                    <YAxis />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Line type="monotone" dataKey={yKey} stroke={config.color} strokeWidth={3} dot={false} isAnimationActive={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                        : (config.graphType == "pie") ?
                            <ChartContainer config={{ [yKey]: { label: config.yAxis, color: "#a855f7" } }} className="w-full">
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
                            : null
                }
            </div>
        )
    }
)

export default function PresentationCreator() {
    const [title, setTitle] = useState("Enter Title..");
    const [slides, setSlides] = useState<Slide[]>([]);
    const [selectedGraphId, setSelectedGraphId] = useState<string | null>(null);
    const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
    const chartRef = useRef<HTMLDivElement | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const renderCompleteResolver = useRef<(() => void) | null>(null);
    const handleRenderComplete = () => {
        renderCompleteResolver.current?.();
    };

    const getGraphConfig = (slideId: string, graphId: string) => {
        return slides.find((slide) => (slide.id == slideId))?.graphs.find((graph) => (graph.id == graphId))
    }

    const selectedGraph = useMemo(() => {
        if (selectedGraphId && selectedSlideId) {
            return getGraphConfig(selectedSlideId, selectedGraphId) ?? null;
        }
        return null;
    }, [selectedGraphId, selectedSlideId, slides])

    const addSlide = () => {
        const newGraph: GraphConfig = {
            id: crypto.randomUUID(),
            yAxis: null,
            graphType: null,
            filters: null,
            graph: null,
            color: COLORS[0]
        };
        const newSlide: Slide = {
            id: crypto.randomUUID(),
            graphs: [newGraph]
        };

        setSlides((prvs) => [...prvs, newSlide]);
    };

    const getPresentation = async () => {


        const form = new FormData();
        let filesToUpload = 0;

        const renderTimeout = 5000;
        const metadataArray = [];

        setIsGenerating(true);


        for (const [si, slide] of slides.entries()) {
            setSelectedSlideId(slide.id);

            for (const [gi, graph] of slide.graphs.entries()) {

                const waitForRender = new Promise<void>((resolve) => {
                    renderCompleteResolver.current = resolve;
                });
                setSelectedGraphId(graph.id);

                await Promise.race([
                    waitForRender,
                    new Promise(resolve => setTimeout(resolve, renderTimeout))
                ]);

                renderCompleteResolver.current = null;
                const node = chartRef.current;

                if (node != null) {
                    try {
                        const blob = await toBlob(node, {
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
                            toast.error(`Could not render chart ${gi + 1} for slide ${si + 1}`);
                        } else {
                            form.append(`images`, blob, graph.id);
                            metadataArray.push({
                                slideIndex: si,
                                graphIndex: gi,
                                totalSlides: slide.graphs.length
                            });
                            filesToUpload++;
                        }
                    } catch (err) {
                        toast.error(`Failed to render slide ${si + 1} : ${err}`);
                    }
                } else {
                    console.warn(`Skipping chart ${gi + 1} for slide ${si + 1} container not rendered.`);
                }
            }
        }


        if (filesToUpload === 0) {
            toast.error("No charts are rendered. Cannot create presentation.");
            return;
        }

        form.append('metadata', JSON.stringify(metadataArray));

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
        } finally {
            setIsGenerating(false);
        }
    };

    const deleteSlide = (id: string) => {
        let wasSelectedGraphDeleted = false;

        const slideToDelete = slides.find(s => s.id === id);
        if (slideToDelete) {
            wasSelectedGraphDeleted = slideToDelete.graphs.some(g => g.id === selectedGraphId);
        }

        setSlides(prevSlides => prevSlides.filter(slide => slide.id !== id));

        if (wasSelectedGraphDeleted) {
            setSelectedGraphId(null);
            setSelectedSlideId(null);
        }
    };

    const addGraphToSlide = (slideId: string) => {
        const newGraph: GraphConfig = {
            id: crypto.randomUUID(),
            yAxis: null,
            graphType: null,
            filters: null,
            graph: null,
            color: COLORS[0]
        };
        const slide = slides.find((slide)=> slide.id == slideId);
        if(slide && slide.graphs.length >= 4) return;
        setSlides(prevSlides =>
            prevSlides.map(slide => {
                if (slide.id === slideId && slide.graphs.length < 4) {
                    return { ...slide, graphs: [...slide.graphs, newGraph] };
                }
                return slide;
            })
        );
        setSelectedGraphId(newGraph.id);
        setSelectedSlideId(slideId);
    };

    const deleteGraphFromSlide = (slideId: string, graphId: string) => {
        const slide = slides.find(s => s.id === slideId);
        if (!slide || slide.graphs.length <= 1) {
            toast.warning("Each slide must have at least one graph.");
            return;
        }

        setSlides(prevSlides =>
            prevSlides.map(s => {
                if (s.id === slideId) {
                    return { ...s, graphs: s.graphs.filter(g => g.id !== graphId) };
                }
                return s;
            })
        );

        if (selectedGraphId === graphId) {
            setSelectedGraphId(null);
            setSelectedSlideId(null);
        }
    };

    const updateGraphConfig = (slideId: string, graphId: string, field: keyof GraphConfig, value: any) => {
        setSlides(prevSlides =>
            prevSlides.map(slide => {
                if (slide.id === slideId) {
                    let newGraphs = slide.graphs.map(graph => {
                        if (graph.id === graphId) {
                            let updatedGraph = { ...graph, [field]: value };

                            if (field === "yAxis" && updatedGraph.yAxis) {
                                const allowedTypes = Y_AXIS_ALLOWED_TYPES[updatedGraph.yAxis] as readonly GraphValue[];
                                if (!allowedTypes.includes(updatedGraph.graphType!)) {
                                    updatedGraph.graphType = allowedTypes[0] ?? null;
                                }
                            }
                            return updatedGraph;
                        }
                        return graph;
                    });
                    return { ...slide, graphs: newGraphs };
                }
                return slide;
            })
        );
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-br px-4 py-16 ">
            <div className="flex flex-col items-center space-y-4">
                <Input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full max-w-lg bg-transparent border-0 border-b-2 border-slate-300 dark:border-slate-700 rounded-none shadow-none p-6 text-center text-3xl md:text-4xl font-bold tracking-tight focus-visible:ring-0 focus:border-indigo-500 transition-all"
                />
                <Button
                    onClick={getPresentation}
                    className="py-2 mt-8 px-6 text-lg"
                    type="submit"
                    aria-label="Get Presentation"
                    disabled={slides.length === 0}
                >
                    Get Presentation
                </Button>
                <div className="flex w-full gap-4 h-[60vh]" >
                    <div className="flex-1 overflow-y-auto border space-y-4 rounded-2xl px-4 py-4 shadow-xl">
                        {isGenerating && (
                            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm flex flex-col items-center justify-center z-50 rounded-lg">
                                <Loader2 className="h-16 w-16 animate-spin text-white" />
                                <p className="text-white text-lg mt-4 font-semibold">
                                    Generating Presentation...
                                </p>
                            </div>
                        )}
                        <div className="flex justify-between items-center w-full px-1 py-1">
                            <h2 className="text-2xl md:text-4xl font-bold">Slides</h2>
                            <Button
                                onClick={addSlide}
                                variant="outline"
                                size="icon"
                                className="rounded-full w-12 h-12 shadow-sm"
                                aria-label="Add new slide"
                            >
                                <Plus className="h-6 w-6" />
                            </Button>
                        </div>
                        {
                            slides.map((slide, index) => {
                                return (
                                    <div className={cn("border-2 flex items-center justify-between rounded-xl w-full px-1 py-2", (slide.id == selectedSlideId) ? "bg-blue-100" : "bg-white")} key={slide.id}>
                                        <div className="px-3 flex justify-center items-center">
                                            <h4 className="font-bold">{index + 1} .</h4>
                                            <Button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    deleteSlide(slide.id)
                                                }}
                                                variant="ghost"
                                                size="icon"
                                                aria-label="Delete slide"
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                        <div className="space-x-1">
                                            {
                                                slide.graphs.map((graph, gIndex) => {
                                                    return (
                                                        <Button
                                                            key={graph.id}
                                                            variant={selectedGraphId === graph.id ? "default" : "outline"}
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedGraphId(graph.id)
                                                                setSelectedSlideId(slide.id)
                                                            }}
                                                            className="shadow-sm px-2 py-0"
                                                        >
                                                            <LayoutGrid className="h-4 w-4 mr-1" />
                                                            Graph {gIndex + 1}
                                                            <Button
                                                                onClick={(_e) => deleteGraphFromSlide(slide.id, graph.id)}
                                                                className="h-4 w-2 px-0 py-0 hover:bg-background"
                                                                variant="ghost"
                                                            >
                                                                <X className="h-4 w-4 mr-1" />
                                                            </Button>
                                                        </Button>
                                                    )
                                                })
                                            }
                                            <Button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    addGraphToSlide(slide.id)
                                                }}
                                                className="h-6 w-6 px-1 py-1"
                                                variant="outline"
                                            >
                                                <Plus className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })
                        }
                    </div>
                    <div className="flex-1 flex flex-col shadow-xl border rounded-2xl px-4 py-4">
                        <div className="flex justify-between items-center w-full px-1 py-1 flex-shrink-0">
                            <h2 className="text-2xl md:text-4xl font-bold">Graph Config</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto mt-6">
                            {

                                (selectedGraphId && selectedSlideId) ?
                                    (
                                        <div className="space-y-4">
                                            <AnalyticsFilters
                                                onSubmit={(filters) => updateGraphConfig(selectedSlideId, selectedGraphId, 'filters', filters)}
                                                filterValues={selectedGraph?.filters ?? undefined}
                                            >

                                            </AnalyticsFilters>
                                            <div className="justify-between space-x-4 w-full flex">
                                                <Select
                                                    value={selectedGraph?.yAxis ?? ""}
                                                    onValueChange={(value) =>
                                                        updateGraphConfig(selectedSlideId, selectedGraphId, "yAxis", value)
                                                    }
                                                >
                                                    <SelectTrigger>
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
                                                    value={selectedGraph?.graphType ?? ""}
                                                    onValueChange={(value) =>
                                                        updateGraphConfig(selectedSlideId, selectedGraphId, "graphType", value)
                                                    }
                                                    disabled={!selectedGraph?.yAxis}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Graph Type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {
                                                            selectedGraph?.yAxis &&
                                                            GRAPH_OPTIONS.filter((obj) =>
                                                                // Cast the array to 'readonly GraphValue[]'
                                                                (Y_AXIS_ALLOWED_TYPES[selectedGraph?.yAxis as keyof typeof Y_AXIS_ALLOWED_TYPES] as readonly GraphValue[]).includes(obj.value)
                                                            ).map((opt) => (
                                                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                                            ))
                                                        }
                                                    </SelectContent>
                                                </Select>
                                                <Select
                                                    value={selectedGraph?.color}
                                                    onValueChange={(value) =>
                                                        updateGraphConfig(selectedSlideId, selectedGraphId, "color", value)
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        {selectedGraph?.color ? (
                                                            <div className="flex items-center w-full gap-2">
                                                                <div
                                                                    className="h-5 w-5 rounded border border-gray-300"
                                                                    style={{ backgroundColor: selectedGraph.color }}
                                                                />
                                                                <span className="text-sm">{selectedGraph.color}</span>
                                                            </div>
                                                        ) : (
                                                            <SelectValue placeholder="Color" />
                                                        )}
                                                    </SelectTrigger>
                                                    <SelectContent className="p-0">
                                                        {COLORS.map((opt) => (
                                                            <SelectItem
                                                                key={opt}
                                                                value={opt}
                                                                className="h-8 cursor-pointer border border-gray-300 rounded-sm transition-transform hover:scale-[1.02] p-0 focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                                                style={{ backgroundColor: opt }}
                                                            >
                                                                <span className="sr-only">{opt}</span>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {
                                                selectedGraph ? (
                                                    <GraphRenderer config={selectedGraph} onRender={handleRenderComplete} ref={el => {
                                                        chartRef.current = el;
                                                    }} />
                                                ) : (
                                                    <Card className="border-0 shadow-xl">
                                                        <CardContent className="p-8 text-center min-w-[300px]">
                                                            <p>Unable to find graph</p>
                                                        </CardContent>
                                                    </Card>
                                                )
                                            }

                                        </div>
                                    )
                                    : (
                                        <div className="flex items-center justify-center p-12 bg-gradient-to-br from-background to-muted/30 min-h-[400px]">
                                            <Card className="border-0 shadow-xl w-full h-full">
                                                <CardContent className="p-8 text-center min-w-[300px]">
                                                    <p className="mb-2 text-xl font-semibold text-destructive">
                                                        Please select a Graph.
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    )
                            }
                        </div>
                    </div>

                </div>
            </div>
        </div >
    );
}