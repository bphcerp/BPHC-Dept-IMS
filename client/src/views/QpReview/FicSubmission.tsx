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
import { UploadDialogBox } from "@/components/qp_review/uploadDialogBox";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { qpSchemas } from "lib";
import { QpFilterBar } from "@/components/qp_review/qpFilterBar";

export const requestTypes = ["Mid Sem", "Comprehensive", "Both"] as const;
type RequestType = typeof requestTypes[number];

type ServerRequestType = "Mid Sem" | "Comprehensive" | "Both";

interface FacultyCourse {
  id: string;
  courseCode: string;
  courseName: string;
  category: "FD" | "HD";
  reviewerName: string;
  submittedOn: string | null;
  status: qpSchemas.QpStatus;
  requestType: ServerRequestType | RequestType;
}

const STATUS_COLORS: Record<string, string> = {
  "review pending": "text-yellow-600 bg-yellow-100 p-3",
  reviewed: "text-green-600 bg-green-100 p-3",
  notsubmitted: "text-red-600 bg-red-100 p-3 ",
};

export const FacultyHandouts: React.FC = () => {
  const navigate = useNavigate();

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryFilters, setActiveCategoryFilters] = useState<string[]>([]);
  const [activeStatusFilters, setActiveStatusFilters] = useState<string[]>([]);
  const [activeRequestTypeFilters, setActiveRequestTypeFilters] = useState<string[]>([]);

  // Dialog states
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedHandoutId, setSelectedHandoutId] = useState<string | null>(null);
  const [uploadContext, setUploadContext] = useState<"mid" | "compre" | "both" | null>(null);

  const {
    data: courses,
    isLoading,
    isError,
    refetch,
  } = useQuery<FacultyCourse[]>({
    queryKey: ["fic-submissions"],
    queryFn: async () => {
      try {
        const response = await api.get<{ data: FacultyCourse[] }>(
          "/qp/getAllFICSubmissions"
        );
        const list = (response.data?.data ?? []).map((c) => ({
          ...c,
          requestType:
            c.requestType === "Mid Sem" ||
            c.requestType === "Comprehensive" ||
            c.requestType === "Both"
              ? (c.requestType as RequestType)
              : "Comprehensive",
        }));
        return list;
      } catch (error) {
        toast.error("Failed to fetch handouts");
        throw error;
      }
    },
  });

  // Use useMemo for filtering logic instead of useMemo with side effects
  const filteredCourses = useMemo(() => {
    if (!courses) return [];

    let results = courses;

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (course) =>
          course.courseName.toLowerCase().includes(q) ||
          course.courseCode.toLowerCase().includes(q)
      );
    }

    // Apply all filters
    results = results.filter((course) => {
      const matchesCategory =
        activeCategoryFilters.length > 0
          ? activeCategoryFilters.includes(course.category)
          : true;
      const matchesStatus =
        activeStatusFilters.length > 0
          ? activeStatusFilters.includes(course.status)
          : true;
      const matchesRequestType =
        activeRequestTypeFilters.length > 0
          ? activeRequestTypeFilters.includes(course.requestType as string)
          : true;

      return matchesCategory && matchesStatus && matchesRequestType;
    });

    return results;
  }, [searchQuery, activeCategoryFilters, activeStatusFilters, activeRequestTypeFilters, courses]);

  const openUploadDialog = (
    handoutId: string,
    ctx: "mid" | "compre" | "both"
  ) => {
    setSelectedHandoutId(handoutId);
    setUploadContext(ctx);
    setIsUploadDialogOpen(true);
  };

  const handleUploadComplete = () => {
    setIsUploadDialogOpen(false);
    setSelectedHandoutId(null);
    setUploadContext(null);
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
            <QpFilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeCategoryFilters={activeCategoryFilters}
              onCategoryFilterChange={setActiveCategoryFilters}
              activeStatusFilters={activeStatusFilters}
              onStatusFilterChange={setActiveStatusFilters}
              activeRequestTypeFilters={activeRequestTypeFilters}
              onRequestTypeFilterChange={setActiveRequestTypeFilters}
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
                <TableHead className="px-4 py-2 text-left">Course Code</TableHead>
                <TableHead className="px-4 py-2 text-left">Course Name</TableHead>
                <TableHead className="px-4 py-2 text-left">Category</TableHead>
                <TableHead className="px-4 py-2 text-left">Reviewer</TableHead>
                <TableHead className="px-4 py-2 text-left">Status</TableHead>
                <TableHead className="px-4 py-2 text-left">Request Type</TableHead>
                <TableHead className="px-4 py-2 text-left">Submitted On</TableHead>
                <TableHead className="px-4 py-2 text-left">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-300">
              {filteredCourses?.length ? (
                filteredCourses.map((course) => {
                  const submitted = course.status !== "notsubmitted";
                  const reqType = course.requestType as RequestType;

                  const renderUploadActions = () => {
                    if (submitted) {
                      return (
                        <Button
                          variant="outline"
                          className="hover:bg-primary hover:text-white"
                          onClick={() => navigate(`/qpReview/ficSubmission/seeReview/${course.id}`)}
                        >
                          Details
                        </Button>
                      );
                    }

                    if (reqType === "Mid Sem") {
                      return (
                        <Button
                          variant="outline"
                          className="hover:bg-primary hover:text-white"
                          onClick={() => openUploadDialog(course.id, "mid")}
                        >
                          Upload Mid Sem
                        </Button>
                      );
                    }
                    if (reqType === "Comprehensive") {
                      return (
                        <Button
                          variant="outline"
                          className="hover:bg-primary hover:text-white"
                          onClick={() => openUploadDialog(course.id, "compre")}
                        >
                          Upload Comprehensive
                        </Button>
                      );
                    }
                    // Both
                    return (
                      <Button
                        variant="outline"
                        className="hover:bg-primary hover:text-white"
                        onClick={() => openUploadDialog(course.id, "both")}
                      >
                        Upload All (Mid + Compre)
                      </Button>
                    );
                  };

                  return (
                    <TableRow key={course.id} className="odd:bg-white even:bg-gray-100">
                      <TableCell className="px-4 py-2">{course.courseCode}</TableCell>
                      <TableCell className="px-4 py-2">{course.courseName}</TableCell>
                      <TableCell className="px-4 py-2">{course.category}</TableCell>
                      <TableCell className="px-4 py-2">
                        {course.reviewerName || "Unassigned"}
                      </TableCell>
                      <TableCell className="px-4 py-2 uppercase">
                        <span className={STATUS_COLORS[course.status]}>
                          {course.status}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-2">{reqType}</TableCell>
                      <TableCell className="px-4 py-2">
                        {!course.submittedOn ? (
                          <span className="mx-3">NA</span>
                        ) : (
                          new Date(course.submittedOn).toLocaleDateString()
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-2">{renderUploadActions()}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="px-4 py-2 text-center">
                    No courses found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <UploadDialogBox
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        onUploadSuccess={handleUploadComplete}
        id={selectedHandoutId!}
        mode={uploadContext ?? undefined}
        refetch={async () => {
          await refetch();
        }}
      />
    </div>
  );
};

export default FacultyHandouts;
