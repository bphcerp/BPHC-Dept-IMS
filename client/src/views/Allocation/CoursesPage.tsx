import { DataTable } from "@/components/shared/datatable/DataTable";
import { Course } from "../../../../lib/src/types/allocation.ts";
import { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AddCourseForm } from "@/components/allocation/AddCourseForm";
import { toast } from "sonner";
import api from "@/lib/axios-instance";
import { useAuth } from "@/hooks/Auth.tsx";
import { AxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const columns: ColumnDef<Course>[] = [
  {
    accessorKey: "code",
    header: "Code",
    meta: {
      filterType: "search",
    },
  },
  {
    accessorKey: "timetableCourseId",
    header: "TD ID",
  },

  {
    accessorKey: "name",
    header: "Title",
    meta: {
      filterType: "search",
      tailwindWidthString: 'w-64 min-w-64'
    },
  },

  {
    accessorFn: () => "Credit Split",
    header: "Credit Split",
    cell: ({ row }) =>
      `L:${row.original.lectureUnits} P:${row.original.practicalUnits} T:${row.original.offeredAs === "CDC" && row.original.offeredTo === "FD" ? 1 : 0}`,
  },

  {
    accessorKey: "offeredTo",
    header: "Offered To",
    meta: {
      filterType: "dropdown",
    },
  },

  {
    accessorKey: "offeredAs",
    header: "Type",
    meta: {
      filterType: "dropdown",
    },
  },
  {
    accessorKey: "offeredAlsoBy",
    header: "Offered Also By",
  },
  {
    accessorFn: (row) => (row.fetchedFromTTD ? "Yes" : "No"),
    header: "Fetched From TTD?",
    cell: ({ row, getValue }) => (
      <span
        className={`rounded-lg p-2 ${row.original.fetchedFromTTD ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"}`}
      >
        {getValue() as string}
      </span>
    ),
    meta: {
      filterType: "dropdown",
    },
  },
  {
    accessorFn: (row) => (row.markedForAllocation ? "Yes" : "No"),
    header: "Marked For Allocation?",
    cell: ({ row, getValue }) => (
      <span
        className={`rounded-lg p-2 ${row.original.markedForAllocation ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}
      >
        {getValue() as string}
      </span>
    ),
    meta: {
      filterType: "dropdown",
    },
  },
];

const CoursesPage = () => {
  const [selectedCourseCodes, setSelectedCourseCodes] = useState<string[]>([]);
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const { checkAccessAnyOne } = useAuth();

  const queryClient = useQueryClient();

  const { data: courses = [] } = useQuery<Course[], AxiosError>(
    ["allocation", "courses", "unmarked"],
    async () => {
      return api
        .get<Course[]>("/allocation/course/get?unmarked=true")
        .then(({ data }) => data);
    },
    {
      onError: (error) => {
        toast.error("Error in fetching courses!");
        console.error("Error in fetching courses: ", error);
      },
      staleTime: 1000 * 60, // 1 minute, tweak if needed
    }
  );

  const handleCourseAdded = () => {
    setIsAddCourseOpen(false);
  };

  const { mutate: markCourses } = useMutation({
    mutationFn: () =>
      api
        .post("/allocation/course/mark", {
          courseCodes: selectedCourseCodes,
        })
        .then(() => {
          queryClient.invalidateQueries(["allocation", "courses"]);
          toast.success("Success!");
        })
        .catch((e) => {
          console.error(e);
          toast.error(
            ((e as AxiosError).response?.data as string) ??
              "Something went wrong"
          );
        }),
  });

  const AddCourseButton = () => (
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
      toast.success(
        "Courses synced with TTD successfully. Marked for allocation has NOT been modified."
      );
      queryClient.invalidateQueries(["allocation", "courses"]);
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
        <h1 className="mb-4 text-2xl font-bold text-primary">Courses</h1>
        {checkAccessAnyOne(["allocation:write", "allocation:courses:sync"]) && (
          <Button onClick={handleSyncCourses} variant="outline">
            Sync Courses*
          </Button>
        )}
      </div>
      <h4 className="text-sm italic text-muted-foreground">
        *All courses are fetched from the TimeTable Division.
      </h4>
      <DataTable
        idColumn="code"
        isTableHeaderFixed={true}
        columns={columns}
        data={courses}
        setSelected={(courses) =>
          setSelectedCourseCodes(courses.map((course) => course.code))
        }
        additionalButtons={
          <>
            <AddCourseButton />
            {checkAccessAnyOne([
              "allocation:write",
              "allocation:courses:mark",
            ]) &&
              !!courses?.length && (
                <Button
                  disabled={!selectedCourseCodes.length}
                  onClick={() => markCourses()}
                >
                  Toggle Mark For Allocation
                </Button>
              )}
          </>
        }
      />
    </div>
  );
};

export default CoursesPage;
