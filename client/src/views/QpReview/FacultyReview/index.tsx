"use client";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import ToSubmit from "@/components/qp_review/ToSubmit";
import Submitted from "@/components/qp_review/Submitted";
import api from "@/lib/axios-instance";
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
import { Handout } from "@/components/handouts/types";
import { UploadDialog } from "@/components/handouts/UploadDialog";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CourseItem from "@/components/qp_review/CourseItem";
/*
export default function ReviewPage() {
  const [pendingCourses, setPendingCourses] = useState<Course[]>([]);
  const [reviewedCourses, setReviewedCourses] = useState<Course[]>([]);
  const facultyEmail = "harishdixit@university.com";

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await api.get(
          `/qp/getAllFacultyRequests/${encodeURIComponent(facultyEmail)}`
        );

        const data = response.data

        console.log(data)

        if (data.success) {
          const pending = data.data.filter(
            (req: any) => req.status === "pending"
          );
          const reviewed = data.data.filter(
            (req: any) => req.status === "approved"
          );

          setPendingCourses(
            pending.map((req: any) => ({
              id: req.id,
              code: req.code,
              DCA: `${req.DCA}`,
              role: `${req.role}`,
              timeLeft: req.timeLeft || "N/A",
              status: req.status,
            }))
          );

          setReviewedCourses(
            reviewed.map((req: any) => ({
              id:req.id,
              code: req.courseCode,
              DCA: ` ${req.dcaName}`,
              role: ` ${req.ficName}`,
              timeLeft: req.deadline || "Approved",
              status: req.status,
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching faculty requests:", error);
      }
    };

    fetchRequests();
  }, []);
*/

export const FicSubmission: React.FC = () => {
  const [filteredHandouts, setFilteredHandouts] = useState<Handout[]>();
  const navigate = useNavigate();
  const {
    data: handouts,
    isLoading,
    isError,
    refetch,
  } = useQuery<Handout[]>({
    queryKey: ["handouts-faculty"],
    queryFn: async () => {
      try {
        const response = await api.get<{ data: Handout[] }>(
          "/handout/faculty/get"
        );
        if (response.data.data) setFilteredHandouts(response.data.data);
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
    if (handouts) {
      let results = handouts;
      if (searchQuery) {
        results = results.filter(
          (handout) =>
            handout.courseName
              .toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
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
    }
  }, [searchQuery, activeCategoryFilters, activeStatusFilters, handouts]);

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
              Faculty Review
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
                  Request Sent
                </TableHead>
                <TableHead className="px-4 py-2 text-left">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-300">
              {filteredHandouts?.length ? (
                filteredHandouts.map((handout) => (
                  <TableRow
                    key={handout.id}
                    className="odd:bg-white even:bg-gray-100"
                  >
                    <TableCell className="px-4 py-2">
                      {handout.courseCode}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {handout.courseName}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {handout.category}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {handout.reviewerName || "Unassigned"}
                    </TableCell>
                    <TableCell className="px-4 py-2 uppercase">
                      <span className={STATUS_COLORS[handout.status]}>
                        {handout.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {!handout.submittedOn ? (
                        <span className="mx-3">NA</span>
                      ) : (
                        new Date(handout.submittedOn).toLocaleDateString()
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {handout.status === "notsubmitted" ? (
                        <Button
                          variant="outline"
                          className="hover:bg-primary hover:text-white"
                          onClick={() => handleUploadClick(handout.id)}
                        >
                          Upload
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          className="hover:bg-primary hover:text-white"
                          onClick={() => navigate(`/handout/${handout.id}`)}
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
                    No Requests found
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
        id={selectedHandoutId!}
        refetch={async () => {
          await refetch();
        }}
      />
    </div>
  );
};
export default FicSubmission;

/*
interface Course {
  id: number;
  code: string;
  DCA: string;
  role: string;
  timeLeft: string;
  status: string;
}

function QPReviewList({
  pendingCourses,
  reviewedCourses,
}: {
  pendingCourses: Course[];
  reviewedCourses: Course[];
}) {
  return (
    <div className="rounded-lg border bg-white shadow-sm w-full">
      <div className="p-6">
        <h2 className="mb-4 text-xl font-semibold">QP To Review</h2>

        <Tabs defaultValue="pending">
          <TabsList className="mb-6 grid w-[200px] grid-cols-2 bg-gray-200">
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-0">
            {pendingCourses.length === 0 && (<p>No Submissions to be reviewed</p>)}
            <div className="space-y-4">
              {pendingCourses.map((course, index) => (
                <CourseItem key={index} course={course} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reviewed" className="mt-0">
            <div className="space-y-4">
              {reviewedCourses.length === 0 && (<p>No Submissions reviewed yet</p>)}
              {reviewedCourses.map((course, index) => (
                <CourseItem key={index} course={course} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
*/