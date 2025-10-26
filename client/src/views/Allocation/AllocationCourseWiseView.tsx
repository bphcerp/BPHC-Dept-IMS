import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import api from "@/lib/axios-instance";
import { LoadingSpinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { allocationTypes, allocationSchemas } from "lib";
import CoursesColumn from "@/components/Allocation/CoursesColumn";
import SectionTypeColumn from "@/components/Allocation/SectionTypeColumn";
import AllocationHeader from "@/components/Allocation/AllocationHeader";
import AssignInstructorDialog from "@/components/Allocation/AssignInstructorDialog";
import { Button } from "@/components/ui/button";

const AllocationCourseWiseView = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCourse, setSelectedCourse] =
    useState<allocationTypes.Course | null>(null);

  // Dialog state for assign instructor
  const [isAssignInstructorDialogOpen, setIsAssignInstructorDialogOpen] =
    useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [userTypeViewMode, setUserTypeViewMode] = useState<"faculty" | "phd">(
    "faculty"
  );

  const queryClient = useQueryClient();

  const {
    data: currentSemester,
    isLoading: semesterLoading,
    isError: semesterError,
  } = useQuery({
    queryKey: ["semester", "latest-full"],
    queryFn: async () => {
      const response = await api.get<allocationTypes.Semester>(
        "/allocation/semester/getLatest"
      );
      return response.data;
    },
    onError: () => {
      toast.error("Failed to fetch current semester");
    },
  });

  const {
    data: courses = [],
    isLoading: coursesLoading,
    isError: coursesError,
  } = useQuery({
    queryKey: ["allocation", "courses"],
    queryFn: async () => {
      const response = await api.get<allocationTypes.Course[]>(
        "/allocation/course/get"
      );
      return response.data;
    },
    enabled: !!currentSemester,
    onError: () => {
      toast.error("Failed to fetch courses");
    },
  });

  useEffect(() => {
    const courseCode = searchParams.get("course");
    if (courseCode && courses.length > 0 && !selectedCourse) {
      const courseFromUrl = courses.find(
        (course) => course.code === courseCode
      );
      if (courseFromUrl) {
        setSelectedCourse(courseFromUrl);
      }
    }
  }, [searchParams, courses, selectedCourse]);

  const {
    data: allocationData,
    isLoading: allocationLoading,
  } = useQuery({
    queryKey: ["allocation", selectedCourse?.code, currentSemester?.id],
    queryFn: async () => {
      if (!selectedCourse || !currentSemester) return null;
      const response = await api.get<allocationTypes.AllocationResponse>(
        "/allocation/allocation/get",
        {
          params: {
            code: selectedCourse.code,
            semesterId: currentSemester.id,
          },
        }
      );
      return response.data;
    },
    enabled: !!selectedCourse && !!currentSemester,
  });

  // Handle deep link support for assign instructor dialog
  useEffect(() => {
    const sectionId = searchParams.get("assignSection");
    if (sectionId && allocationData?.sections) {
      const section = allocationData.sections.find((s) => s.id === sectionId);
      if (section) {
        setSelectedSectionId(sectionId);
        setIsAssignInstructorDialogOpen(true);
      }
    }
  }, [searchParams, allocationData]);

  // Assign instructor mutation
  const assignInstructorMutation = useMutation({
    mutationFn: async (data: {
      sectionId: string;
      instructorEmail: string;
    }) => {
      await api.put("/allocation/allocation/section/assignInstructor", data);
    },
    onSuccess: () => {
      toast.success("Instructor assigned successfully");
      void queryClient.invalidateQueries({
        queryKey: ["allocation"],
      });
      setIsAssignInstructorDialogOpen(false);
      setSelectedSectionId("");
    },
    onError: (error) => {
      toast.error(
        (error as { response: { data: string } })?.response?.data ||
          "Failed to assign instructor"
      );
    },
  });

  const handleCourseSelect = (course: allocationTypes.Course | null) => {
    setSelectedCourse(course);
    if (course) {
      setSearchParams({ course: course.code });
    } else {
      setSearchParams({});
    }
  };

  const handleAssignInstructor = (instructorEmail: string) => {
    if (selectedSectionId) {
      assignInstructorMutation.mutate({
        sectionId: selectedSectionId,
        instructorEmail,
      });
    }
  };

  const handleOpenAssignDialog = (sectionId: string) => {
    setSelectedSectionId(sectionId);
    setIsAssignInstructorDialogOpen(true);

    const newParams = new URLSearchParams(searchParams);
    newParams.set("assignSection", sectionId);
    setSearchParams(newParams);
  };

  const handleCloseAssignDialog = (open: boolean) => {
    setIsAssignInstructorDialogOpen(open);
    if (!open) {
      setSelectedSectionId("");
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("assignSection");
      setSearchParams(newParams);
    }
  };

  const handleCreateAllocation = async () => {
    await queryClient.invalidateQueries(["allocation"])
  };

  if (semesterLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (semesterError || !currentSemester) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-lg font-semibold text-destructive">
            Failed to Load Semester
          </h2>
          <p className="text-muted-foreground">
            Unable to fetch the current semester information.
          </p>
        </div>
      </div>
    );
  }

  if (coursesError) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-lg font-semibold text-destructive">
            Failed to Load Courses
          </h2>
          <p className="text-muted-foreground">
            Unable to fetch courses for allocation.
          </p>
        </div>
      </div>
    );
  }

  if (!currentSemester.form) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-lg font-semibold text-destructive">
            Semester Form Not Linked
          </h2>
          <p className="text-muted-foreground">
            Please link a form to the ongoing semester
          </p>
        </div>
      </div>
    );
  }

  if (!currentSemester.form.publishedDate) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-lg font-semibold text-destructive">
            Semester Form Not Published
          </h2>
          <p className="text-muted-foreground">
            Please publish this semester's form
          </p>
        </div>
      </div>
    );
  }

  if (
    currentSemester.form.formDeadline &&
    new Date(currentSemester.form.formDeadline) > new Date()
  ) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-lg font-semibold text-destructive">
            Semester's Form Is Still Active
          </h2>
          <p className="text-muted-foreground">
            This page will be active once all the required responses are
            collected.
          </p>
        </div>
      </div>
    );
  }

  const getCourseValidSections = () =>
    allocationSchemas.sectionTypes.filter((type) =>
      type === "PRACTICAL"
        ? selectedCourse?.practicalUnits
        : type === "TUTORIAL"
          ? selectedCourse?.offeredAs === "CDC" &&
            selectedCourse?.offeredTo === "FD"
          : type === "LECTURE"
            ? userTypeViewMode === "faculty"
            : true
    );

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-background p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Course Load Allocation</h1>
            <p className="text-muted-foreground">
              Allocate sections and instructors to courses
            </p>
          </div>
          {currentSemester && (
            <div className="flex space-x-2">
              {semesterLoading ||
                allocationLoading ||
                (coursesLoading && <LoadingSpinner />)}
              <div className="flex items-center space-x-2">
                <div className="mr-2 text-sm text-muted-foreground">View:</div>
                <Button
                  variant={userTypeViewMode === "faculty" ? "default" : "ghost"}
                  onClick={() => setUserTypeViewMode("faculty")}
                  className="!px-3"
                >
                  Faculty
                </Button>
                <Button
                  variant={userTypeViewMode === "phd" ? "default" : "ghost"}
                  onClick={() => setUserTypeViewMode("phd")}
                  className="!px-3"
                >
                  PhD
                </Button>
              </div>

              <Button variant="link">
                <Link to="/allocation/summary">View Current Allocation</Link>
              </Button>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">
                  Current Semester
                </div>
                <div className="font-semibold">
                  {currentSemester.year} Semester {currentSemester.semesterType}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content - Columns */}
      <div className="flex flex-1 overflow-hidden">
        {/* Courses Column */}
        <div className="w-80 flex-shrink-0 border-r bg-muted/30">
          <CoursesColumn
            courses={courses}
            isLoading={coursesLoading}
            selectedCourse={selectedCourse}
            onCourseSelect={handleCourseSelect}
          />
        </div>

        {/* Dynamic Section Type Columns - only show when course is selected */}
        {selectedCourse ? (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Allocation Header with Course Code and IC Selection */}
            <AllocationHeader
              selectedCourse={selectedCourse}
              semesterId={currentSemester.id}
              allocationData={allocationData || null}
              onAllocationChange={handleCreateAllocation}
              userTypeViewMode={userTypeViewMode}
            />

            {/* Section Type Columns - only show when allocation exists */}
            {allocationData ? (
              <div className="flex flex-1 overflow-hidden">
                {getCourseValidSections().map((sectionType) => (
                  <SectionTypeColumn
                    key={sectionType}
                    sectionType={sectionType}
                    allocationData={allocationData}
                    isLoading={allocationLoading}
                    onAssignInstructor={handleOpenAssignDialog}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center bg-muted/20">
                <div className="text-center text-muted-foreground">
                  {getCourseValidSections().length ? (
                    <>
                      <h3 className="mb-2 text-lg font-medium">
                        Begin Allocation
                      </h3>
                      <p className="text-sm">
                        Click on "Begin Allocation" to start the allocation for{" "}
                        <span className="font-medium">
                          {selectedCourse.code}
                        </span>
                      </p>
                    </>
                  ) : (
                    <>
                      <h3 className="mb-2 text-lg font-medium">
                        No sections available
                      </h3>
                      <p className="text-sm">
                        No Sections are available to allocate
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center bg-muted/20">
            <div className="text-center text-muted-foreground">
              <h3 className="mb-2 text-lg font-medium">Select a Course</h3>
              <p className="text-sm">
                Choose a course from the left panel to view and manage
                allocations
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Assign Instructor Dialog */}
      <AssignInstructorDialog
        isOpen={isAssignInstructorDialogOpen}
        onOpenChange={handleCloseAssignDialog}
        selectedSectionId={selectedSectionId}
        courseCode={selectedCourse?.code}
        allocationData={allocationData || null}
        onAssignInstructor={handleAssignInstructor}
        isAssigning={assignInstructorMutation.isLoading}
        userTypeViewMode={userTypeViewMode}
      />
    </div>
  );
};

export default AllocationCourseWiseView;
