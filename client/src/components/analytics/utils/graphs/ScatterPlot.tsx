import React from "react";
import { Scatter } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";

interface ScatterPlotProps {
  title?: string;
  data: ChartData<"scatter">;
  smooth?: boolean;   // if lines shown, whether smooth or not
}

const ScatterPlot: React.FC<ScatterPlotProps> = ({
  title,
  data,
  smooth = false,
}) => {
  const options: ChartOptions<"scatter"> = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: {
        display: !!title,
        text: title,
      },
    },
    elements: {
      line: {
        tension: smooth ? 0.4 : 0, // smooth vs straight
        borderWidth: 2,
      },
      point: {
        radius: 4,
        hoverRadius: 6,
      },
    },
    scales: {
      x: {
        type: "linear",
        position: "bottom",
        beginAtZero: true,
      },
      y: {
        beginAtZero: true,
      },
    },
  };

  return <Scatter data={data} options={options} />;
};

export default ScatterPlot;
