import { DataTable } from "@/components/shared/datatable/DataTable";
import { Course } from "../../../../lib/src/types/allocation.ts";
import { ColumnDef } from "@tanstack/react-table";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AddCourseForm } from "@/components/allocation/AddCourseForm";
import { toast } from "sonner";
import api from "@/lib/axios-instance";
import { useAuth } from "@/hooks/Auth.tsx";
import { AxiosError } from "axios";

const columns: ColumnDef<Course>[] = [
  {
    accessorKey: "code",
    header: "Course Code",
    meta: {
      filterType: 'search'
    }
  },

  {
    accessorKey: "name",
    header: "Course Title",
    meta: {
      filterType: 'search'
    }
  },

  {
    accessorKey: "totalUnits",
    header: "Units",
  },

  {
    accessorKey: "offeredTo",
    header: "Offered To",
    meta: {
      filterType: 'dropdown'
    }
  },

  {
    accessorKey: "lectureUnits",
    header: "Lecture Units",
    cell: ({ row }) => {
      const value = row.original.lectureUnits;
      return value === 0 ? "0" : value;
    },
  },

  {
    accessorKey: "practicalUnits",
    header: "Practical Units",
    cell: ({ row }) => {
      const value = row.original.practicalUnits;
      return value === 0 ? "0" : value;
    },
  },

  {
    accessorKey: "offeredAs",
    header: "Type",
    meta: {
      filterType: 'dropdown'
    }
  },
];

const CoursesPage = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const { checkAccessAnyOne } = useAuth();

  const fetchCourses = async () => {
    try {
      const response = await api.get("/allocation/course/get");
      setCourses(response.data);
    } catch (error) {
      toast.error("Error in fetching courses!");
      console.error("Error in fetching courses: ", error);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleCourseAdded = () => {
    fetchCourses();
    setIsAddCourseOpen(false);
  };

  const addCourseButton = (
    <AddCourseForm
      open={isAddCourseOpen}
      onOpenChange={setIsAddCourseOpen}
      onCourseAdded={handleCourseAdded}
    >
      <Button onClick={() => setIsAddCourseOpen(true)}> Add Course </Button>
    </AddCourseForm>
  );

  const handleSyncCourses = async () => {
    try {
      await api.post(`/allocation/course/sync`);
      toast.success("Courses synced with TTD successfully!");
      await fetchCourses()
    } catch (error) {
      console.error("Error syncing courses", error);
      toast.error(
        ((error as AxiosError).response?.data as string) ??
          "Error syncing courses!"
      );
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="mb-4 text-2xl font-bold"> Courses </h1>
        {checkAccessAnyOne(["allocation:write", "allocation:courses:sync"]) && (
          <Button onClick={handleSyncCourses} variant='outline'>Sync Courses</Button>
        )}
      </div>
      <DataTable
        idColumn="code"
        columns={columns}
        data={courses}
        additionalButtons={addCourseButton}
      />
    </div>
  );
};

export default CoursesPage;
