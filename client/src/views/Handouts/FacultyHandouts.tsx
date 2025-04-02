import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FilterBar } from "@/components/handouts/FilterBar";
import { STATUS_COLORS } from "@/components/handouts/types";
import { Handout } from "@/components/handouts/types";
import { UploadDialog } from "@/components/handouts/UploadDialog";
import { ReUploadDialog } from "./ReUploadDialog";

const dummyHandouts: Handout[] = [
  {
    id: "1",
    courseName: "Introduction to Programming",
    courseCode: "CS101",
    category: "FD", // New category field
    reviewerName: "Dr. Smith",
    submittedOn: "2023-04-01T00:00:00Z",
    status: "pending",
  },
  {
    id: "2",
    courseName: "Data Structures",
    courseCode: "CS201",
    category: "HD",
    reviewerName: "Prof. Johnson",
    submittedOn: "2023-04-02T00:00:00Z",
    status: "approved",
  },
  {
    id: "3",
    courseName: "Algorithms",
    courseCode: "CS301",
    category: "FD",
    reviewerName: "",
    submittedOn: "2023-04-03T00:00:00Z",
    status: "revision",
  },
  {
    id: "4",
    courseName: "Operating Systems",
    courseCode: "CS401",
    category: "HD",
    reviewerName: "Dr. Lee",
    submittedOn: "2023-04-04T00:00:00Z",
    status: "not submitted",
  },
];

const revisionComments = {
  "3": "Please add DCA Convencer comments here",
};

export const FacultyHandouts: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryFilters, setActiveCategoryFilters] = useState<string[]>([]);
  const [activeStatusFilters, setActiveStatusFilters] = useState<string[]>([]);
  const [filteredHandouts, setFilteredHandouts] = useState<Handout[]>(dummyHandouts);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isReUploadDialogOpen, setIsReUploadDialogOpen] = useState(false);
  const [selectedHandoutId, setSelectedHandoutId] = useState<string | null>(null);

  useEffect(() => {
    let results = dummyHandouts;
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
  }, [searchQuery, activeCategoryFilters, activeStatusFilters]);

  const handleUploadClick = (handoutId: string) => {
    setSelectedHandoutId(handoutId);
    setIsUploadDialogOpen(true);
  };

  const handleReUploadClick = (handoutId: string) => {
    setSelectedHandoutId(handoutId);
    setIsReUploadDialogOpen(true);
  };

  const handleUploadComplete = () => {
    console.log(`File uploaded for handout ${selectedHandoutId}`);
    setIsUploadDialogOpen(false);
    setSelectedHandoutId(null);
  };

  const handleReUploadComplete = () => {
    console.log(`File re-uploaded for handout ${selectedHandoutId}`);
    setIsReUploadDialogOpen(false);
    setSelectedHandoutId(null);
  };

  return (
    <div className="w-full px-4">
      <div className="px-2 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Faculty Handouts</h1>
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

      {/* Separator */}
      <hr className="border-gray-300 my-1" />

      {/* Handouts Table */}
      <div className="overflow-x-auto bg-white shadow w-full">
        <div className="min-w-full inline-block align-middle">
          <Table className="min-w-full">
            <TableHeader className="bg-gray-100">
              <TableRow>
                <TableHead className="px-4 py-2 text-left">Course Code</TableHead>
                <TableHead className="px-4 py-2 text-left">Course Name</TableHead>
                <TableHead className="px-4 py-2 text-left">Category</TableHead>
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
                    <TableCell className="px-4 py-2">
                      {handout.reviewerName || "Unassigned"}
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
                      {handout.status === "not submitted" ? (
                        <Button
                          variant="outline"
                          className="hover:bg-primary hover:text-white"
                          onClick={() => handleUploadClick(handout.id)}
                        >
                          Upload
                        </Button>
                      ) : handout.status === "revision" ? (
                        <Button
                          variant="outline"
                          className="hover:bg-primary hover:text-white"
                          onClick={() => handleReUploadClick(handout.id)}
                        >
                          Reupload
                        </Button>
                      ) : (
                        <Button
                          disabled
                          className="bg-white text-gray-500 cursor-not-allowed opacity-50"
                        >
                          None
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="px-4 py-2 text-center">
                    No handouts found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Upload Dialog for new uploads */}
      <UploadDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        onUpload={handleUploadComplete}
      />

      {/* ReUpload Dialog for revisions */}
      <ReUploadDialog
        isOpen={isReUploadDialogOpen}
        onClose={() => setIsReUploadDialogOpen(false)}
        onReUpload={handleReUploadComplete}
        revisionComments={
          selectedHandoutId
            ? revisionComments[selectedHandoutId as keyof typeof revisionComments] ||
              "No revision comments provided."
            : ""
        }
      />
    </div>
  );
};

export default FacultyHandouts;
