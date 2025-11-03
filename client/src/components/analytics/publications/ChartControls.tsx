import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChartType, DataType, MetricType } from "@/views/Analytics/Publications3";

export default function ChartControls({
  chartType,
  setChartType,
  dataType,
  setDataType,
  metricType,
  setMetricType,
}: {
  chartType: ChartType;
  setChartType: (type: ChartType) => void;
  dataType: DataType;
  setDataType: (type: DataType) => void;
  metricType: MetricType;
  setMetricType: (type: MetricType) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Chart Type</Label>
        <Select
          value={chartType}
          onValueChange={(val) => setChartType(val as ChartType)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bar">Bar Chart</SelectItem>
            <SelectItem value="line">Line Chart</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Data Type</Label>
        <Select
          value={dataType}
          onValueChange={(val) => setDataType(val as DataType)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="total">Per Period</SelectItem>
            <SelectItem value="cumulative">Cumulative</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Metric</Label>
        <Select
          value={metricType}
          onValueChange={(val) => setMetricType(val as MetricType)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="publications">Publications</SelectItem>
            <SelectItem value="citations">Citations</SelectItem>
            <SelectItem value="both">Publications + Citations</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
