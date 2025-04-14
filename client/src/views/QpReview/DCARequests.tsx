import { useEffect, useState } from "react";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import EditRequestDialog from "@/components/qp_review/EditRequest";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
} from "@/components/ui/navigation-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CreateRequestDialog, { Course } from "@/components/qp_review/CreateRequest";
import api from "@/lib/axios-instance";
import { toast } from "sonner";



const DCARequestsView = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("pending");
  const [courses, setCourses] = useState<Course[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentCourse, setCurrentCourse ] = useState<Course | null>(null);

  const statusColors: Record<string, string> = {
    pending: "bg-orange-400",
    approved: "bg-green-500",
  };

  const reviewers = [
    { name: "Prof. BVVSN RAO", email: "bvvsnrao@university.com" },
    { name: "Prof. BhanuMurthy", email: "bhanumurthy@university.com" },
    { name: "Prof. Harish V Dixit", email: "harishdixit@university.com" },
  ];

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

  useEffect(() => {
    fetchCourses();
  }, []);

  return (
    <div className="flex w-full flex-col gap-4 px-10 pt-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">Courses</h1>
        <Button className="flex items-center gap-2" onClick={() => setIsDialogOpen(true)}>
          <Plus size={16} /> Create New Request
        </Button>
      </div>

      <CreateRequestDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onAddRequest={handleAddRequest}
        fetchCourses={fetchCourses}
      />
      <EditRequestDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        course={currentCourse}
        fetchCourses={fetchCourses}
      />

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

        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger className="flex items-center gap-2 border px-4 py-2">
                Sort By <span className=" font-bold">{sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}</span>
              </NavigationMenuTrigger>
              <NavigationMenuContent className="rounded-md border bg-white p-2 shadow-md">
                {Object.keys(statusColors).map((status) => (
                  <div
                    key={status}
                    onClick={() => setSortBy(status)}
                    className="cursor-pointer px-4 py-2 hover:bg-gray-200"
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </div>
                ))}
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      {/* Header row */}
      {/* <div className="mt-4 grid grid-cols-5 gap-4 border-b pb-2 font-medium">
        <div className="text-center">Course</div>
        <div className="text-center">Action</div>
        <div className="text-center">Reviewer 1</div>
        <div className="text-center">Reviewer 2</div>
        <div className="text-center">Status</div>
      </div> */}

      {courses.length===0 && <p className="text-center mt-4">No requests found</p>}
      {/* Course rows */}
      <div className="border-t mt-4">
        {courses
          .filter((course) => course.status === sortBy)
          .map((course, index) => (
            <div key={index} className="grid grid-cols-5 items-center gap-4 border-b py-4">
              {/* Course info */}
              <div>
                <p className="font-semibold">{course.courseName}</p>
                <p className="text-sm text-gray-500">FIC</p>
                <p className="text-xs text-gray-400 mt-1">
                  {course.reviewed === "Review Complete" ? "Reviewed" : "Pending Review"}
                </p>
              </div>

              {/* Edit button */}
              <Button variant="ghost" className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                onClick={() => handleEditRequest(course)}> Edit </Button>

              {/* Reviewer 1 Select */}
              <Select
                value={course.reviewer1 || ""}
                disabled={!!course.reviewer1}
                onValueChange={(value) => {
                  if (value === course.reviewer2) {
                    toast.error("Reviewer 1 and Reviewer 2 must be different.");
                    return;
                  }

                  const updatedCourses = [...courses];
                  updatedCourses[index] = { ...updatedCourses[index], reviewer1: value };
                  setCourses(updatedCourses);

                  handleFacultyAssignment(course.id.toString(), value, course.reviewer2);
                }}
              >
                <SelectTrigger className="w-full border p-1">
                  <SelectValue placeholder="Select Reviewer 1" />
                </SelectTrigger>
                <SelectContent>
                  {reviewers.map((reviewer) => (
                    <SelectItem
                      key={reviewer.email}
                      value={reviewer.email}
                      disabled={reviewer.email === course.reviewer2}
                    >
                      {reviewer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Reviewer 2 Select */}
              <Select
                value={course.reviewer2 || ""}
                disabled={!!course.reviewer2}
                onValueChange={(value) => {
                  if (value === course.reviewer1) {
                    toast.error("Reviewer 1 and Reviewer 2 must be different.");
                    return;
                  }

                  const updatedCourses = [...courses];
                  updatedCourses[index] = { ...updatedCourses[index], reviewer2: value };
                  setCourses(updatedCourses);

                  handleFacultyAssignment(course.id.toString(), course.reviewer1, value);
                }}
              >
                <SelectTrigger className="w-full border p-1">
                  <SelectValue placeholder="Select Reviewer 2" />
                </SelectTrigger>
                <SelectContent>
                  {reviewers.map((reviewer) => (
                    <SelectItem
                      key={reviewer.email}
                      value={reviewer.email}
                      disabled={reviewer.email === course.reviewer1}
                    >
                      {reviewer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status */}
              <span className={`rounded-md mx-12 px-3 py-1 text-white text-center ${statusColors[course.status]}`}>
                {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
              </span>

            </div>
          ))}
      </div>
    </div>
  );
};

export default DCARequestsView;