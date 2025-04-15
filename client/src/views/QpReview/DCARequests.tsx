"use client";
import type React from "react";
import { useState, useEffect } from "react";
import { FilterBar } from "@/components/handouts/filterBar";
import { Button } from "@/components/ui/button";
import CreateRequestDialog, { Course } from "@/components/qp_review/CreateRequest";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { STATUS_COLORS } from "@/components/handouts/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { AssignICDialog } from "@/components/handouts/updateICDialog";
import { AssignDCADialog } from "@/components/handouts/assignDCADialog";
import { useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";


interface HandoutsDCAcon {
  reviewerEmail: string;
  id: string;
  courseName: string;
  courseCode: string;
  category: string;
  reviewerName: string | null;
  professorName: string;
  submittedOn: string;
  status: string;
}

const DCARequestsView = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("pending");
  const [courses, setCourses] = useState<Course[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentCourse, setCurrentCourse ] = useState<Course | null>(null);
  const [finalReviewers, setFinalReviewers] = useState([
    { name: "Prof. BVVSN RAO", email: "bvvsnrao@university.com" },
    { name: "Prof. BhanuMurthy", email: "bhanumurthy@university.com" },
    { name: "Prof. Harish V Dixit", email: "harishdixit@university.com" },
  ]);

  const statusColors: Record<string, string> = {
    pending: "bg-orange-400",
    approved: "bg-green-500",
  };

  const handleFacultyAssignment = async (
    id: string,
    faculty1Email: string | null,
    faculty2Email: string | null
  ) => {
    if (!faculty1Email || !faculty2Email) {
      toast.error("Both reviewers must be selected before submitting.");
      return;
    }

    if (faculty1Email === faculty2Email) {
      toast.error("Reviewers must be different.");
      return;
    }

    try {
      const response = await api.post("/qp/assignFaculty", {
        id,
        faculty1Email,
        faculty2Email,
      });

      if (response.status !== 200) {
        toast.error(response.data.message);
      } else {
        toast.success("Faculty assigned successfully.");
      }
    } catch (err) {
      console.error("Error assigning faculty:", err);
      toast.error("An error occurred while assigning faculty.");
    }
  };

  const handleAddRequest = (newRequest: Course) => {
    setCourses([...courses, newRequest]);
    setIsDialogOpen(false);
  };
  const handleEditRequest = (course: Course) => {
    setCurrentCourse(course);
    setIsEditDialogOpen(true);
  };

  const email = encodeURIComponent("dca@email.com");
  const fetchCourses = async () => {
    try {
      const response = await api.get(`/qp/getAllDCARequests/${email}`);
      if (response.data.success === false) {
        console.log(response);
        toast.error(response.data.message);
        return;
      }
      setCourses(response.data.data);
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast.error("Failed to fetch courses.");
    }
  };

  useEffect(()=>{
    const getFaculty = async () => {
      try {
        const response = await api.get("/handout/dcaconvenor/getAllFaculty");
        console.log(response.data.faculties)
        if (response.status === 200) {
          setFinalReviewers((prev)=>{console.log(prev); return response.data.faculties})
          console.log(finalReviewers)
        } 
      } catch (error) {
        console.error("Error fetching faculties:", error);
      }
    }
    getFaculty();
  },[])

  useEffect(() => {
    fetchCourses();
  }, []);
}

export const DCAConvenerQP: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryFilters, setActiveCategoryFilters] = useState<string[]>(
    []
  );
  const [activeStatusFilters, setActiveStatusFilters] = useState<string[]>([]);
  const [filteredHandouts, setFilteredHandouts] = useState<HandoutsDCAcon[]>(
    []
  );
  const [courses, setCourses] = useState<Course[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isICDialogOpen, setIsICDialogOpen] = useState(false);
  const [isReviewerDialogOpen, setIsReviewerDialogOpen] = useState(false);
  const [currentHandoutId, setCurrentHandoutId] = useState<string | null>(null);
  const [selectedHandouts, setSelectedHandouts] = useState<string[]>([]);
  const [isBulkAssign, setIsBulkAssign] = useState(false);
  const email = encodeURIComponent("dca@email.com");
  const [finalReviewers, setFinalReviewers] = useState([
    { name: "Prof. BVVSN RAO", email: "bvvsnrao@university.com" },
    { name: "Prof. BhanuMurthy", email: "bhanumurthy@university.com" },
    { name: "Prof. Harish V Dixit", email: "harishdixit@university.com" },
  ]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleAddRequest = (newRequest: Course) => {
    setCourses([...courses, newRequest]);
    setIsDialogOpen(false);
  };

  const updateICMutation = useMutation({
    mutationFn: async ({
      id,
      icEmail,
      sendEmail,
    }: {
      id: string;
      icEmail: string;
      sendEmail: boolean;
    }) => {
      const response = await api.post<{ success: boolean }>(
        "/handout/dcaconvenor/updateIC",
        {
          id: id.toString(),
          icEmail,
          sendEmail,
        }
      );
      return response.data;
    },
    onSuccess: async () => {
      toast.success("Instructor updated successfully");
      await queryClient.invalidateQueries({
        queryKey: ["handouts-dca-convenor"],
      });
    },
    onError: () => {
      toast.error("Failed to update instructor");
    },
  });
  const fetchCourses = async () => {
    try {
      const response = await api.get(`/qp/getAllDCARequests/${email}`);
      if (response.data.success === false) {
        console.log(response);
        toast.error(response.data.message);
        return;
      }
      setCourses(response.data.data);
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast.error("Failed to fetch courses.");
    }
  };

  const {
    data: handouts,
    isLoading,
    isError,
  } = useQuery<HandoutsDCAcon[]>({
    queryKey: ["handouts-dca-convenor"],
    queryFn: async () => {
      try {
        const response = await api.get<{
          success: boolean;
          handouts: HandoutsDCAcon[];
        }>("/handout/dcaconvenor/get");
        return response.data.handouts;
      } catch (error) {
        toast.error("Failed to fetch Requests");
        throw error;
      }
    },
  });

  useEffect(()=>{
    const getFaculty = async () => {
      try {
        const response = await api.get("/handout/dcaconvenor/getAllFaculty");
        console.log(response.data.faculties)
        if (response.status === 200) {
          setFinalReviewers((prev)=>{console.log(prev); return response.data.faculties})
          console.log(finalReviewers)
        } 
      } catch (error) {
        console.error("Error fetching faculties:", error);
      }
    }
    getFaculty();
  },[])

  useEffect(() => {
    fetchCourses();
  }, []);
  useEffect(() => {
    if (!handouts) return;

    localStorage.setItem("handouts DCA CONVENOR", JSON.stringify(handouts));

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
  }, [searchQuery, activeCategoryFilters, activeStatusFilters, handouts]);

  const handlePencilClick = (handoutId: string, isReviewer: boolean) => {
    setCurrentHandoutId(handoutId);
    setIsBulkAssign(false);
    if (isReviewer) {
      setIsReviewerDialogOpen(true);
    } else {
      setIsICDialogOpen(true);
    }
  };

  const handleAssignIC = (email: string, sendEmail: boolean) => {
    if (!currentHandoutId) {
      toast.error("No handout selected");
      return;
    }

    updateICMutation.mutate({
      id: currentHandoutId,
      icEmail: email,
      sendEmail,
    });

    setIsICDialogOpen(false);
  };

  const bulkUpdateReviewerMutation = useMutation({
     mutationFn: async ({
      ids,
      reviewerEmail,
      sendEmail,
    }: {
      ids: string[];
      reviewerEmail: string;
      sendEmail: boolean;
    }) => {
      // For each ID, call the updateReviewer endpoint
      const promises = ids.map((id) =>
        api.post<{ success: boolean }>("/handout/dcaconvenor/updateReviewer", {
          id: id.toString(),
          reviewerEmail,
          sendEmail,
        })
      );

      return Promise.all(promises);
    },
    onSuccess: async () => {
      toast.success(
        `Reviewer assigned to ${selectedHandouts.length} handouts successfully`
      );
      await queryClient.invalidateQueries({
        queryKey: ["handouts-dca-convenor"],
      });
      setSelectedHandouts([]);
    },
    onError: () => {
      toast.error("Failed to assign reviewer to some handouts");
    },
  });
  const updateReviewerMutation = useMutation({
    mutationFn: async ({
      id,
      reviewerEmail,
      sendEmail,
    }: {
      id: string;
      reviewerEmail: string;
      sendEmail: boolean;
    }) => {
      const response = await api.post<{ success: boolean }>(
        "/handout/dcaconvenor/updateReviewer",
        {
          id: id.toString(),
          reviewerEmail,
          sendEmail,
        }
      );
      return response.data;
    },
    onSuccess: async () => {
      toast.success("Reviewer assigned successfully");
      await queryClient.invalidateQueries({
        queryKey: ["handouts-dca-convenor"],
      });
    },
    onError: () => {
      toast.error("Failed to assign reviewer");
    },
  });


  const handleAssignReviewer = (email: string, sendEmail: boolean) => {
      if (isBulkAssign) {
        if (selectedHandouts.length === 0) {
          toast.error("No handouts selected");
          return;
        }
  
        bulkUpdateReviewerMutation.mutate({
          ids: selectedHandouts,
          reviewerEmail: email,
          sendEmail,
        });
      } else {
        if (!currentHandoutId) {
          toast.error("No handout selected");
          return;
        }
  
        updateReviewerMutation.mutate({
          id: currentHandoutId,
          reviewerEmail: email,
          sendEmail,
        });
      }
  
      setIsReviewerDialogOpen(false);
    };

  const handleSelectHandout = (handoutId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedHandouts((prev) => [...prev, handoutId]);
    } else {
      setSelectedHandouts((prev) => prev.filter((id) => id !== handoutId));
    }
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      const allIds = filteredHandouts.map((handout) => handout.id);
      setSelectedHandouts(allIds);
    } else {
      setSelectedHandouts([]);
    }
  };

  const handleBulkAssignReviewer = () => {
    if (selectedHandouts.length === 0) {
      toast.error("No handouts selected");
      return;
    }

    setIsBulkAssign(true);
    setIsReviewerDialogOpen(true);
  };

  const isAllSelected =
    filteredHandouts.length > 0 &&
    selectedHandouts.length === filteredHandouts.length;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-screen items-center justify-center text-red-500">
        Error fetching handouts
      </div>
    );
  }

  return (
    <div className="w-full px-4">
      <div className="px-2 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">
              Courses
            </h1>
            <p className="mt-2 text-gray-600">2nd semester 2024-25</p>
            <div className="mt-2 flex gap-2">
              {selectedHandouts.length > 0 && (
                <Button
                  variant="default"
                  className="bg-primary text-white"
                  onClick={() => setIsDialogOpen(true)}
                >
                  Send Request ({selectedHandouts.length})
                </Button> 
              )}
            </div>
          </div>
          <CreateRequestDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onAddRequest={handleAddRequest}
          fetchCourses={fetchCourses}
          fics = {finalReviewers}
          />
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
                <TableHead className="w-12 px-4 py-2">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all handouts"
                  />
                </TableHead>
                <TableHead className="px-4 py-2 text-left">
                  Course Code
                </TableHead>
                <TableHead className="px-4 py-2 text-left">
                  Course Name
                </TableHead>
                <TableHead className="px-4 py-2 text-left">Category</TableHead>
                <TableHead className="px-4 py-2 text-left">
                  Instructor Email
                </TableHead>
                <TableHead className="px-4 py-2 text-left">
                  Reviewer Email
                </TableHead>
                <TableHead className="px-4 py-2 text-left">Status</TableHead>
                <TableHead className="px-4 py-2 text-left">
                  Request Sent
                </TableHead>
                <TableHead className="px-4 py-2 text-left">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-300">
              {filteredHandouts.length ? (
                filteredHandouts.map((handout) => (
                  <TableRow
                    key={handout.id}
                    className="odd:bg-white even:bg-gray-100"
                  >
                    <TableCell className="w-12 px-4 py-2">
                      <Checkbox
                        checked={selectedHandouts.includes(handout.id)}
                        onCheckedChange={(checked) =>
                          handleSelectHandout(handout.id, !!checked)
                        }
                        aria-label={`Select ${handout.courseName}`}
                      />
                    </TableCell>
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
                      <div className="flex items-center">
                        <span>{handout.professorName}</span>
                        <button
                          onClick={() => handlePencilClick(handout.id, false)}
                          className="ml-2 text-gray-500 hover:text-primary"
                        >
                          <Pencil size={16} />
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center">
                        <span>
                          {handout.reviewerName || "No reviewer assigned"}
                        </span>
                        <button
                          onClick={() => handlePencilClick(handout.id, true)}
                          className="ml-2 text-gray-500 hover:text-primary">
                          <Pencil size={16} />
                        </button>
                     </div>
                    </TableCell>                    
                    <TableCell className="px-4 py-2 uppercase">
                      <span className={STATUS_COLORS[handout.status]}>
                        {handout.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {handout.submittedOn
                        ? new Date(handout.submittedOn).toLocaleDateString()
                        : "NA"}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {handout.status != "notsubmitted" ? (
                        <Button
                          variant="outline"
                          className="hover:bg-primary hover:text-white"
                          onClick={() =>
                            navigate(
                              `/handout/dcaconvenor/review/${handout.id}`
                            )
                          }
                        >
                          {handout.status === "reviewed" ? "Review" : "View"}
                        </Button>
                      ) : (
                        <Button
                          disabled
                          className="cursor-not-allowed bg-white text-gray-500 opacity-50"
                        >
                          None
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="px-4 py-2 text-center">
                    No Requests found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AssignICDialog
        isOpen={isICDialogOpen}
        setIsOpen={setIsICDialogOpen}
        onAssign={handleAssignIC}
      />
      <AssignDCADialog
        isOpen={isReviewerDialogOpen}
        setIsOpen={setIsReviewerDialogOpen}
        onAssign={handleAssignReviewer}
        isBulkAssign={isBulkAssign}
        selectedCount={selectedHandouts.length}
      />
    </div>
    
  );
};

export default DCAConvenerQP;
