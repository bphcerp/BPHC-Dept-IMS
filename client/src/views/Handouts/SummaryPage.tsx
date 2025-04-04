import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FilterBar } from "@/components/handouts/filterBar";
import { STATUS_COLORS } from "@/components/handouts/types";

interface HandoutSummary {
  id: string;
  courseCode: string;
  icName: string;
  reviewerName: string;
  status: string;
  submittedOn: string;
  category: string;
  scopeAndObjective: boolean;
  textBookPrescribed: boolean;
  lecturewisePlanLearningObjective: boolean;
  lecturewisePlanCourseTopics: boolean;
  numberOfLP: boolean;
  evaluationScheme: boolean;
}

const dummyData: HandoutSummary[] = [
  {
    id: "1",
    courseCode: "CS101",
    icName: "Dr. Alice",
    reviewerName: "Reviewer 1",
    status: "approved",
    submittedOn: "2025-03-31T00:00:00Z",
    category: "FD",
    scopeAndObjective: true,
    textBookPrescribed: false,
    lecturewisePlanLearningObjective: true,
    lecturewisePlanCourseTopics: true,
    numberOfLP: false,
    evaluationScheme: true,
  },
  {
    id: "2",
    courseCode: "MA202",
    icName: "Dr. Bob",
    reviewerName: "Reviewer 2",
    status: "pending",
    submittedOn: "2025-04-01T00:00:00Z",
    category: "HD",
    scopeAndObjective: false,
    textBookPrescribed: true,
    lecturewisePlanLearningObjective: false,
    lecturewisePlanCourseTopics: true,
    numberOfLP: true,
    evaluationScheme: false,
  },
];

const DCAConvenerSummary: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryFilters, setActiveCategoryFilters] = useState<string[]>([]);
  const [activeStatusFilters, setActiveStatusFilters] = useState<string[]>([]);
  const [filteredData, setFilteredData] = useState<HandoutSummary[]>(dummyData);

  useEffect(() => {
    let results = dummyData;

    if (searchQuery) {
      results = results.filter(
        (handout) =>
          handout.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
          handout.icName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          handout.reviewerName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (activeCategoryFilters.length > 0) {
      results = results.filter((handout) =>
        activeCategoryFilters.includes(handout.category)
      );
    }
    if (activeStatusFilters.length > 0) {
      results = results.filter((handout) =>
        activeStatusFilters.includes(handout.status)
      );
    }

    setFilteredData(results);
  }, [searchQuery, activeCategoryFilters, activeStatusFilters]);

  return (
		<div className="container mx-auto p-4">
      <div className="px-2 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">
              Summary Page DCA Convenor
            </h1>
            <p className="mt-2 text-gray-600">2nd semester 2024-25</p>
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
      <hr className="my-1 border-gray-300" />
      <div className="overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader className="bg-gray-100">
            <TableRow>
              <TableHead className="px-4 py-2">Course Code</TableHead>
              <TableHead className="px-4 py-2">Category</TableHead>
              <TableHead className="px-4 py-2">IC Name</TableHead>
              <TableHead className="px-4 py-2">Reviewer Name</TableHead>
              <TableHead className="px-4 py-2">Status</TableHead>
              <TableHead className="px-4 py-2">Submitted On</TableHead>
              <TableHead className="px-4 py-2">Scope &amp; Objective</TableHead>
              <TableHead className="px-4 py-2">Textbook Prescribed</TableHead>
              <TableHead className="px-4 py-2">Learning Objective</TableHead>
              <TableHead className="px-4 py-2">Course Topics</TableHead>
              <TableHead className="px-4 py-2">No. of LP</TableHead>
              <TableHead className="px-4 py-2">Evaluation Scheme</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-300">
            {filteredData && filteredData.length ? (
              filteredData.map((handout) => (
                <TableRow
                  key={handout.id}
                  className="odd:bg-white even:bg-gray-100"
                >
                  <TableCell className="px-4 py-2">
                    {handout.courseCode}
                  </TableCell>
                  <TableCell className="px-4 py-2">{handout.category}</TableCell>
                  <TableCell className="px-4 py-2">{handout.icName}</TableCell>
                  <TableCell className="px-4 py-2">
                    {handout.reviewerName}
                  </TableCell>
                  <TableCell
                    className={`px-4 py-2 capitalize ${STATUS_COLORS[handout.status]}`}
                  >
                    {handout.status}
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    {new Date(handout.submittedOn).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="px-4 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={handout.scopeAndObjective}
                      disabled
                    />
                  </TableCell>
                  <TableCell className="px-4 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={handout.textBookPrescribed}
                      disabled
                    />
                  </TableCell>
                  <TableCell className="px-4 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={handout.lecturewisePlanLearningObjective}
                      disabled
                    />
                  </TableCell>
                  <TableCell className="px-4 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={handout.lecturewisePlanCourseTopics}
                      disabled
                    />
                  </TableCell>
                  <TableCell className="px-4 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={handout.numberOfLP}
                      disabled
                    />
                  </TableCell>
                  <TableCell className="px-4 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={handout.evaluationScheme}
                      disabled
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={12} className="px-4 py-2 text-center">
                  No handouts found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default DCAConvenerSummary;
