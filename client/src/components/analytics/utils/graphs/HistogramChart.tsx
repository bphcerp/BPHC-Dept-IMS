import React from "react";
import { Bar } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";

interface HistogramChartProps {
  title?: string;
  data: ChartData<"bar", { x: number; y: number }[]>;
  color?: string;
}

const HistogramChart: React.FC<HistogramChartProps> = ({
  title,
  data,
  color,
}) => {
  const options: ChartOptions<"bar"> = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: !!title,
        text: title,
      },
    },
    scales: {
      x: {
        type: "linear",
        title: { display: true, text: "Value Range" },
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        title: { display: true, text: "Frequency" },
      },
    },
    elements: {
      bar: {
        borderWidth: 1,
        borderSkipped: "bottom",
        backgroundColor: color || "rgba(54, 162, 235, 0.6)",
        borderColor: color ? color.replace("0.6", "1") : "rgb(54, 162, 235)",
      },
    },
  };

  return <Bar data={data} options={options} />;
};

export default HistogramChart;
