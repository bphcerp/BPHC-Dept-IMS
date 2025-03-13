import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Pencil } from "lucide-react";

interface DcaRequestProps {
  courseName: string;
  professor: string;
  reviewer1?: string;
  reviewer2?: string;
  status: "Ongoing" | "Pending" | "Approved";
}

const reviewerOptions = [
  { value: "atiksh", label: "Atiksh" },
  { value: "shreyansh", label: "Shreyansh" },
  { value: "adeeb", label: "Adeeb" },
  { value: "shiv", label: "Shiv" },
  { value: "soumitra", label: "Soumitra" },
  { value: "tanay", label: "Tanay" },
];

const DcaRequest: React.FC<DcaRequestProps> = ({
  courseName,
  professor,
  reviewer1,
  reviewer2,
  status,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Ongoing":
        return "bg-orange-300 text-orange-800";
      case "Pending":
        return "bg-gray-300 text-gray-800";
      case "Approved":
        return "bg-green-300 text-green-800";
      default:
        return "bg-gray-300 text-gray-800";
    }
  };

  return (
    <div className="flex items-center justify-between rounded-lg border bg-white p-4 shadow-md">
      <div>
        <h3 className="flex items-center gap-2 text-lg font-bold">
          {courseName}
          <Pencil className="h-4 w-4 cursor-pointer text-gray-500 hover:text-gray-700" />
        </h3>
        <p className="text-sm text-gray-500">{professor}</p>
      </div>

      <div className="flex gap-4">
        <Select defaultValue={reviewer1 ?? ""} onValueChange={(value) => console.log("Reviewer 1:", value)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Faculty Reviewer 1" />
          </SelectTrigger>
          <SelectContent>
            {reviewerOptions.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select defaultValue={reviewer2 ?? ""} onValueChange={(value) => console.log("Reviewer 2:", value)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Faculty Reviewer 2" />
          </SelectTrigger>
          <SelectContent>
            {reviewerOptions.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Badge className={`rounded-full px-3 py-1 ${getStatusColor(status)}`}>
        {status}
      </Badge>
    </div>
  );
};

export default DcaRequest;
