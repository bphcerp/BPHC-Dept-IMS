import HandoutRow from "./HandoutRow";
import HandoutRowWithDetails from "./HandoutRowDetails";

export interface HandoutItem {
  id: number;
  courseName: string;
  courseCode: string;
  status: string;
}

interface HandoutListProps {
  handouts: HandoutItem[];
  search: string;
  selectedStatuses: string[];
  onViewDetails?: (handout: HandoutItem) => void;
}

function HandoutList({
  handouts,
  search,
  selectedStatuses,
  onViewDetails,
}: HandoutListProps) {
  const filteredHandouts = handouts.filter((item) => {
    const matchesSearch = item.courseName
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesStatus = selectedStatuses.includes(item.status);
    return matchesSearch && matchesStatus;
  });

  if (filteredHandouts.length === 0) {
    return (
      <div className="border-b border-t border-gray-200 p-4 text-center text-gray-500">
        No handouts found for the current filter/search.
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y-2 border-b border-t border-gray-200">
      {filteredHandouts.map((item) =>
        onViewDetails ? (
          <HandoutRowWithDetails
            key={item.id}
            handoutName={item.courseName}
            status={item.status}
            onViewDetails={() => onViewDetails(item)}
          />
        ) : (
          <HandoutRow
            key={item.id}
            handoutName={item.courseName}
            status={item.status}
          />
        )
      )}
    </div>
  );
}

export default HandoutList;
