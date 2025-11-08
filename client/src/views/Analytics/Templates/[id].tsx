"use client";

import { useState, useMemo, useRef, useEffect, forwardRef, lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, X, Plus, Trash2, LayoutGrid, BarChart2, Text, Download, Save } from "lucide-react";
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
import { useParams } from "react-router-dom";

const { Y_AXIS_ALLOWED_TYPES } = analyticsSchemas;
type GraphValue = analyticsSchemas.GraphValue;

export type DataType = "total" | "cumulative";
export type MetricType = "publications" | "citations" | "both";

interface GraphConfig {
    type: 'graph';
    yAxis: keyof typeof Y_AXIS_ALLOWED_TYPES | null;
    graphType: GraphValue | null;
    filters: analyticsSchemas.AnalyticsQuery | null;
    dataType: DataType;
    metricType: MetricType;
};

interface TextConfig {
    type: 'text',
    body: string,
}

interface Section {
    type: (TextConfig | GraphConfig)['type'],
    title: string,
    id: string,
    graph: GraphConfig,
    text: TextConfig
}

interface Slide {
    id: string;
    title: string;
    sections: Section[];
};

const fetchAnalytics = async (
    params: analyticsSchemas.AnalyticsQuery
): Promise<analyticsSchemas.AnalyticsResponse> => {
    const response = await api.get("/analytics/publications", { params });
    return response.data as analyticsSchemas.AnalyticsResponse;
};

const MDEditor = lazy(() => import("@uiw/react-md-editor"));

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
                <div ref={ref} className="flex h-[60vh] w-full items-center justify-center">
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


const fetchTemplate = async (templateID: string): Promise<
    analyticsSchemas.Template
> => {
    const response = await api.get<analyticsSchemas.Template>(
        `/analytics/templates/${templateID}`
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
        `/analytics/templates/update/${id}`, template
    );
    return response.data;
};

export default function PresentationCreator() {

    const [title, setTitle] = useState("Enter Title..");
    const [slides, setSlides] = useState<Slide[]>([]);
    const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
    const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
    const chartRef = useRef<HTMLDivElement | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const renderCompleteResolver = useRef<(() => void) | null>(null);
    const { id } = useParams<{ id: string }>();

    const { data, isLoading, isError, error } = useQuery<analyticsSchemas.Template, Error>({
        queryKey: ["presentation:templates"],
        queryFn: () => fetchTemplate(id ?? ""),
    });

    useEffect(() => {
        const loadTemplate = async () => {
            if (data) {
                try {
                    const newSlides: Slide[] = [];

                    data.slides.forEach((slide) => {
                        newSlides.push({
                            id: crypto.randomUUID(),
                            title: slide.title,
                            sections: []
                        })
                        slide.sections.forEach((section) => {
                            newSlides[newSlides.length - 1].sections.push({
                                id: crypto.randomUUID(),
                                type: section.type,
                                title: section.title,
                                text: {
                                    type: 'text',
                                    ...section.text
                                },
                                graph: {
                                    type: 'graph',
                                    filters: null,
                                    ...section.graph
                                }
                            });
                        })
                    });

                    setTitle(data.title);
                    setSlides(newSlides);

                } catch (error) {
                    console.error("Failed to load template:", error);
                }
            }
        };

        loadTemplate();

    }, [data]);

    const handleRenderComplete = () => {
        renderCompleteResolver.current?.();
    };

    const getSectionConfig = (slideId: string, sectionId: string) => {
        const section = slides.find((slide) => (slide.id == slideId))?.sections.find((section) => (section.id == sectionId));
        if (section) {
            const { graph, text, ...rest } = section;
            if (section.type == 'graph') return { ...rest, ...graph }
            else if (section.type == "text") return { ...rest, ...text }
        }
        return null;
    };

    const selectedSection = useMemo(() => {
        if (selectedSectionId && selectedSlideId) {
            return getSectionConfig(selectedSlideId, selectedSectionId) ?? null;
        }
        return null;
    }, [selectedSectionId, selectedSlideId, slides]);

    if (isError) {
        return (
            <div className="flex h-[60vh] w-full items-center justify-center">
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

    if (!id) {
        return (
            <div className="flex h-[60vh] w-full items-center justify-center">
                <Card className="w-full max-w-md border-0 shadow-xl">
                    <CardContent className="p-8 text-center">
                        <p className="mb-2 text-xl font-semibold text-destructive">
                            No ID provided
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const addSlide = () => {
        const newSection: Section = {
            title: "Section",
            type: 'graph',
            id: crypto.randomUUID(),
            graph: {
                type: 'graph',
                yAxis: "Publications",
                graphType: "bar",
                filters: null,
                dataType: "total",
                metricType: "publications"
            },
            text: {
                type: "text",
                body: ""
            }
        };
        const newSlide: Slide = {
            id: crypto.randomUUID(),
            title: "Slide",
            sections: [newSection]
        };

        setSlides((prvs) => [...prvs, newSlide]);
        setSelectedSectionId(newSection.id);
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

            for (const [sei, section] of slide.sections.entries()) {

                if (section.type == 'text') continue;

                const waitForRender = new Promise<void>((resolve) => {
                    renderCompleteResolver.current = resolve;
                });
                setSelectedSectionId(section.id);

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
                            toast.error(`Could not render chart ${sei + 1} for slide ${si + 1}`);
                        } else {
                            form.append(`images`, blob, section.id);
                            filesToUpload++;
                        }

                        metadataArray.push({
                            slideIndex: si,
                            graphIndex: sei,
                            totalSections: slide.sections.length,
                            type: section.type
                        });
                    } catch (err) {
                        toast.error(`Failed to render section ${sei + 1} for slide ${si + 1} : ${err}`);
                    }
                } else {
                    console.warn(`Skipping chart ${sei + 1} for slide ${si + 1} container not rendered.`);
                }
            }
        }

        setSelectedSlideId(null);
        setSelectedSectionId(null);


        if (filesToUpload === 0) {
            toast.error("No charts are rendered. Please make sure atleast one chart exists.");
            setIsGenerating(false);
            return;
        }

        form.append('metadata', JSON.stringify(metadataArray));
        form.append('slides', JSON.stringify({
            totalSlides: slides.length,
            slideData: slides.map((slide) => {
                const formattedSections = slide.sections.map((section) => {
                    if (section.type == 'text') return { title: section.title, text: section.text.body };
                    else if (section.type == 'graph') return { title: section.title };
                })

                return { title: slide.title, sections: formattedSections }
            })
        }))

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
            wasSelectedGraphDeleted = slideToDelete.sections.some(s => s.id === selectedSectionId);
        }

        setSlides(prevSlides => prevSlides.filter(slide => slide.id !== id));

        if (wasSelectedGraphDeleted) {
            setSelectedSectionId(null);
            setSelectedSlideId(null);
        }
    };

    const addGraphToSlide = (slideId: string) => {
        const newSection: Section = {
            title: "Section",
            type: 'graph',
            id: crypto.randomUUID(),
            graph: {
                type: 'graph',
                yAxis: "Publications",
                graphType: "bar",
                filters: null,
                dataType: "total",
                metricType: "publications"
            },
            text: {
                type: "text",
                body: ""
            }
        };
        const slide = slides.find((slide) => slide.id == slideId);
        if (slide && slide.sections.length >= 4) return;
        setSlides(prevSlides =>
            prevSlides.map(slide => {
                if (slide.id === slideId && slide.sections.length < 4) {
                    return { ...slide, sections: [...slide.sections, newSection] };
                }
                return slide;
            })
        );
        setSelectedSectionId(newSection.id);
        setSelectedSlideId(slideId);
    };

    const deleteGraphFromSlide = (slideId: string, graphId: string) => {
        const slide = slides.find(s => s.id === slideId);
        if (!slide || slide.sections.length <= 1) {
            toast.warning("Each slide must have at least one graph.");
            return;
        }

        setSlides(prevSlides =>
            prevSlides.map(s => {
                if (s.id === slideId) {
                    return { ...s, sections: s.sections.filter(sec => sec.id !== graphId) };
                }
                return s;
            })
        );

        if (selectedSectionId === graphId) {
            setSelectedSectionId(null);
            setSelectedSlideId(null);
        }
    };

    const updateGraphConfig = (slideId: string, sectionId: string, field: keyof GraphConfig, value: any) => {
        setSlides(prevSlides =>
            prevSlides.map(slide => {
                if (slide.id === slideId) {
                    let newSections = slide.sections.map(section => {
                        if (section.id === sectionId) {
                            let updatedGraph = { ...section.graph, [field]: value };
                            if (field === "yAxis" && updatedGraph.yAxis) {
                                const allowedTypes = Y_AXIS_ALLOWED_TYPES[updatedGraph.yAxis] as readonly GraphValue[];
                                if (!allowedTypes.includes(updatedGraph.graphType!)) {
                                    updatedGraph.graphType = allowedTypes[0] ?? null;
                                }
                            }

                            return { ...section, graph: updatedGraph };
                        }
                        return section;
                    });
                    return { ...slide, sections: newSections };
                }
                return slide;
            })
        );
    };

    const updateSectionText = (slideId: string, sectionId: string, body: string) => {
        setSlides(prevSlides =>
            prevSlides.map(slide => {
                if (slide.id === slideId) {
                    let newSections = slide.sections.map(section => {
                        if (section.id === sectionId) {
                            return { ...section, text: { type: "text" as const, body: body } };
                        }
                        return section;
                    });
                    return { ...slide, sections: newSections };
                }
                return slide;
            })
        );
    }

    const setSlideTitle = (slideId: string, title: string) => {
        setSlides(prevSlides => prevSlides.map(
            slide => {
                if (slide.id == slideId) {
                    return { ...slide, title: title };
                } else return slide;
            }
        ))
    }

    const setSelectedSectionTitle = (title: string) => {
        setSlides(prevSlides =>
            prevSlides.map(slide => {
                if (slide.id === selectedSlideId) {
                    let newSections = slide.sections.map(section => {
                        if (section.id === selectedSectionId) {
                            return { ...section, title: title };
                        }
                        return section;
                    });
                    return { ...slide, sections: newSections };
                }
                return slide;
            })
        );
    }

    const toggleSelectedSectionType = () => {
        setSlides(prevSlides =>
            prevSlides.map(slide => {
                if (slide.id === selectedSlideId) {
                    let newSections = slide.sections.map(section => {
                        if (section.id === selectedSectionId) {
                            return { ...section, type: (section.type == "text" ? "graph" as const : "text" as const) };
                        }
                        return section;
                    });
                    return { ...slide, sections: newSections };
                }
                return slide;
            })
        );
    }

    return (
        <>
            {isLoading && (
                <div className="flex h-full w-full items-center justify-center">
                    <Loader2 className="mr-2 h-20 w-20 animate-spin" />
                </div>
            )}
            {data && (
                <div className="min-h-screen w-full bg-gradient-to-br px-4 py-16 flex flex-col items-center space-y-4">
                    <Input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full max-w-lg bg-transparent border-0 border-b-2 border-slate-300 dark:border-slate-700 rounded-none shadow-none p-6 text-center text-3xl md:text-4xl font-bold tracking-tight focus-visible:ring-0 focus:border-indigo-500 transition-all"
                    />
                    <div className="flex space-x-10">
                        <Button
                            onClick={getPresentation}
                            className="py-2 mt-8 px-6 text-lg"
                            type="submit"
                            aria-label="Get Presentation"
                            disabled={slides.length === 0}
                        >
                            <Download className="w-10 h-10" />
                        </Button>
                        <Button
                            onClick={() => updateTemplate({
                                id: id,
                                template: {
                                    title,
                                    slides: slides.flatMap(
                                        (slide,) => {
                                            return {
                                                title: slide.title,
                                                sections: slide.sections.map(section => {
                                                    return {
                                                        title: section.title,
                                                        type: section.type,
                                                        text: {
                                                            body: section.text.body
                                                        },
                                                        graph: {
                                                            yAxis: section.graph.yAxis,
                                                            graphType: section.graph.graphType,
                                                            dataType: section.graph.dataType,
                                                            metricType: section.graph.metricType
                                                        }
                                                    }
                                                }
                                                )
                                            }
                                        }
                                    )
                                }
                            })}
                            className="py-2 mt-8 px-6 text-lg"
                            type="submit"
                            aria-label="Save Template"
                            disabled={slides.length === 0}
                        >
                            <Save className="w-10 h-10" />
                        </Button>
                    </div>
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
                                                    className="bg-transparent border focus-visible:ring-0"
                                                />
                                            </div>
                                            <div className="space-x-1 flex justify-center items-center">
                                                {
                                                    slide.sections.map((section, sIndex) => {
                                                        return (
                                                            <Button
                                                                key={section.id}
                                                                variant={selectedSectionId === section.id ? "default" : "outline"}
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedSectionId(section.id)
                                                                    setSelectedSlideId(slide.id)
                                                                }}
                                                                className="shadow-sm px-2 py-0"
                                                            >
                                                                <LayoutGrid className="h-4 w-4 mr-1" />
                                                                Section {sIndex + 1}
                                                                <Button
                                                                    onClick={(_e) => deleteGraphFromSlide(slide.id, section.id)}
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
                            <div className="flex justify-between items-center w-full px-1 py-3 flex-shrink-0">

                                {
                                    selectedSection &&
                                    <>
                                        <Input
                                            key={selectedSectionId}
                                            type="text"
                                            value={selectedSection.title}
                                            onChange={(e) => setSelectedSectionTitle(e.target.value)}
                                            className="bg-transparent border-0 text-3xl md:text-4xl font-bold"
                                        />
                                        <Button className="px-3" onClick={toggleSelectedSectionType}>
                                            {
                                                selectedSection.type == 'graph' ?
                                                    <BarChart2 className="w-12 h-12" />
                                                    : <Text className="w-12 h-12" />
                                            }
                                        </Button>
                                    </>
                                }
                            </div>
                            <div className="flex-1 overflow-y-auto mt-6">
                                {
                                    (selectedSectionId && selectedSlideId && selectedSection) ? // Make sure selectedGraph is not null
                                        (
                                            <div className="space-y-4">
                                                {
                                                    selectedSection.type == 'graph' ?
                                                        <GraphRenderer
                                                            key={selectedSectionId} // Add a key to force re-mount
                                                            gConfig={selectedSection}
                                                            onRender={handleRenderComplete}
                                                            ref={el => {
                                                                chartRef.current = el;
                                                            }}
                                                            onConfigChange={(field, value) => {
                                                                updateGraphConfig(selectedSlideId, selectedSectionId, field, value);
                                                            }}
                                                        /> : <Suspense
                                                            fallback={
                                                                <div className="w-full py-8 text-center">
                                                                    Loading editor...
                                                                </div>
                                                            }
                                                        >
                                                            <MDEditor
                                                                value={selectedSection.body}
                                                                data-color-mode="light"
                                                                onChange={(value) => updateSectionText(selectedSlideId, selectedSectionId, value || "")}
                                                                height={300}
                                                                preview="live"
                                                                className="border shadow-5xl"
                                                            />
                                                        </Suspense>
                                                }
                                            </div>
                                        )
                                        : (
                                            <div className="flex items-center justify-center p-12 min-h-[400px]">
                                                <Card className="border shadow-xl w-full h-full">
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
                </div>)
            }
        </>
    )
}