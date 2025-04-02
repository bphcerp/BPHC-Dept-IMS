import React, { useState, useEffect, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { FilterBar } from "@/components/handouts/FilterBar";
import { HandoutsDCAcon } from "@/components/handouts/types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { STATUS_COLORS } from "@/components/handouts/types";

const dummyHandouts: HandoutsDCAcon[] = [
  {
    id: "1",courseName: "Introduction to Programming",courseCode: "CS101",category: "FD",instructor: "Dr. Smith",
    reviewer: "Reviewer 1",
    submittedOn: "2023-04-01T00:00:00Z",
    status: "pending",
  },
  {
    id: "2",courseName: "Data Structures",courseCode: "CS201",category: "HD",instructor: "Prof. Johnson",reviewer: "Reviewer 2",
    submittedOn: "2023-04-02T00:00:00Z",
    status: "approved",
  },
  {
    id: "3",courseName: "Algorithms",courseCode: "CS301",category: "FD",instructor: "",reviewer: "",
    submittedOn: "2023-04-03T00:00:00Z",
    status: "revision",
  },
  {
    id: "4",courseName: "Operating Systems",courseCode: "CS401",category: "HD",instructor: "Dr. Lee",reviewer: "",
    submittedOn: "2023-04-04T00:00:00Z",
    status: "not submitted",
  },
];

const instructorOptions = ["Dr. Smith", "Prof. Johnson", "Dr. Lee", "Dr. Williams"];
const reviewerOptions = ["Reviewer 1", "Reviewer 2", "Reviewer 3", "Reviewer 4"];

export const DCAConvenerHandouts: React.FC = () => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryFilters, setActiveCategoryFilters] = useState<string[]>([]);
  const [activeStatusFilters, setActiveStatusFilters] = useState<string[]>([]);
  const [handouts, setHandouts] = useState<HandoutsDCAcon[]>(dummyHandouts);
  const [filteredHandouts, setFilteredHandouts] = useState<HandoutsDCAcon[]>(dummyHandouts);

  useEffect(() => {
    let results = handouts;

    if (searchQuery) {
      results = results.filter(
        (handout) =>
          handout.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          handout.courseCode.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    results = results.filter((handout) => {
      const matchesCategory =
        activeCategoryFilters.length > 0
          ? activeCategoryFilters.includes(handout.category)
          : true;
      const matchesStatus =
        activeStatusFilters.length > 0
          ? activeStatusFilters.includes(handout.status)
          : true;
      return matchesCategory && matchesStatus;
    });

    setFilteredHandouts(results);
  }, [searchQuery, activeCategoryFilters, activeStatusFilters, handouts]);

  const handleInstructorChange = (e: ChangeEvent<HTMLSelectElement>, id: string) => {
    const newValue = e.target.value;
    setHandouts((prev) =>
      prev.map((handout) =>
        handout.id === id ? { ...handout, instructor: newValue } : handout
      )
    );
  };

  const handleReviewerChange = (e: ChangeEvent<HTMLSelectElement>, id: string) => {
    const newValue = e.target.value;
    setHandouts((prev) =>
      prev.map((handout) =>
        handout.id === id ? { ...handout, reviewer: newValue } : handout
      )
    );
  };

  return (
    <div className="w-full px-4">
      <div className="px-2 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">DCA Member - Handouts</h1>
            <p className="mt-2 text-gray-600">2nd semester 2024-25</p>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" className="hover:bg-primary hover:text-white">
                Initiate
              </Button>
              <Button variant="outline" className="hover:bg-primary hover:text-white">
                Export
              </Button>
              <Button variant="outline" className="hover:bg-primary hover:text-white">
                Summary
              </Button>
            </div>
          </div>
          <div className="ml-4">
            <FilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeCategoryFilters={activeCategoryFilters}
              onCategoryFilterChange={setActiveCategoryFilters}
              activeStatusFilters={activeStatusFilters}
              onStatusFilterChange={setActiveStatusFilters}
            />
          </div>
        </div>
      </div>

      <hr className="border-gray-300 my-1" />

      <div className="overflow-x-auto bg-white shadow w-full">
        <div className="min-w-full inline-block align-middle">
          <Table className="min-w-full">
            <TableHeader className="bg-gray-100">
              <TableRow>
                <TableHead className="px-4 py-2 text-left">Course Code</TableHead>
                <TableHead className="px-4 py-2 text-left">Course Name</TableHead>
                <TableHead className="px-4 py-2 text-left">Category</TableHead>
                <TableHead className="px-4 py-2 text-left">Instructor</TableHead>
                <TableHead className="px-4 py-2 text-left">Reviewer</TableHead>
                <TableHead className="px-4 py-2 text-left">Status</TableHead>
                <TableHead className="px-4 py-2 text-left">Submitted On</TableHead>
                <TableHead className="px-4 py-2 text-left">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-300">
              {filteredHandouts.length ? (
                filteredHandouts.map((handout) => (
                  <TableRow key={handout.id} className="odd:bg-white even:bg-gray-100">
                    <TableCell className="px-4 py-2">{handout.courseCode}</TableCell>
                    <TableCell className="px-4 py-2">{handout.courseName}</TableCell>
                    <TableCell className="px-4 py-2">{handout.category}</TableCell>
                    {/* Instructor Dropdown */}
                    <TableCell className="px-4 py-2">
                      <select
                        value={handout.instructor}
                        onChange={(e) => handleInstructorChange(e, handout.id)}
                        className="border border-gray-300 p-1 rounded"
                      >
                        <option value="">Select Instructor</option>
                        {instructorOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                    {/* Reviewer Dropdown */}
                    <TableCell className="px-4 py-2">
                      <select
                        value={handout.reviewer}
                        onChange={(e) => handleReviewerChange(e, handout.id)}
                        className="border border-gray-300 p-1 rounded"
                      >
                        <option value="">Select Reviewer</option>
                        {reviewerOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell className="px-4 py-2 uppercase">
                      <span className={STATUS_COLORS[handout.status]}>
                        {handout.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {new Date(handout.submittedOn).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <Button
                        variant="outline"
                        className="hover:bg-primary hover:text-white"
                        onClick={() =>
                          navigate(`/handout/assignreviewer/${handout.id}`)
                        }
                      >
                        Assign Reviewer
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="px-4 py-2 text-center">
                    No handouts found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default DCAConvenerHandouts;
