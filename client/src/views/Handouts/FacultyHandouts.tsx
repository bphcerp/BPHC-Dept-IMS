import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { handoutSchemas } from "lib";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface Handout {
  id: string;
  courseName: string;
  courseCode: string;
  reviewerName?: string;
  submittedOn: string;
  status: handoutSchemas.HandoutStatus;
}

const STATUS_COLORS: Record<handoutSchemas.HandoutStatus, string> = {
  pending: "text-yellow-600",
  approved: "text-green-600",
  rejected: "text-red-600",
  notsubmitted: "text-gray-500",
};

const FacultyHandouts: React.FC = () => {
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [filteredHandouts, setFilteredHandouts] = useState<Handout[]>([]);
  const {
    data: handouts,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["handouts-faculty"],
    queryFn: async () => {
      try {
        const response = await api.get<{ data: Handout[] }>(
          "/handout/faculty/get"
        );
        return response.data.data;
      } catch (error) {
        toast.error("Failed to fetch handouts");
        throw error;
      }
    },
  });

  useEffect(() => {
    if (handouts) {
      const filtered = selectedStatuses.length
        ? handouts.filter((handout) =>
            selectedStatuses.includes(handout.status)
          )
        : handouts;
      setFilteredHandouts(filtered);
    }
  }, [handouts, selectedStatuses]);

  if (isLoading)
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  if (isError)
    return (
      <div className="flex h-screen items-center justify-center text-red-500">
        Error fetching handouts
      </div>
    );

  return (
    <div className="h-screen w-full p-6">
      <div className="h-full overflow-hidden rounded-lg bg-white">
        <div className="flex h-full flex-col">
          <div className="border-b p-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-800">
                Faculty Handouts
              </h1>
              <ToggleGroup
                type="multiple"
                value={selectedStatuses}
                onValueChange={setSelectedStatuses}
                className="space-x-2 bg-transparent"
              >
                {handoutSchemas.handoutStatuses.map((status) => (
                  <ToggleGroupItem
                    key={status}
                    value={status}
                    className="border capitalize"
                  >
                    {status}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </div>
          <div className="flex-grow overflow-auto p-6">
            <Table className="w-full rounded-lg border">
              <TableHeader className="sticky top-0 bg-gray-100">
                <TableRow>
                  <TableHead>Course Code</TableHead>
                  <TableHead>Course Name</TableHead>
                  <TableHead>Reviewer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted On</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHandouts.length ? (
                  filteredHandouts.map((handout) => (
                    <TableRow key={handout.id}>
                      <TableCell>{handout.courseCode}</TableCell>
                      <TableCell>{handout.courseName}</TableCell>
                      <TableCell>
                        {handout.reviewerName || "Unassigned"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`uppercase ${STATUS_COLORS[handout.status]}`}
                        >
                          {handout.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(handout.submittedOn).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          asChild
                          variant="outline"
                          className="hover:bg-primary hover:text-white"
                        >
                          <Link to={`/handouts/${handout.id}`}>Details</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      No handouts found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyHandouts;
