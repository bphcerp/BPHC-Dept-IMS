import React from "react";
import { Pie } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";

interface PieChartProps {
  title?: string;
  data: ChartData<"pie">;
  doughnut?: boolean;
}

const PieChart: React.FC<PieChartProps> = ({ title, data, doughnut = false}) => {
  const options: ChartOptions<"pie"> = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: !!title,
        text: title,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || "";
            const value = context.formattedValue || "";
            return `${label}: ${value}`;
          },
        },
      },
    },
    cutout: doughnut ? "50%" : "0%",
  };

  return <Pie data={data} options={options} />;
};

export default PieChart;
