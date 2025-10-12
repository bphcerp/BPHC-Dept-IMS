import React, { useState, useEffect } from "react";
import { allocationTypes, allocationSchemas } from "lib";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoadingSpinner } from "@/components/ui/spinner";
import {
  Search,
  BookOpen,
  GraduationCap,
  Clock,
  FilterIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { Button } from "../ui/button";
import { ReloadIcon } from "@radix-ui/react-icons";

interface CoursesColumnProps {
  courses: allocationTypes.Course[];
  isLoading: boolean;
  selectedCourse: allocationTypes.Course | null;
  onCourseSelect: (course: allocationTypes.Course) => void;
}

const CoursesColumn: React.FC<CoursesColumnProps> = ({
  courses,
  isLoading,
  selectedCourse,
  onCourseSelect,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [degreeFilters, setDegreeFilters] = useState<
    Array<(typeof allocationSchemas.degreeTypes)[number]>
  >([...allocationSchemas.degreeTypes]);

  const [courseTypeFilters, setCourseTypeFilters] = useState<
    Array<(typeof allocationSchemas.courseTypes)[number]>
  >([...allocationSchemas.courseTypes]);

  type AllocationStatus =
    allocationTypes.CourseAllocationStatusResponse[keyof allocationTypes.CourseAllocationStatusResponse];
  const allocationStatusOptions: AllocationStatus[] = [
    "Allocated",
    "Pending",
    "Not Started",
  ];
  const [allocationStatusFilters, setAllocationStatusFilters] = useState<
    AllocationStatus[]
  >([...allocationStatusOptions]);

  const [sortField, setSortField] = useState<"allocation" | "name" | "code">(
    "code"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const { data: allocationStatusData } = useQuery({
    queryKey: ["allocation", "status"],
    queryFn: async () => {
      const response =
        await api.get<allocationTypes.CourseAllocationStatusResponse>(
          "/allocation/allocation/getStatus"
        );
      setSortField("code");
      setSortOrder("asc");
      return response.data;
    },
  });

  const filteredCourses = courses
    .filter(
      (course) =>
        course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((course) => {
      if (!degreeFilters || degreeFilters.length === 0) return false;
      if (!degreeFilters.includes(course.offeredTo)) return false;

      if (!courseTypeFilters || courseTypeFilters.length === 0) return false;
      if (!courseTypeFilters.includes(course.offeredAs)) return false;

      if (!allocationStatusData) return true;
      const status = allocationStatusData[
        course.code
      ] as allocationTypes.CourseAllocationStatusResponse[keyof allocationTypes.CourseAllocationStatusResponse];
      if (!status) return false;
      if (!allocationStatusFilters || allocationStatusFilters.length === 0)
        return false;
      return allocationStatusFilters.includes(status);
    })
    .sort((a, b) => {
      if (sortField === "name") {
        const res = a.name.localeCompare(b.name);
        return sortOrder === "asc" ? res : -res;
      }

      if (sortField === "code") {
        const res = a.code.localeCompare(b.code);
        return sortOrder === "asc" ? res : -res;
      }

      const order = { Allocated: 0, Pending: 1, "Not Started": 2 } as Record<
        string,
        number
      >;
      const sa = allocationStatusData ? allocationStatusData[a.code] : "";
      const sb = allocationStatusData ? allocationStatusData[b.code] : "";
      const oa = order[sa] ?? 3;
      const ob = order[sb] ?? 3;
      const res = oa - ob;
      return sortOrder === "asc" ? res : -res;
    });

  const getCourseTypeColor = (
    courseType: (typeof allocationSchemas.courseTypes)[number]
  ) => {
    switch (courseType) {
      case "CDC":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "Elective":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    }
  };

  const getDegreeTypeColor = (
    degreeType: (typeof allocationSchemas.degreeTypes)[number]
  ) => {
    switch (degreeType) {
      case "FD":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "HD":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    }
  };

  const getAllocationStatusColor = (courseCode: string) => {
    if (!allocationStatusData) return;
    switch (allocationStatusData[courseCode]) {
      case "Allocated":
        return "border-l-success";
      case "Pending":
        return "border-l-yellow-500";
      case "Not Started":
        return "border-l-red-600";
    }
  };

  const handleReset = () => {
    setSearchTerm("");
    setDegreeFilters([...allocationSchemas.degreeTypes]);
    setCourseTypeFilters([...allocationSchemas.courseTypes]);
    setAllocationStatusFilters([...allocationStatusOptions]);
    setSortField("code");
    setSortOrder("asc");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-shrink-0 border-b bg-background p-3">
        <div className="mb-3 flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          <span className="font-medium">
            Courses ({filteredCourses.length})
          </span>
        </div>

        <div className="flex w-full space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-10">
                  <FilterIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Degree</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={degreeFilters.includes("HD")}
                  onCheckedChange={(checked) => {
                    setDegreeFilters((prev) => {
                      const has = prev.includes("HD");
                      if (checked && !has) return [...prev, "HD"];
                      if (!checked && has)
                        return prev.filter((d) => d !== "HD");
                      return prev;
                    });
                  }}
                >
                  HD
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={degreeFilters.includes("FD")}
                  onCheckedChange={(checked) => {
                    setDegreeFilters((prev) => {
                      const has = prev.includes("FD");
                      if (checked && !has) return [...prev, "FD"];
                      if (!checked && has)
                        return prev.filter((d) => d !== "FD");
                      return prev;
                    });
                  }}
                >
                  FD
                </DropdownMenuCheckboxItem>

                <DropdownMenuSeparator />
                <DropdownMenuLabel>Course Type</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={courseTypeFilters.includes("CDC")}
                  onCheckedChange={(checked) => {
                    setCourseTypeFilters((prev) => {
                      const has = prev.includes("CDC");
                      if (checked && !has) return [...prev, "CDC"];
                      if (!checked && has)
                        return prev.filter((d) => d !== "CDC");
                      return prev;
                    });
                  }}
                >
                  CDC
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={courseTypeFilters.includes("Elective")}
                  onCheckedChange={(checked) => {
                    setCourseTypeFilters((prev) => {
                      const has = prev.includes("Elective");
                      if (checked && !has) return [...prev, "Elective"];
                      if (!checked && has)
                        return prev.filter((d) => d !== "Elective");
                      return prev;
                    });
                  }}
                >
                  Elective
                </DropdownMenuCheckboxItem>

                <DropdownMenuSeparator />
                <DropdownMenuLabel>Allocation Status</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={allocationStatusFilters.includes("Allocated")}
                  onCheckedChange={(checked) => {
                    setAllocationStatusFilters((prev) => {
                      const has = prev.includes("Allocated");
                      if (checked && !has) return [...prev, "Allocated"];
                      if (!checked && has)
                        return prev.filter((d) => d !== "Allocated");
                      return prev;
                    });
                  }}
                >
                  Allocated
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={allocationStatusFilters.includes("Pending")}
                  onCheckedChange={(checked) => {
                    setAllocationStatusFilters((prev) => {
                      const has = prev.includes("Pending");
                      if (checked && !has) return [...prev, "Pending"];
                      if (!checked && has)
                        return prev.filter((d) => d !== "Pending");
                      return prev;
                    });
                  }}
                >
                  Pending
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={allocationStatusFilters.includes("Not Started")}
                  onCheckedChange={(checked) => {
                    setAllocationStatusFilters((prev) => {
                      const has = prev.includes("Not Started");
                      if (checked && !has) return [...prev, "Not Started"];
                      if (!checked && has)
                        return prev.filter((d) => d !== "Not Started");
                      return prev;
                    });
                  }}
                >
                  Not Started
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-10">
                  A
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Sort Field</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={sortField}
                  onValueChange={(v) =>
                    setSortField(v as "allocation" | "name" | "code")
                  }
                >
                  <DropdownMenuRadioItem value="allocation">
                    Allocation Status
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="name">
                    Course Name
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="code">
                    Course Code
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Order</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() =>
                    setSortOrder((s) => (s === "asc" ? "desc" : "asc"))
                  }
                >
                  {sortOrder === "asc" ? "Ascending" : "Descending"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="px-3 pb-2 text-xs text-muted-foreground">
                  The default sorting order is HD-CDC, HD-Elective, FD-CDC, and
                  FD-Elective
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            {courseTypeFilters.length !==
              allocationSchemas.courseTypes.length ||
            degreeFilters.length !== allocationSchemas.degreeTypes.length ||
            allocationStatusFilters.length !== allocationStatusOptions.length ||
            searchTerm !== "" ||
            sortField !== "code" ||
            sortOrder !== "asc" ? (
              <Button
                variant="ghost"
                className="w-10"
                onClick={handleReset}
                title="Reset Filters"
              >
                <ReloadIcon />
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Scrollable Course List */}
      <ScrollArea className="flex-1 bg-white">
        <div className="space-y-2 p-3 pr-2">
          {isLoading || !allocationStatusData ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {searchTerm ? "No courses found" : "No courses available"}
            </div>
          ) : (
            filteredCourses.map((course) => (
              <Card
                key={course.code}
                className={`cursor-pointer border-l-8 transition-all duration-200 hover:shadow-md ${
                  selectedCourse?.code === course.code
                    ? "border-l-primary bg-primary/15 shadow-md"
                    : `${getAllocationStatusColor(course.code)}`
                }`}
                onClick={() => onCourseSelect(course)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm font-semibold">
                      {course.name}
                    </CardTitle>
                    <div className="flex gap-1">
                      <Badge
                        variant="secondary"
                        className={getCourseTypeColor(course.offeredAs)}
                      >
                        {course.offeredAs}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={getDegreeTypeColor(course.offeredTo)}
                      >
                        {course.offeredTo}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium leading-tight">
                      {course.code}
                    </h4>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <GraduationCap className="h-3 w-3" />
                        <span>L: {course.lectureUnits}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>P: {course.practicalUnits}</span>
                      </div>
                      <div className="font-semibold">
                        Total: {course.totalUnits}
                      </div>
                    </div>

                    {course.offeredAlsoBy &&
                      course.offeredAlsoBy.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">Also offered by: </span>
                          {course.offeredAlsoBy.join(", ")}
                        </div>
                      )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default CoursesColumn;
