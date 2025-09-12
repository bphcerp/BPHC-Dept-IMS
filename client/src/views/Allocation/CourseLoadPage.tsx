import { DataTable } from "@/components/shared/datatable/DataTable";
import { Course } from "../../../../lib/src/types/allocation.ts"
import { ColumnDef } from "@tanstack/react-table"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { AddCourseForm } from "@/components/allocation/AddCourseForm"
import { toast } from "sonner"
import api from "@/lib/axios-instance"

const columns: ColumnDef<Course>[] = [
  {
    accessorKey: "code",
    header: "Course Code",
  },

  {
    accessorKey: "name",
    header: "Course Title",
  },

  {
    accessorKey: "units",
    header: "Units",
  },

  {
    accessorKey: "lectureSecCount",
    header: "Lecture Sections",
    cell: ({ row }) => {
      const value = row.original.lectureSecCount;
      return value === 0 ? "0" : value;
    }
  },

  {
    accessorKey: "tutSecCount",
    header: "Tutorial Sections",
    cell: ({ row }) => {
      const value = row.original.tutSecCount;
      return value === 0 ? "0" : value;
    }

  },

  {
    accessorKey: "practicalSecCount",
    header: "Practical Sections",
    cell: ({ row }) => {
      const value = row.original.practicalSecCount;
      return value === 0 ? "0" : value;
    }

  },

  {
    accessorKey: "isCDC",
    header: "Is CDC?",
    cell: ({ getValue }) => getValue() ? "Yes" : "No",
  },
  {
    accessorKey: "hasLongPracticalSec",
    header: "Longer Practical Section?",
    cell: ({ getValue, row }) => getValue() ? "Yes" : row.original.practicalSecCount ? "No" : "NA",
  },
];

const CourseLoadPage = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);

  const fetchCourses = async () => {
    try {
      const response = await api.get("/allocation/course/get");
      setCourses(response.data);
    } catch (error) {
      toast.error("Error in fetching courses!");
      console.error("Error in fetching courses: ", error);
    } finally {
      setIsLoading(false);
    }
  }


  useEffect(() => {
    fetchCourses();
  }, []);

  const handleCourseAdded = () => {
    fetchCourses();
    setIsAddCourseOpen(false);
  };

  const addCourseButton = (
    <AddCourseForm open={isAddCourseOpen} onOpenChange={setIsAddCourseOpen} onCourseAdded={handleCourseAdded}>
      <Button onClick={() => setIsAddCourseOpen(true)}> Add Course </Button>
    </AddCourseForm>
  );

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4"> Course Load allocation </h1>
      <DataTable
        columns={columns}
        data={courses}
        mainSearchColumn="name"
        additionalButtons={addCourseButton}
      />
    </div>
  );
};

export default CourseLoadPage;

