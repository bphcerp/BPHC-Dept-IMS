import type { ChartData, ChartOptions } from "chart.js";
import React from "react";
import { Line } from "react-chartjs-2";

interface LineChartProps {
  title?: string;
  data: ChartData<"line">;
  smooth?: boolean; // smooth lines (true) or straight (false)
  fill?: boolean; // fill area under line
}

const LineChart: React.FC<LineChartProps> = ({
  title,
  data,
  smooth = false,
  fill = false,
}) => {
  const options: ChartOptions<"line"> = {
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
        tension: smooth ? 0.4 : 0, // controls curve smoothness (0 = straight)
        borderWidth: 2,
        fill: fill, // fill area under line
      },
      point: {
        radius: 4,
        hoverRadius: 6,
      },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  return <Line data={data} options={options} />;
};

export default LineChart;
