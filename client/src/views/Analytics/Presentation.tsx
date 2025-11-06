"use client";

import { useState, useMemo, useRef, useEffect, forwardRef } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, X, Plus, Trash2, LayoutGrid } from "lucide-react";
import { AnalyticsFilters } from "@/components/analytics/publications/AnalyticsFilter";
import { analyticsSchemas } from "lib";
import BarChart from "@/components/analytics/utils/graphs/BarChart";
import ChartControls from "@/components/analytics/publications/ChartControls";
import LineChart from "@/components/analytics/utils/graphs/LineChart";
import { chartColors } from "@/components/analytics/utils/config/colors";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import api from "@/lib/axios-instance";
import { toBlob } from "html-to-image";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const { Y_AXIS_ALLOWED_TYPES, COLORS, GRAPH_OPTIONS } = analyticsSchemas;
type GraphValue = analyticsSchemas.GraphValue;

export type DataType = "total" | "cumulative";
export type MetricType = "publications" | "citations" | "both";

interface GraphConfig {
    id: string;
    yAxis: keyof typeof Y_AXIS_ALLOWED_TYPES | null;
    graphType: GraphValue | null;
    filters: analyticsSchemas.AnalyticsQuery | null;
    color: (typeof COLORS)[number];
    dataType: DataType; // <-- Add this
    metricType: MetricType; // <-- Add this
};

interface Slide {
    id: string;
    title: string;
    graphs: GraphConfig[];
};

const fetchAnalytics = async (
    params: analyticsSchemas.AnalyticsQuery
): Promise<analyticsSchemas.AnalyticsResponse> => {
    const response = await api.get("/analytics/publications", { params });
    return response.data as analyticsSchemas.AnalyticsResponse;
};

interface GraphRendererProps {
    gConfig: GraphConfig;
    onRender?: () => void;
    onConfigChange: (
        field: keyof GraphConfig,
        value: any
    ) => void;
}

const GraphRenderer = forwardRef<HTMLDivElement, GraphRendererProps>(


    ({ gConfig, onRender, onConfigChange }, ref) => {

        const { data, isLoading, error, isError } = useQuery<
            analyticsSchemas.AnalyticsResponse,
            Error
        >({
            queryKey: ["analytics", gConfig.filters],
            queryFn: () => fetchAnalytics(gConfig.filters!),
            enabled: !!gConfig.filters,
        });

        useEffect(() => {
            // Call onRender when loading is finished (success or error)
            // This signals to the parent that the component is ready to be captured
            if (!isLoading) {
                onRender?.();
            }
        }, [isLoading, onRender]);

        if (isError) {
            return (
                <div ref={ref} className="flex h-[60vh] w-full items-center justify-center bg-gradient-to-br from-background to-muted/30">
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

        const { graphType, dataType, metricType } = gConfig;

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
        console.log("I")
        return (
            <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
                <div className="lg:col-span-2">
                    <AnalyticsFilters
                        filterValues={gConfig.filters ?? undefined}
                        onSubmit={(filters) =>
                            onConfigChange("filters", {
                                ...filters,
                                authorIds: filters.authorIds as [string, ...string[]],
                            })
                        }
                    />
                </div>
                <div className="container w-full mx-auto px-4 py-12 sm:px-6 lg:px-8 rounded-3xl">
                    <div className="mx-auto space-y-12 rounded-2xl">
                        <div className="gap-6">

                            <div className="w-full space-y-10">
                                {isLoading && (
                                    <div className="flex h-full w-full items-center justify-center">
                                        <Loader2 className="mr-2 h-20 w-20 animate-spin" />
                                    </div>
                                )}

                                {data && (
                                    <div className="space-y-4">
                                        <Card className="border-0 shadow-xl">
                                            <CardHeader>
                                                <CardTitle className="text-lg font-semibold">
                                                    Chart Configuration
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <ChartControls
                                                    chartType={graphType ?? "bar"}
                                                    setChartType={(value) => onConfigChange("graphType", value)}
                                                    dataType={dataType}
                                                    setDataType={(value) => onConfigChange("dataType", value)}
                                                    metricType={metricType}
                                                    setMetricType={(value) => onConfigChange("metricType", value)}
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
                                            <CardContent ref={ref}>
                                                {graphType === "bar" ? (
                                                    <BarChart  title={chartTitle} data={chartJsData} />
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
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );

    }


)

const fetchTemplates = async (): Promise<
    { id: string, title: string, slides: number }[]
> => {
    const response = await api.get<{ id: string, title: string, slides: number }[]>(
        "/analytics/presentation/templates/"
    );
    return response.data;
};

const fetchTemplate = async (templateID: string): Promise<
    analyticsSchemas.Template
> => {
    const response = await api.get<analyticsSchemas.Template>(
        `/analytics/presentation/templates/${templateID}`
    )

    return response.data;
}

type UpdateTemplateProps = {
    id: string,
    template: analyticsSchemas.Template
}
const updateTemplate = async ({ id, template }: UpdateTemplateProps): Promise<
    { id: string }[]
> => {
    const response = await api.patch<{ id: string }[]>(
        `/analytics/presentation/templates/update/${id}`, template
    );
    return response.data;
};

const deleteTemplate = async (id: string): Promise<
    { id: string }[]
> => {
    const response = await api.delete<{ id: string }[]>(
        `/analytics/presentation/templates/delete/${id}`
    );
    return response.data;
};

const createTemplate = async (template: analyticsSchemas.Template): Promise<
    { id: string }[]
> => {
    const response = await api.post<{ id: string }[]>(
        "/analytics/presentation/templates/create", template
    );
    return response.data;
};

export default function PresentationCreator() {

    const queryClient = useQueryClient();

    const { data: templates, isLoading: templatesLoading } = useQuery({
        queryKey: ["presentation:templates"],
        queryFn: fetchTemplates,
    });

    const [title, setTitle] = useState("Enter Title..");
    const [slides, setSlides] = useState<Slide[]>([]);
    const [selectedGraphId, setSelectedGraphId] = useState<string | null>(null);
    const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
    const chartRef = useRef<HTMLDivElement | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [currentTemplate, setCurrentTemplate] = useState<string | null>(null);
    const renderCompleteResolver = useRef<(() => void) | null>(null);

    const handleRenderComplete = () => {
        renderCompleteResolver.current?.();
    };

    const getGraphConfig = (slideId: string, graphId: string) => {
        return slides.find((slide) => (slide.id == slideId))?.graphs.find((graph) => (graph.id == graphId));
    };

    useEffect(() => {
        let ignore = false;

        const loadTemplate = async () => {
            if (currentTemplate) {
                try {
                    const template = await fetchTemplate(currentTemplate);
                    if (ignore) {
                        return;
                    }
                    const newSlides: Slide[] = Array.from({ length: template.slides }, () => ({
                        id: crypto.randomUUID(),
                        title: "Slide",
                        graphs: []
                    }));

                    template.graphs.forEach((graph) => {
                        if (newSlides[graph.slideNumber]) {
                            newSlides[graph.slideNumber].graphs.push({
                                id: crypto.randomUUID(),
                                yAxis: graph.yAxis,
                                graphType: graph.graphType,
                                filters: null,
                                color: graph.color ?? COLORS[0],
                                dataType: graph.dataType ?? analyticsSchemas.graphDataType[0],
                                metricType: graph.metricType ?? analyticsSchemas.graphMetricType[0]
                            });
                        }
                    });

                    setTitle(template.title);
                    setSlides(newSlides);

                } catch (error) {
                    console.error("Failed to load template:", error);
                }
            }
        };

        loadTemplate();

        return () => {
            ignore = true;
        };

    }, [currentTemplate]);

    const selectedGraph = useMemo(() => {
        if (selectedGraphId && selectedSlideId) {
            return getGraphConfig(selectedSlideId, selectedGraphId) ?? null;
        }
        return null;
    }, [selectedGraphId, selectedSlideId, slides]);

    const createTemplateMutation = useMutation({
        mutationFn: createTemplate,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["presentation:templates"] });
            toast.success("Template created!");
        },
        onError: (err: any) => {
            toast.error(`Failed to create: ${err.message}`);
        }
    });

    const updateTemplateMutation = useMutation({
        mutationFn: updateTemplate,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["presentation:templates"] });
            toast.success("Template updated!");
        },
        onError: (err: any) => {
            toast.error(`Failed to update: ${err.message}`);
        }
    });

    const deleteTemplateMutation = useMutation({
        mutationFn: deleteTemplate,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["presentation:templates"] });
            toast.success("Template deleted!");
        },
        onError: (err: any) => {
            toast.error(`Failed to delete: ${err.message}`);
        }
    });

    const addSlide = () => {
        const newGraph: GraphConfig = {
            id: crypto.randomUUID(),
            yAxis: "Publications", // Set a default
            graphType: "bar",      // Set a default
            filters: null,
            color: COLORS[0],
            dataType: "total",     // <-- Set default
            metricType: "publications" // <-- Set default
        };
        const newSlide: Slide = {
            id: crypto.randomUUID(),
            title: "Slide",
            graphs: [newGraph]
        };

        setSlides((prvs) => [...prvs, newSlide]);
        setSelectedGraphId(newGraph.id);
        setSelectedSlideId(newSlide.id);
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
            yAxis: "Publications", // Set a default
            graphType: "bar",      // Set a default
            filters: null,
            color: COLORS[0],
            dataType: "total",     // <-- Set default
            metricType: "publications" // <-- Set default
        };
        const slide = slides.find((slide) => slide.id == slideId);
        if (slide && slide.graphs.length >= 4) return;
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

    const setSlideTitle = (slideId: string, title: string) => {
        setSlides(prevSlides => prevSlides.map(
            slide => {
                if (slide.id == slideId) {
                    return { ...slide, title: title };
                } else return slide;
            }
        ))
    }

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
                                        <div className="px-3 flex justify-center items-center overflow-x-auto">
                                            <h4 className="font-bold flex-shrink-0">{index + 1} .</h4>
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
                                            <Input
                                                type="text"
                                                value={slide.title}
                                                onChange={(e) => setSlideTitle(slide.id, e.target.value)}
                                                className="bg-transparent border"
                                            />
                                        </div>
                                        <div className="space-x-1 flex justify-center items-center">
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
                                (selectedGraphId && selectedSlideId && selectedGraph) ? // Make sure selectedGraph is not null
                                    (
                                        <div className="space-y-4">
                                            <GraphRenderer
                                                key={selectedGraph.id} // Add a key to force re-mount
                                                gConfig={selectedGraph}
                                                onRender={handleRenderComplete}
                                                ref={el => {
                                                    chartRef.current = el;
                                                }}
                                                onConfigChange={(field, value) => {
                                                    updateGraphConfig(selectedSlideId, selectedGraphId, field, value);
                                                }}
                                            />
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
                <div className="flex-1 w-[50vw] h-[10vh] overflow-y-auto border space-y-4 rounded-2xl px-4 py-4 shadow-xl">
                    {
                        templatesLoading ?
                            <Loader2 className="h-16 w-16 animate-spin text-white" /> :
                            <>
                                <Button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        createTemplateMutation.mutate({
                                            title: title,
                                            slides: slides.length,
                                            graphs: slides.flatMap((slide, index) => {
                                                return slide.graphs.map((graph) => {
                                                    const { id, filters, ...rest } = graph;
                                                    return { slideNumber: index, ...rest };
                                                });
                                            })
                                        });
                                    }}
                                    className="w-full text-1xl  px-1 py-1"
                                >
                                    Create New Template
                                </Button>
                                {
                                    templates?.map((template, index) => {
                                        return (
                                            <div className={cn(" text-1xl border-2 flex items-center justify-between rounded-xl w-full px-5 py-2", (template.id == currentTemplate) ? "bg-blue-100" : "bg-white")} key={template.id}>
                                                <div className="w-[50%]">
                                                    <Button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            deleteTemplateMutation.mutate(template.id)
                                                        }}
                                                        variant="ghost"
                                                        size="icon"
                                                        aria-label="Delete template"
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                    <span className="text-left">{index} . <span className="font-bold">{template.title}</span> </span>
                                                </div>
                                                <div className="justify-right space-x-2">
                                                    <span className="font-normal font-muted text-xs">{template.slides} slides</span>
                                                    <Button onClick={(e) => {
                                                        e.stopPropagation();
                                                        setCurrentTemplate(template.id)
                                                    }}
                                                        className="px-2 py-1">
                                                        Select
                                                    </Button>
                                                    <Button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            updateTemplateMutation.mutate({
                                                                id: template.id,
                                                                template: {
                                                                    title: title,
                                                                    slides: slides.length,
                                                                    graphs: slides.flatMap((slide, index) => {
                                                                        return slide.graphs.map((graph) => {
                                                                            const { id, filters, ...rest } = graph;
                                                                            return { slideNumber: index, ...rest };
                                                                        });
                                                                    })
                                                                }
                                                            });
                                                        }}
                                                        className="px-2 py-1"
                                                    >
                                                        Update To Current
                                                    </Button>
                                                </div>
                                            </div>
                                        )
                                    })
                                }
                            </>
                    }
                </div>
            </div>
        </div >
    );
}