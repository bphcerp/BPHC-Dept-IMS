import { histogramData, multiChartData, scatterData, singleChartData, singleChartMultiColoredData } from "./config/sampleData";
import BarChart from "./graphs/BarChart";
import HistogramChart from "./graphs/HistogramChart";
import LineChart from "./graphs/LineChart";
import PieChart from "./graphs/PieChart";
import ScatterPlot from "./graphs/ScatterPlot";
import "./config/setup";

function Example() {
  return (
    <>
      <div
        style={{
          width: "600px",
          margin: "50px auto",
          display: "flex",
          flexDirection: "column",
          gap: "50px",
        }}
      >
        <BarChart title="Bar graph" data={singleChartData} />
        <BarChart title="Grouped bar graph" data={multiChartData} />
        <BarChart title="Stacked bar graph" data={multiChartData} stacked />
        <BarChart title="Horizontal bar graph" data={singleChartData} horizontal />
        <BarChart title="Grouped Horizontal bar graph" data={multiChartData} horizontal />
        <BarChart title="Stacked Horizontal bar graph" data={multiChartData} horizontal stacked />

        <HistogramChart title="Histogram Chart" data={histogramData} />


        <LineChart title="Line Chart" data={singleChartData} />
        <LineChart title="Smooth Line Chart" data={singleChartData} smooth />
        <LineChart title="Multi Line Chart" data={multiChartData} />
        <LineChart title="Smooth Multi Line Chart" data={multiChartData} smooth />

        <LineChart title="Area Chart" data={singleChartData} fill />
        <LineChart title="Smooth Area Chart" data={singleChartData} smooth fill />
        <LineChart title="Multi Area Chart" data={multiChartData} fill />
        <LineChart title="Smooth Multi Area Chart" data={multiChartData} smooth fill />

        <ScatterPlot title="Scatter Plot" data={scatterData} smooth={true} />

        <PieChart title="Pie Chart" data={singleChartMultiColoredData} />
        <PieChart title="Doughnut Chart" data={singleChartMultiColoredData} doughnut />

      </div>
    </>
  );
}

export default Example;