import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
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
import { UploadDialogBox } from "@/components/qp_review/uploadDialogBox";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { qpSchemas } from "lib";

interface FacultyCourse {
  id: string;
  courseCode: string;
  courseName: string;
  category: "FD" | "HD"; // New property
  reviewerName: string;
  submittedOn: string;
  status: qpSchemas.QpStatus;
}

export const FacultyHandouts: React.FC = () => {
  const [filteredCourses, setFilteredCourses] = useState<FacultyCourse[]>();
  const navigate = useNavigate();
  const {
    data: courses,
    isLoading,
    isError,
    refetch,
  } = useQuery<FacultyCourse[]>({
    queryKey: ["*"],
    queryFn: async () => {
      try {
        const response = await api.get<{ data: FacultyCourse[] }>(
          "/qp/getAllFICSubmissions"
        );
        if (response.data.data) setFilteredCourses(response.data.data);
        return response.data.data;
      } catch (error) {
        toast.error("Failed to fetch handouts");
        throw error;
      }
    },
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryFilters, setActiveCategoryFilters] = useState<string[]>(
    []
  );
  const [activeStatusFilters, setActiveStatusFilters] = useState<string[]>([]);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedHandoutId, setSelectedHandoutId] = useState<string | null>(
    null
  );

  useMemo(() => {
    if (courses) {
      let results = courses;
      if (searchQuery) {
        results = results.filter(
          (course) =>
            course.courseName
              .toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            course.courseCode.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      results = results.filter((course) => {
        const matchesCategory =
          activeCategoryFilters.length > 0
            ? activeCategoryFilters.includes(course.category)
            : true;
        const matchesStatus =
          activeStatusFilters.length > 0
            ? activeStatusFilters.includes(course.status)
            : true;
        return matchesCategory && matchesStatus;
      });

      setFilteredCourses(results);
    }
  }, [searchQuery, activeCategoryFilters, activeStatusFilters, courses]);

  const handleUploadClick = (handoutId: string) => {
    setSelectedHandoutId(handoutId);
    setIsUploadDialogOpen(true);
  };

  const handleUploadComplete = () => {
    setIsUploadDialogOpen(false);
    setSelectedHandoutId(null);
  };

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
    <div className="w-full px-4">
      <div className="px-2 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">
              Faculty Upload Requests
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

      <div className="w-full overflow-x-auto bg-white shadow">
        <div className="inline-block min-w-full align-middle">
          <Table className="min-w-full">
            <TableHeader className="bg-gray-100">
              <TableRow>
                <TableHead className="px-4 py-2 text-left">
                  Course Code
                </TableHead>
                <TableHead className="px-4 py-2 text-left">
                  Course Name
                </TableHead>
                <TableHead className="px-4 py-2 text-left">Category</TableHead>
                <TableHead className="px-4 py-2 text-left">Reviewer</TableHead>
                <TableHead className="px-4 py-2 text-left">Status</TableHead>
                <TableHead className="px-4 py-2 text-left">
                  Submitted On
                </TableHead>
                <TableHead className="px-4 py-2 text-left">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-300">
              {filteredCourses?.length ? (
                filteredCourses.map((course) => (
                  <TableRow
                    key={course.id}
                    className="odd:bg-white even:bg-gray-100"
                  >
                    <TableCell className="px-4 py-2">
                      {course.courseCode}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {course.courseName}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {course.category}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {course.reviewerName || "Unassigned"}
                    </TableCell>
                    <TableCell className="px-4 py-2 uppercase">
                      <span className={STATUS_COLORS[course.status]}>
                        {course.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {!course.submittedOn ? (
                        <span className="mx-3">NA</span>
                      ) : (
                        new Date(course.submittedOn).toLocaleDateString()
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {course.status === "notsubmitted" ? (
                        <Button
                          variant="outline"
                          className="hover:bg-primary hover:text-white"
                          onClick={() => handleUploadClick(course.id)}
                        >
                          Upload
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          className="hover:bg-primary hover:text-white"
                          onClick={() => navigate(`/qpReview/FacultyReview/`)}
                        >
                          Details
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="px-4 py-2 text-center">
                    No courses found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Upload Dialog for new uploads */}
      <UploadDialogBox
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        onUploadSuccess={handleUploadComplete}
        id={selectedHandoutId!}
        refetch={async () => {
          await refetch();
        }}
      />
    </div>
  );
};

export default FacultyHandouts;
