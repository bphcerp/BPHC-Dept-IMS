"use client";
import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { toast } from "sonner";
import { Pencil, Mail, Download } from "lucide-react";
import { AssignICDialog } from "@/components/qp_review/updateICDialog";
import { AssignDCADialog } from "@/components/qp_review/assignDCADialog";
import { CreateRequestDialog } from "@/components/qp_review/createRequestDialog";
import SendReminderDialog from "@/components/qp_review/SendRemindersDialog";
import { QpFilterBar } from "@/components/qp_review/qpFilterBar";
import { useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";

const STATUS_COLORS: Record<string, string> = {
  "review pending": "text-yellow-600 bg-yellow-100 p-3",
  reviewed: "text-green-600 bg-green-100 p-3",
  notsubmitted: "text-red-600 bg-red-100 p-3 ",
};

interface QPDCAcon {
  reviewerEmail: string;
  id: string;
  courseName: string;
  icEmail: string | null;
  courseCode: string;
  category: string;
  requestType: string;
  reviewerName: string | null;
  professorName: string;
  submittedOn: string;
  status: string;
}

interface CreateRequestData {
  icEmail: string;
  courseName: string;
  courseCode: string;
  requestType: ("Mid Sem" | "Comprehensive" | "Both")[];
  category: "HD" | "FD";
}

export const DCAConvenercourses: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryFilters, setActiveCategoryFilters] = useState<string[]>([]);
  const [activeStatusFilters, setActiveStatusFilters] = useState<string[]>([]);
  const [activeRequestTypeFilters, setActiveRequestTypeFilters] = useState<string[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<QPDCAcon[]>([]);

  const [isICDialogOpen, setIsICDialogOpen] = useState(false);
  const [isReviewerDialogOpen, setIsReviewerDialogOpen] = useState(false);
  const [isCreateRequestDialogOpen, setIsCreateRequestDialogOpen] = useState(false);
  const [currentcourseId, setCurrentcourseId] = useState<string | null>(null);
  const [selectedcourses, setSelectedcourses] = useState<string[]>([]);
  const [isBulkAssign, setIsBulkAssign] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ... (keep all existing mutations - updateICMutation, updateReviewerMutation, etc.)
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
      const response = await api.post<{ success: boolean }>("/qp/updateIc", {
        id: id.toString(),
        icEmail,
        sendEmail,
      });
      return response.data;
    },
    onSuccess: async () => {
      toast.success("Instructor updated successfully");
      await queryClient.invalidateQueries({
        queryKey: ["*"],
      });
    },
    onError: () => {
      toast.error("Failed to update instructor");
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
      console.log("Updating reviewer:", { id, reviewerEmail, sendEmail });
      const response = await api.post<{ success: boolean }>(
        "/qp/assignFaculty",
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
        queryKey: ["*"],
      });
    },
    onError: () => {
      toast.error("Failed to assign reviewer");
    },
  });

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
      const promises = ids.map((id) =>
        api.post<{ success: boolean }>("/qp/updateFaculty", {
          id: id.toString(),
          reviewerEmail,
          sendEmail,
        })
      );

      return Promise.all(promises);
    },
    onSuccess: async () => {
      toast.success(
        `Reviewer assigned to ${selectedcourses.length} courses successfully`
      );
      await queryClient.invalidateQueries({
        queryKey: ["*"],
      });
      setSelectedcourses([]);
    },
    onError: () => {
      toast.error("Failed to assign reviewer to some courses");
    },
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data: CreateRequestData) => {
      const response = await api.post<{ success: boolean }>(
        "/qp/createRequest",
        {
          icEmail: data.icEmail,
          courseName: data.courseName,
          courseCode: data.courseCode,
          requestType: data.requestType,
          category: data.category,
        }
      );
      return response.data;
    },
    onSuccess: async () => {
      toast.success("Request created successfully");
      await queryClient.invalidateQueries({
        queryKey: ["*"],
      });
    },
    onError: () => {
      toast.error("Failed to create request");
    },
  });

  const sendRemindersMutation = useMutation({
    mutationFn: async (reminderData: {
      selectedCourseIds: string[];
      recipientCount: number;
      courses: Array<{
        id: string;
        courseName: string;
        courseCode: string;
        icEmail: string | null;
        reviewerEmail: string;
        reviewerName: string | null;
        status: string;
        requestType: string;
      }>;
    }) => {
      const response = await api.post<{ success: boolean }>(
        "/qp/sendReminders",
        reminderData
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      toast.success(`Email reminders sent successfully to ${variables.recipientCount} recipients`);
    },
    onError: (error) => {
      console.error("Send reminders error:", error);
      toast.error("Failed to send email reminders");
    },
  });

  const {
    data: courses,
    isLoading,
    isError,
  } = useQuery<QPDCAcon[]>({
    queryKey: ["*"],
    queryFn: async () => {
      try {
        const response = await api.get<{
          success: boolean;
          courses: QPDCAcon[];
        }>("/qp/getAllCourses");
        return response.data.courses;
      } catch (error) {
        toast.error("Failed to fetch courses");
        throw error;
      }
    },
  });

  useEffect(() => {
    if (!courses) return;

    localStorage.setItem("QP DCA CONVENOR", JSON.stringify(courses));

    let results = courses;

    // Search filter
    if (searchQuery) {
      results = results.filter(
        (course) =>
          course.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.courseCode.toLowerCase().includes(searchQuery.toLowerCase())
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
          ? activeRequestTypeFilters.includes(course.requestType)
          : true;

      return matchesCategory && matchesStatus && matchesRequestType;
    });

    setFilteredCourses(results);
  }, [
    searchQuery,
    activeCategoryFilters,
    activeStatusFilters,
    activeRequestTypeFilters,
    courses,
  ]);

  // ... (keep all existing handler functions)
  const handlePencilClick = (courseId: string, isReviewer: boolean) => {
    setCurrentcourseId(courseId);
    setIsBulkAssign(false);
    if (isReviewer) {
      setIsReviewerDialogOpen(true);
    } else {
      setIsICDialogOpen(true);
    }
  };

  const handleAssignIC = (email: string, sendEmail: boolean) => {
    if (!currentcourseId) {
      toast.error("No course selected");
      return;
    }

    updateICMutation.mutate({
      id: currentcourseId,
      icEmail: email,
      sendEmail,
    });

    setIsICDialogOpen(false);
  };

  const handleAssignReviewer = (email: string, sendEmail: boolean) => {
    if (isBulkAssign) {
      if (selectedcourses.length === 0) {
        toast.error("No courses selected");
        return;
      }

      bulkUpdateReviewerMutation.mutate({
        ids: selectedcourses,
        reviewerEmail: email,
        sendEmail,
      });
    } else {
      if (!currentcourseId) {
        toast.error("No course selected");  
        return;
      }

      updateReviewerMutation.mutate({
        id: currentcourseId,
        reviewerEmail: email,
        sendEmail,
      });
    }

    setIsReviewerDialogOpen(false);
  };

  const handleCreateRequest = (data: CreateRequestData) => {
    createRequestMutation.mutate(data);
  };

  const handleSendReminders = async () => {
    const selectedCoursesData = filteredCourses.filter(course => 
      selectedcourses.includes(course.id)
    );
    
    const validCourses = selectedCoursesData.filter(course => {
      if (course.status === 'notsubmitted') {
        return course.icEmail;
      }
      if (course.status === 'review pending') {
        return course.reviewerEmail;
      }
      return false;
    });
    
    const reminderData = {
      selectedCourseIds: selectedcourses,
      recipientCount: validCourses.length,
      courses: validCourses.map(course => ({
        id: course.id,
        courseName: course.courseName,
        icEmail: course.icEmail,
        courseCode: course.courseCode,
        reviewerEmail: course.reviewerEmail,
        reviewerName: course.reviewerName,
        status: course.status,
        requestType: course.requestType
      }))
    };
    
    sendRemindersMutation.mutate(reminderData);
  };

  // UPDATED: Enhanced download function for ZIP/PDF handling
  const handleDownloadReviews = async () => {
    const selectedCoursesData = filteredCourses.filter(course => 
      selectedcourses.includes(course.id)
    );

    // Filter only reviewed courses
    const reviewedCourses = selectedCoursesData.filter(course => 
      course.status === 'reviewed'
    );

    if (reviewedCourses.length === 0) {
      toast.warning("No completed reviews found in selected courses");
      return;
    }

    console.log("Downloading reviews for courses:", reviewedCourses);
    setIsDownloading(true);

    try {
      // Show appropriate loading message
      const loadingMessage = reviewedCourses.length === 1 
        ? "Generating PDF report..." 
        : `Creating ZIP with ${reviewedCourses.length} individual PDF reports...`;
      
      toast.loading(loadingMessage, { id: "pdf-generation" });

      // Make API call with proper configuration
      const response = await api.post('/qp/downloadReviewPdf', reviewedCourses, {
        responseType: 'blob',
        headers: {
          'Content-Type': 'application/json',
          'Accept': reviewedCourses.length === 1 ? 'application/pdf' : 'application/zip'
        },
        timeout: 90000 // 1.5 minutes for zip generation
      });

      console.log("File response received:", response);

      // Dismiss loading toast
      toast.dismiss("pdf-generation");

      // Determine file type and create appropriate blob
      const isZip = reviewedCourses.length > 1;
      const mimeType = isZip ? 'application/zip' : 'application/pdf';
      const fileExtension = isZip ? 'zip' : 'pdf';
      
      const blob = new Blob([response.data], { type: mimeType });

      // Create download URL
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate appropriate filename
      const timestamp = new Date().toISOString().split('T')[0];
      let filename: string;
      
      if (reviewedCourses.length === 1) {
        const course = reviewedCourses[0];
        const cleanCourseName = course.courseName.replace(/[^a-zA-Z0-9]/g, '_');
        filename = `${course.courseCode}-${cleanCourseName}-Review.${fileExtension}`;
      } else {
        filename = `reviews-${reviewedCourses.length}-courses-${timestamp}.${fileExtension}`;
      }
      
      link.download = filename;
      link.style.display = 'none';

      // Download the file
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Success feedback
      const successMessage = reviewedCourses.length === 1
        ? `Successfully downloaded review PDF for ${reviewedCourses[0].courseCode}`
        : `Successfully downloaded ZIP containing ${reviewedCourses.length} individual review PDFs`;
      
      toast.success(successMessage, { duration: 5000 });

      // Clear selection after successful download
      setSelectedcourses([]);

    } catch (error) {
      console.error("Download reviews error:", error);
      
      // Dismiss loading toast
      toast.dismiss("pdf-generation");
      
      // Handle errors with specific messages
      if (error.response) {
        const status = error.response.status;
        if (status === 400) {
          toast.error("Invalid request data. Please check selected courses and try again.");
        } else if (status === 500) {
          toast.error("Server error occurred while generating files. Please try again later.");
        } else if (status === 413) {
          toast.error("Request too large. Try selecting fewer courses.");
        } else {
          toast.error(`Failed to download files (HTTP ${status}). Please contact support.`);
        }
      } else if (error.request) {
        toast.error("Network error. Please check your internet connection and try again.");
      } else if (error.code === 'ECONNABORTED') {
        toast.error("Request timed out. The file generation is taking too long. Try selecting fewer courses.");
      } else {
        toast.error("Failed to download files. Please try again or contact support.");
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSelectcourse = (courseId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedcourses((prev) => [...prev, courseId]);
    } else {
      setSelectedcourses((prev) => prev.filter((id) => id !== courseId));
    }
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      const allIds = filteredCourses.map((course) => course.id);
      setSelectedcourses(allIds);
    } else {
      setSelectedcourses([]);
    }
  };

  const handleBulkAssignReviewer = () => {
    if (selectedcourses.length === 0) {
      toast.error("No courses selected");
      return;
    }

    setIsBulkAssign(true);
    setIsReviewerDialogOpen(true);
  };

  // Calculate recipients
  const recipientCount = filteredCourses.filter(course => {
    if (!selectedcourses.includes(course.id)) return false;
    
    if (course.status === 'notsubmitted') {
      return course.icEmail;
    }
    
    if (course.status === 'review pending') {
      return course.reviewerEmail;
    }
    
    return false;
  }).length;

  // Calculate reviewable courses count
  const reviewableCoursesCount = filteredCourses.filter(course =>
    selectedcourses.includes(course.id) && course.status === 'reviewed'
  ).length;

  const isAllSelected =
    filteredCourses.length > 0 &&
    selectedcourses.length === filteredCourses.length;

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
        Error fetching courses
      </div>
    );
  }

  return (
    <div className="w-full px-4">
      <div className="px-2 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">
              DCA Convenor - All Courses
            </h1>
            <p className="mt-2 text-gray-600">2nd semester 2024-25</p>
            <div className="mt-2 flex gap-2">
              <Button
                variant="default"
                className="bg-primary text-white"
                onClick={() => setIsCreateRequestDialogOpen(true)}
              >
                Create Request
              </Button>
              {selectedcourses.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    className="bg-primary text-white"
                    onClick={handleBulkAssignReviewer}
                  >
                    Assign Reviewer ({selectedcourses.length})
                  </Button>

                  <SendReminderDialog
                    trigger={
                      <Button 
                        className="flex items-center gap-2"
                        disabled={sendRemindersMutation.isPending}
                      >
                        <Mail className="h-4 w-4" />
                        {sendRemindersMutation.isPending 
                          ? `Sending... (${selectedcourses.length})`
                          : `Send Reminders (${selectedcourses.length})`
                        }
                      </Button>
                    }
                    onConfirm={handleSendReminders}
                    recipientCount={recipientCount}
                    disabled={recipientCount === 0 || sendRemindersMutation.isPending}
                  />

                  {/* UPDATED: Enhanced download button */}
                  <Button 
                    onClick={handleDownloadReviews}
                    className="flex items-center gap-2"
                    variant={reviewableCoursesCount > 0 ? "default" : "outline"}
                    disabled={isDownloading || reviewableCoursesCount === 0}
                  >
                    <Download className={`h-4 w-4 ${isDownloading ? 'animate-spin' : ''}`} />
                    {isDownloading 
                      ? (reviewableCoursesCount === 1 ? "Generating PDF..." : "Creating ZIP...")
                      : (reviewableCoursesCount === 1 
                          ? `Download PDF (1)` 
                          : `Download ZIP (${selectedcourses.length})`)
                    }
                    {reviewableCoursesCount > 0 && !isDownloading && (
                      <span className="ml-1 text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                        {reviewableCoursesCount === 1 ? "1 PDF" : `${reviewableCoursesCount} PDFs`}
                      </span>
                    )}
                  </Button>
                </div>
              )}
            </div>
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
                <TableHead className="w-12 px-4 py-2">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all courses"
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
                  Request Type
                </TableHead>
                <TableHead className="px-4 py-2 text-left">
                  Instructor Email
                </TableHead>
                <TableHead className="px-4 py-2 text-left">
                  Reviewer Email
                </TableHead>
                <TableHead className="px-4 py-2 text-left">Status</TableHead>
                <TableHead className="px-4 py-2 text-left">
                  Submitted On
                </TableHead>
                <TableHead className="px-4 py-2 text-left">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-300">
              {filteredCourses.length ? (
                filteredCourses.map((course) => (
                  <TableRow
                    key={course.id}
                    className="odd:bg-white even:bg-gray-100"
                  >
                    <TableCell className="w-12 px-4 py-2">
                      <Checkbox
                        checked={selectedcourses.includes(course.id)}
                        onCheckedChange={(checked) =>
                          handleSelectcourse(course.id, !!checked)
                        }
                        aria-label={`Select ${course.courseName}`}
                      />
                    </TableCell>
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
                      {course.requestType}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center">
                        <span>{course.professorName}</span>
                        <button
                          onClick={() => handlePencilClick(course.id, false)}
                          className="ml-2 text-gray-500 hover:text-primary"
                        >
                          <Pencil size={16} />
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center">
                        <span>
                          {course.reviewerName || "No reviewer assigned"}
                        </span>
                        <button
                          onClick={() => handlePencilClick(course.id, true)}
                          className="ml-2 text-gray-500 hover:text-primary"
                        >
                          <Pencil size={16} />
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2 uppercase">
                      <span
                        className={`text-ellipsis whitespace-nowrap ${STATUS_COLORS[course.status]}`}
                      >
                        {course.status === "notsubmitted"
                          ? "NOT SUBMITTED"
                          : course.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {course.submittedOn
                        ? new Date(course.submittedOn).toLocaleDateString()
                        : "NA"}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {course.status == "reviewed" ? (
                        <Button
                          variant="outline"
                          className="hover:bg-primary hover:text-white"
                          onClick={() =>
                            navigate(
                              `/qpReview/dcarequests/seeReview/${course.id}`
                            )
                          }
                        >
                          View Review
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
                  <TableCell colSpan={10} className="px-4 py-2 text-center">
                    No courses found
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
        selectedCount={selectedcourses.length}
      />

      <CreateRequestDialog
        isOpen={isCreateRequestDialogOpen}
        setIsOpen={setIsCreateRequestDialogOpen}
        onSubmit={handleCreateRequest}
        isLoading={createRequestMutation.isPending}
      />
    </div>
  );
};

export default DCAConvenercourses;
