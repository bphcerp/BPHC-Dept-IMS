import React from "react";
import { type ChartOptions, type ChartData } from "chart.js";
import { Bar } from "react-chartjs-2";

interface BarChartProps {
  title?: string;
  data: ChartData<"bar">;
  stacked?: boolean;
  horizontal?: boolean;
}

const BarChart: React.FC<BarChartProps> = ({
  title,
  data,
  stacked = false,
  horizontal = false,
}) => {
  const options: ChartOptions<"bar"> = {
    indexAxis: horizontal ? "y" : "x",
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: !!title,
        text: title,
      },
    },
    scales: {
      x: {
        stacked,
      },
      y: {
        beginAtZero: true,
        stacked,
      },
    },
  };

  return <Bar data={data} options={options} />;
};

export default BarChart;
