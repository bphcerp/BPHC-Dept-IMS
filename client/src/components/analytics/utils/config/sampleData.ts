import { chartColors } from "./colors";
import { months } from "./labels";
import type { ChartData } from "chart.js";

export const singleChartData = {
  labels: months,
  datasets: [
    {
      label: "Sales 2024",
      data: [12, 19, 3, 5, 2],
      backgroundColor: chartColors.purple.background,
      borderColor: chartColors.purple.border,
    },
  ],
};

export const singleChartMultiColoredData = {
  labels: months,
  datasets: [
    {
      label: "Sales 2024",
      data: [12, 19, 3, 5, 2],
      backgroundColor: [
        chartColors.red.background,
        chartColors.blue.background,
        chartColors.yellow.background,
        chartColors.green.background,
        chartColors.purple.background,
      ],
      borderColor: [
        chartColors.red.border,
        chartColors.blue.border,
        chartColors.yellow.border,
        chartColors.green.border,
        chartColors.purple.border,
      ],
    },
  ],
};

export const multiChartData = {
  labels: months,
  datasets: [
    {
      label: "Sales 2024",
      data: [12, 19, 3, 5, 2],
      backgroundColor: chartColors.blue.background,
      borderColor: chartColors.blue.border,
    },
    {
      label: "Sales 2025",
      data: [8, 15, 6, 9, 4],
      backgroundColor: chartColors.red.background,
      borderColor: chartColors.red.border,
    },
    {
      label: "Sales 2026",
      data: [10, 9, 12, 4, 7],
      backgroundColor: chartColors.yellow.background,
      borderColor: chartColors.yellow.border,
    },
  ],
};

export const scatterData = {
  datasets: [
    {
      label: "Experiment Data",
      data: [
        { x: 1, y: 2.1 },
        { x: 1.3, y: 1.8 },
        { x: 1.8, y: 3.0 },
        { x: 2.1, y: 2.6 },
        { x: 2.5, y: 3.7 },
        { x: 2.9, y: 3.4 },
        { x: 3.2, y: 4.8 },
        { x: 3.7, y: 4.1 },
        { x: 4.1, y: 5.3 },
        { x: 4.4, y: 4.7 },
        { x: 4.9, y: 6.2 },
        { x: 5.3, y: 5.9 },
        { x: 5.7, y: 6.4 },
        { x: 6.1, y: 6.1 },
        { x: 6.6, y: 7.3 },
        { x: 7.0, y: 6.9 },
        { x: 7.4, y: 8.1 },
        { x: 7.8, y: 7.5 },
        { x: 8.2, y: 8.7 },
        { x: 8.6, y: 8.2 },
        { x: 9.0, y: 9.0 },
        { x: 9.3, y: 8.4 },
        { x: 9.7, y: 9.5 },
        { x: 10, y: 9.1 },
      ],
      backgroundColor: chartColors.red.background,
      borderColor: chartColors.red.border,
    },
  ],
};

export const histogramData: ChartData<"bar", { x: number; y: number }[]> = {
  datasets: [
    {
      label: "Distribution",
      data: [
        { x: 0, y: 2 },
        { x: 1, y: 5 },
        { x: 2, y: 9 },
        { x: 3, y: 14 },
        { x: 4, y: 11 },
        { x: 5, y: 7 },
        { x: 6, y: 4 },
        { x: 7, y: 2 },
      ],
      backgroundColor: chartColors.green.background,
      borderColor: chartColors.green.border,
      barPercentage: 1.0,
      categoryPercentage: 1.0,
    },
  ],
};
