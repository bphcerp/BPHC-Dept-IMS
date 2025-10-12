import { DataTable } from "@/components/shared/datatable/DataTable";
import { Semester, semesterStatusMap, semesterTypeMap } from "../../../../lib/src/types/allocation.ts";
import { ColumnDef } from "@tanstack/react-table";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/axios-instance";
import { Button } from "@/components/ui/button.tsx";
import { Link } from "react-router-dom";


const columns: ColumnDef<Semester>[] = [
  {
    accessorKey: "year",
    header: "Academic Year",
    cell: ({ row }) => `${row.original.year}-${row.original.year + 1}`,
    meta: {
      filterType: "search",
    },
  },

  {
    accessorKey: "semesterType",
    header: "Semester",
    cell: ( { row } ) => semesterTypeMap[row.original.semesterType],
    meta: {
      filterType: "dropdown",
    },
  },

  {
    accessorKey: "hodAtStartOfSem.name",
    header: "HoD*",
    meta: {
      filterType: "dropdown",
    },
  },

  {
    accessorKey: "dcaConvenerAtStartOfSem.name",
    header: "DCA Convener*",
    meta: {
      filterType: "dropdown",
    },
  },

  {
    accessorFn: (row) => semesterStatusMap[row.allocationStatus],
    header: "Allocation Status",
    meta: {
      filterType: "dropdown",
    },
  },

  {
    accessorKey: "allocationDeadline",
    header: "Allocation Deadline",
    meta: {
      filterType: "date-range",
    },
  },

  {
    accessorKey: "startDate",
    header: "Start Date",
    cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString('en-IN'),
    meta: {
      filterType: "date-range",
    },
  },

  {
    accessorKey: "endDate",
    header: "End Date",
    cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString('en-IN'),
    meta: {
      filterType: "date-range",
    },
  },
];

const SemesterList = () => {
  const [semesters, setSemesters] = useState<Semester[]>([]);

  const fetchCourses = async () => {
    try {
      const response = await api.get("/allocation/semester/get");
      setSemesters(response.data);
    } catch (error) {
      toast.error("Error in fetching semesters!");
      console.error("Error in fetching semesters: ", error);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="mb-4 text-2xl font-bold"> Semesters </h1>
      </div>
      <h4 className="text-sm text-muted-foreground italic">* HoD and DCA Convener are automatically fetched from the TimeTable Division</h4>
      <DataTable
        idColumn="id"
        columns={columns}
        data={semesters}
        additionalButtons={
          semesters.some(semester => ['inAllocation', 'formCollection'].includes(semester.allocationStatus)) ? <></> : <Button>
            <Link to="new">New Semester</Link>
          </Button>
        }
      />
    </div>
  );
};

export default SemesterList;
