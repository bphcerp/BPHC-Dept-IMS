import { useState } from "react";
import { Search, Plus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
} from "@/components/ui/navigation-menu";
import CreateRequestDialog, {
  Course,
} from "@/components/qp_review/CreateRequest";

const DCARequestsView = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("Ongoing");
  const [courses, setCourses] = useState<Course[]>([
    {
      name: "ECE F342 MID SEM",
      professor: "Prof. Harish V Dixit",
      reviewer1: "Faculty Reviewer 1",
      reviewer2: "Faculty Reviewer 2",
      status: "Ongoing",
    },
    {
      name: "ECE F342 MID SEM",
      professor: "Prof. Harish V Dixit",
      reviewer1: "Prof. BVSSN Rao",
      reviewer2: "Faculty Reviewer 2",
      status: "Approved",
    },
    {
      name: "ECE F34 COMPRE",
      professor: "Prof. Harish V Dixit",
      reviewer1: "Prof. Prof. Parikshith",
      reviewer2: "Faculty Reviewer 2",
      status: "Pending",
    },
  ]);

  const statusColors: Record<string, string> = {
    Ongoing: "bg-orange-400",
    Approved: "bg-green-500",
    Pending: "bg-gray-400",
  };

  // Function to add new request
  const handleAddRequest = (newRequest: Course) => {
    setCourses([...courses, newRequest]); // Add new request to the list
    setIsDialogOpen(false); // Close the dialog after adding
  };

  return (
    <div className="flex w-full flex-col gap-4 px-10 pt-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">Courses</h1>
        <Button
          className="flex items-center gap-2"
          onClick={() => setIsDialogOpen(true)}
        >
          <Plus size={16} /> Create New Request
        </Button>
      </div>

      {/* Create Request Dialog */}
      <CreateRequestDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onAddRequest={handleAddRequest}
      />

      {/* Search & Filter Section */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 transform text-gray-400" />
          <Input
            type="search"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 pl-9"
          />
        </div>
        <Button>Search</Button>

        {/* Sorting Dropdown */}
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger className="flex items-center gap-2 border px-4 py-2">
                Sort By <ChevronDown size={16} />
              </NavigationMenuTrigger>
              <NavigationMenuContent className="rounded-md border bg-white p-2 shadow-md">
                {Object.keys(statusColors).map((status) => (
                  <div
                    key={status}
                    onClick={() => setSortBy(status)}
                    className="cursor-pointer px-4 py-2 hover:bg-gray-200"
                  >
                    {status}
                  </div>
                ))}
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      {/* Course List */}
      <div className="mt-4 border-t">
        {courses
          .filter((course) => course.status === sortBy)
          .map((course, index) => (
            <div
              key={index}
              className="flex items-center justify-between border-b py-4"
            >
              <div>
                <p className="font-semibold">{course.name}</p>
                <p className="text-sm text-gray-500">{course.professor}</p>
              </div>
              <button className="text-blue-500">Edit</button>
              <select
                className="border p-1"
                title="Faculty Reviewer 1"
                value={course.reviewer1}
                onChange={(e) => {
                  const updatedCourses = [...courses];
                  updatedCourses[index].reviewer1 = e.target.value;
                  setCourses(updatedCourses);
                }}
              >
                <option>Select Reviewer 1</option>
                <option>Prof. BVSSN RAO</option>
                <option>Prof. BhanuMurthy</option>
                <option>Prof. Harish V Dixit</option>
              </select>
              <select
                className="border p-1"
                title="Faculty Reviewer 2"
                value={course.reviewer2}
                onChange={(e) => {
                  const updatedCourses = [...courses];
                  updatedCourses[index].reviewer2 = e.target.value;
                  setCourses(updatedCourses);
                }}
              >
                <option>Select Reviewer 2</option>
                <option>Prof. BVSSN RAO</option>
                <option>Prof. BhanuMurthy</option>
                <option>Prof. Harish V Dixit</option>
              </select>
              <span
                className={`rounded-md px-3 py-1 text-white ${statusColors[course.status]}`}
              >
                {course.status}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
};

export default DCARequestsView;
