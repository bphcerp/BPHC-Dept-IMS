import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import ToSubmit from "@/components/qp_review/ToSubmit";
import Submitted from "@/components/qp_review/Submitted";

const toSubmitData = [
  { course: "EEE 101", deadline: "30/11/2025" },
  { course: "CSE 102", deadline: "30/11/2025" },
  { course: "PHY 103", deadline: "30/11/2025" },
  { course: "MECH 104", deadline: "30/11/2025" },
];

const submittedData = [
  { course: "MATH 201", status: "Approved" },
  { course: "CSE 202", status: "Ongoing" },
  { course: "CHEM 203", status: "New" },
  { course: "BIO 204", status: "Approved" },
];

const statuses = ["New", "Ongoing", "Approved"];

const FicSubmissionView = () => {
  const [search, setSearch] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["New"]); // Default to "New" selected

  const handleStatusChange = (statuses: string[]) => {
    setSelectedStatuses(statuses.length ? statuses : ["New"]); // Ensure at least "New" is selected initially
  };

  // Show "To Submit" courses only when "New" toggle is active
  const showToSubmit = selectedStatuses.includes("New");

  // Filter submitted courses based on the selected statuses (excluding "New" because those are in ToSubmit)
  const filteredSubmitted = submittedData.filter(
    (item) =>
      item.status !== "New" && // Exclude "New" status from submitted
      (selectedStatuses.length === 0 || selectedStatuses.includes(item.status))
  );

  return (
    <div className="flex w-full flex-col gap-4 px-10 pt-4">
      <h1 className="text-3xl font-bold text-primary">Courses</h1>

      {/* Search & Filter Section */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 transform text-gray-400" />
          <Input
            type="search"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 pl-9"
          />
        </div>
        <Button>Search</Button>
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
              className={`border border-gray-300`}
            >
              <span className="capitalize">{status}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* To-Submit Courses (Shown only if "New" is selected) */}
      {showToSubmit && (
        <div>
          <h2 className="mt-4 text-2xl font-semibold">To Submit</h2>
          {toSubmitData.map((item, index) => (
            <ToSubmit
              key={index}
              course={item.course}
              deadline={item.deadline}
            />
          ))}
        </div>
      )}

      {/* Submitted Courses (Filtered) */}
      {filteredSubmitted.length > 0 && (
        <div>
          <h2 className="mt-4 text-2xl font-semibold">Submitted</h2>
          {filteredSubmitted.map((item, index) => (
            <Submitted key={index} course={item.course} status={item.status} />
          ))}
        </div>
      )}
    </div>
  );
};

export default FicSubmissionView;
