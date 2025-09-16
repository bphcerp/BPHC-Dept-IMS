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
    accessorKey: "lectureUnits",
    header: "Lecture Sections",
    cell: ({ row }) => {
      const value = row.original.lectureUnits;
      return value === 0 ? "0" : value;
    }
  },

  {
    accessorKey: "practicalUnits",
    header: "Practical Sections",
    cell: ({ row }) => {
      const value = row.original.practicalUnits;
      return value === 0 ? "0" : value;
    }

  },

  {
    accessorKey: "isCDC",
    header: "Is CDC?",
    cell: ({ getValue }) => getValue() ? "Yes" : "No",
  }
];

const CourseLoadPage = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);

  const fetchCourses = async () => {
    try {
      const response = await api.get("/allocation/course/get");
      setCourses(response.data);
    } catch (error) {
      toast.error("Error in fetching courses!");
      console.error("Error in fetching courses: ", error);
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
        idColumn="code"
        columns={columns}
        data={courses}
        additionalButtons={addCourseButton}
      />
    </div>
  );
};

export default CourseLoadPage;

