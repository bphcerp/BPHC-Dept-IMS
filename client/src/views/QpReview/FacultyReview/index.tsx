import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FilterBar } from "@/components/handouts/filterBar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { STATUS_COLORS } from "@/components/handouts/types";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { toast } from "sonner";
export interface DCAQpReview {
  id: string;
  courseName: string;
  courseCode: string;
  category: string;
  professorName: string;
  submittedOn: string;
  status: string;
}

export const DCAMemberHandouts: React.FC = () => {
  const navigate = useNavigate();
  const {
    data: courses,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["*"],
    queryFn: async () => {
      try {
        const response = await api.get<{
          courses: DCAQpReview[];
          success: boolean;
        }>("/qp/getAllDcaMemberRequests");
        if (response.data.courses) {
          setFilteredCourses(response.data.courses);
          localStorage.setItem(
            "Qp Reviews DCA MEMBER",
            JSON.stringify(response.data.courses)
          );
        }
        return response.data.courses;
      } catch (error) {
        toast.error("Failed to fetch courses");
        throw error;
      }
    },
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryFilters, setActiveCategoryFilters] = useState<string[]>(
    []
  );
  const [activeStatusFilters, setActiveStatusFilters] = useState<string[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<DCAQpReview[]>();
  const slugify = (courseCode:string)=>{ encodeURIComponent(
    courseCode.toLowerCase().replace(/\s+/g, "-")
  )};

  useEffect(() => {
    let results = courses;

    if (searchQuery) {
      results = results?.filter(
        (course) =>
          course.courseName
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          course.courseCode.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    results = results?.filter((handout) => {
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

    setFilteredCourses(results);
  }, [searchQuery, activeCategoryFilters, activeStatusFilters, courses]);

  if (isLoading)
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  if (isError)
    return (
      <div className="flex h-screen items-center justify-center text-red-500">
        Error fetching courses
      </div>
    );

  return (
    <div className="w-full px-4">
      <div className="px-2 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">
              DCA Member - Courses To Review
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
                <TableHead className="px-4 py-2 text-left">IC Name</TableHead>
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
                      {course.professorName}
                    </TableCell>
                    <TableCell className="px-4 py-2 uppercase">
                      <span className={STATUS_COLORS[course.status]}>
                        {course.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {course.submittedOn? new Date(course.submittedOn).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {course.status == "notsubmitted" ? (
                        <Button
                          disabled
                          className="cursor-not-allowed bg-white text-gray-500 opacity-50"
                        >
                          None
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          className="hover:bg-primary hover:text-white"
                          onClick={() =>
                            navigate(`/qp/FacultyReview/${slugify(course.courseCode)}`,{
                              state: { courseCode: course.courseCode, requestId: course.id },
                            })
                          }
                        >
                          {course.status === "review pending"
                            ? "Review"
                            : "Details"}
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
    </div>
  );
};

export default DCAMemberHandouts;
