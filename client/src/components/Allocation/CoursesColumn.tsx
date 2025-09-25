import React, { useState } from "react";
import { allocationTypes } from "lib";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoadingSpinner } from "@/components/ui/spinner";
import { Search, BookOpen, GraduationCap, Clock } from "lucide-react";

interface CoursesColumnProps {
  courses: allocationTypes.Course[];
  isLoading: boolean;
  semesterId: string;
  selectedCourse: allocationTypes.Course | null;
  onCourseSelect: (course: allocationTypes.Course) => void;
}

const CoursesColumn: React.FC<CoursesColumnProps> = ({
  courses,
  isLoading,
  selectedCourse,
  onCourseSelect,
  // semesterId - will be used later for API calls
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCourses = courses.filter(
    (course) =>
      course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCourseTypeColor = (courseType: string) => {
    switch (courseType) {
      case "CDC":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "Elective":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getDegreeTypeColor = (degreeType: string) => {
    switch (degreeType) {
      case "FD":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "HD":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-background p-3">
        <div className="mb-3 flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          <span className="font-medium">
            Courses ({filteredCourses.length})
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Scrollable Course List */}
      <ScrollArea className="flex-1">
        <div className="space-y-2 p-3 pr-2">
          {isLoading ? (
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
                className={`cursor-pointer border-l-4 transition-all duration-200 hover:shadow-md ${
                  selectedCourse?.code === course.code
                    ? "border-l-primary bg-primary/5 shadow-md"
                    : "border-l-primary/30"
                }`}
                onClick={() => onCourseSelect(course)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm font-semibold">
                      {course.code}
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
                      {course.name}
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
