import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import api from "@/lib/axios-instance";
import { LoadingSpinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { allocationTypes, allocationSchemas } from "lib";
import CoursesColumn from "@/components/Allocation/CoursesColumn";
import SectionTypeColumn from "@/components/Allocation/SectionTypeColumn";
import AllocationHeader from "@/components/Allocation/AllocationHeader";

const Allocation = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentSemester, setCurrentSemester] =
    useState<allocationTypes.Semester | null>(null);
  const [selectedCourse, setSelectedCourse] =
    useState<allocationTypes.Course | null>(null);

  const { isLoading: semesterLoading, isError: semesterError } = useQuery({
    queryKey: ["allocation", "semester", "latest"],
    queryFn: async () => {
      const response = await api.get<allocationTypes.Semester>(
        "/allocation/semester/getLatest"
      );
      return response.data;
    },
    onSuccess: (data) => {
      setCurrentSemester(data);
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

  const handleCourseSelect = (course: allocationTypes.Course | null) => {
    setSelectedCourse(course);

    if (course) {
      setSearchParams({ course: course.code });
    } else {
      setSearchParams({});
    }
  };

  const {
    data: allocationData,
    isLoading: allocationLoading,
    refetch: refetchAllocation,
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

  const handleCreateAllocation = () => {
    void refetchAllocation();
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
            <div className="text-right">
              <div className="text-sm text-muted-foreground">
                Current Semester
              </div>
              <div className="font-semibold">
                {currentSemester.year} Semester {currentSemester.semesterType}
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
            semesterId={currentSemester.id}
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
            />

            {/* Section Type Columns - only show when allocation exists */}
            {allocationData ? (
              <div className="flex flex-1 overflow-hidden">
                {allocationSchemas.sectionTypes.map((sectionType) => (
                  <SectionTypeColumn
                    key={sectionType}
                    sectionType={sectionType}
                    selectedCourse={selectedCourse}
                    allocationData={allocationData}
                    isLoading={allocationLoading}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center bg-muted/20">
                <div className="text-center text-muted-foreground">
                  <div className="mb-4 text-6xl">📋</div>
                  <h3 className="mb-2 text-lg font-medium">
                    Create Allocation
                  </h3>
                  <p className="text-sm">
                    Select an Instructor in Charge from the header to create
                    allocation for{" "}
                    <span className="font-medium">{selectedCourse.code}</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center bg-muted/20">
            <div className="text-center text-muted-foreground">
              <div className="mb-4 text-6xl">🎯</div>
              <h3 className="mb-2 text-lg font-medium">Select a Course</h3>
              <p className="text-sm">
                Choose a course from the left panel to view and manage
                allocations
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Allocation;
