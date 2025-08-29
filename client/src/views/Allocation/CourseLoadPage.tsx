import { DataTable } from "@/components/shared/datatable/DataTable";
import { Course } from "../../../../lib/src/types/allocation.ts"
import { ColumnDef } from "@tanstack/react-table"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { AddCourseForm } from "@/components/allocation/AddCourseForm"

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
    cell: ({ row }) => (row.original.isCDC) ? "Yes" : "No",
  },
];

const CourseLoadPage = () => {
  const[courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    const fetchCourses = async () => {
      const mockCourses: Course[] = [
        {
          code: "CS F211",
          name: "Data Structures and Algorithms",
          lectureSecCount: 1,
          tutSecCount: 2,
          practicalSecCount: 2,
          units: 4,
          isCDC: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];
      setCourses(mockCourses);
    };
    fetchCourses();
  }, []);

  const handleCourseAdded = (newCourse: Course) => {
    setCourses((prevCourses) => [...prevCourses, newCourse]);
  };

  const addCourseButton = (
    <AddCourseForm onCourseAdded={handleCourseAdded}>
      <Button> Add Course </Button>
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


