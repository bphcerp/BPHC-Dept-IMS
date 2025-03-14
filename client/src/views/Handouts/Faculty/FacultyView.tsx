import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import HandoutList, {
  HandoutItem,
} from "@/components/coursehandouts/HandoutList";
import CourseHandouts from "./FacultyApplication";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios-instance";

const statuses = ["Approved", "Pending", "Rejected"];

const Faculty = () => {
  const [search, setSearch] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(statuses);
  const [showDetail, setShowDetail] = useState(false);
  const [, setSelectedHandout] = useState<HandoutItem | null>(null);

  const { data: handoutData } = useQuery<HandoutItem[]>({
    queryKey: ["faculty-applications"],
    queryFn: async (): Promise<HandoutItem[]> => {
      const response = await api.get<{
        success: boolean;
        applications: HandoutItem[];
      }>("/handout/getAllApplicationsFaculty");
      return response.data.applications.map((el) => ({
        ...el,
        status: el.status.charAt(0).toUpperCase() + el.status.slice(1),
      }));
    },
  });

  const handleStatusChange = (values: string[]) => {
    if (values.length === 0) {
      setSelectedStatuses(["Approved"]);
    } else {
      setSelectedStatuses(values);
    }
  };

  const handleViewDetails = (handout: HandoutItem) => {
    setSelectedHandout(handout);
    setShowDetail(true);
  };

  const handleBack = () => {
    setShowDetail(false);
    setSelectedHandout(null);
  };

  const handleCreateApplication = () => {
    setSelectedHandout(null);
    setShowDetail(true);
  };

  return (
    <div className="flex min-h-screen w-full flex-col gap-4 px-10 pt-4">
      {showDetail ? (
        <div className="w-full">
          <Button onClick={handleBack} size="sm" className="mb-4">
            Back
          </Button>
          <CourseHandouts />
        </div>
      ) : (
        <>
          <h1 className="text-3xl font-bold text-primary">
            Faculty Applications
          </h1>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 transform text-gray-400" />
              <Input
                type="search"
                placeholder="Search handouts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64 pl-9"
              />
            </div>
            <Button onClick={() => console.log("Searching for:", search)}>
              Search
            </Button>
            <ToggleGroup
              type="multiple"
              value={selectedStatuses}
              onValueChange={handleStatusChange}
              className="bg-transparent"
            >
              {statuses.map((status) => (
                <ToggleGroupItem
                  key={status}
                  value={status}
                  aria-label={`Filter by ${status}`}
                  className="border border-gray-300 capitalize"
                >
                  {status}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <HandoutList
            handouts={handoutData || []}
            search={search}
            selectedStatuses={selectedStatuses}
            onViewDetails={handleViewDetails}
          />
          <div className="flex justify-end">
            <Button
              className="w-auto px-6 py-2"
              onClick={handleCreateApplication}
            >
              Create Application
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default Faculty;
