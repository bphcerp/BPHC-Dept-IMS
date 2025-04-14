import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import ToSubmit from "@/components/qp_review/ToSubmit";
import Submitted from "@/components/qp_review/Submitted";
import api from "@/lib/axios-instance";

const statuses = ["pending", "approved"];
const ficEmail = "fic@email.com";

type SubmissionData = {
  courseName: string;
  courseCode: string;
  deadline?: string;
  daysLeft?: number;
  id: string;
  status: string;
  documentsUploaded: boolean;
};

const FicSubmissionView = () => {
  const [search, setSearch] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([
    "pending",
    "approved",
  ]);
  const [submissions, setSubmissions] = useState<SubmissionData[]>([]);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const response = await api.get(
          `/qp/getAllFICSubmissions/${encodeURIComponent(ficEmail)}`
        );

        if (response.status === 200) {
          const data = response.data.data;
          const formattedData = data.map((item: SubmissionData) => {
            const deadline = item.deadline ? new Date(item.deadline) : null;
            return {
              id:item.id,
              courseName: item.courseName,
              courseCode: item.courseCode,
              deadline: deadline?.toLocaleDateString("en-GB"),
              daysLeft: deadline
                ? Math.ceil(
                    (deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  )
                : undefined,
              status: item.status,
              documentsUploaded: item.documentsUploaded,
            };
          });
          setSubmissions(formattedData);

          console.log("Fetched submissions:", formattedData);
        }
      } catch (error) {
        console.error("Error fetching submissions:", error);
      }
    };

    fetchSubmissions();
  }, []);

  const handleStatusChange = (statuses: string[]) => {
    setSelectedStatuses(statuses.length ? statuses : ["pending"]);
  };

  const filteredSubmissions = submissions.filter((item) =>
    selectedStatuses.includes(item.status)
  );

  console.log(filteredSubmissions)

  return (
    <div className="flex w-full flex-col gap-4 px-10 pt-4">
      <h1 className="text-3xl font-bold text-primary">Courses</h1>

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
              className="border border-gray-300"
            >
              <span className="capitalize">{status}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {filteredSubmissions.filter((item) => item.status === "pending") && (
        <div>
          {/* <h2 className="mt-4 text-2xl font-semibold">To Submit</h2> */}
          {filteredSubmissions
            .filter((item) => item.status === "pending")
            .map((item, index) => {
              console.log(item);
              return (
                <ToSubmit
                  key={index}
                  requestId={item.id}
                  courseName={item.courseName}
                  ficDeadline={item.deadline || "N/A"}
                  daysLeft={item.daysLeft || 0}
                  courseCode={item.courseCode} 
                  ficEmail={ficEmail}     
                  documentsUploaded={item.documentsUploaded}
                  />
              );
            })}
        </div>
      )}

      {filteredSubmissions.some((item) => item.status === "approved") && (
        <div>
          <h2 className="mt-4 text-2xl font-semibold">Submitted</h2>
          {filteredSubmissions
            .filter((item) => item.status === "approved")
            .map((item, index) => (
              <Submitted
                key={index}
                courseName={item.courseName}
                courseCode={item.courseCode}
                status={item.status}
              />
            ))}
        </div>
      )}
    </div>
  );
};

export default FicSubmissionView;
