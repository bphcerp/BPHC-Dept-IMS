import { DataTable } from "@/components/shared/datatable/DataTable";
import {
  Semester,
  semesterStatusMap,
  semesterTypeMap,
} from "../../../../lib/src/types/allocation.ts";
import { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { toast } from "sonner";
import api from "@/lib/axios-instance";
import { Button } from "@/components/ui/button.tsx";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const columns: ColumnDef<Semester>[] = [
  {
    accessorKey: "active",
    header: "Visibility",
    cell: ({ row }) =>
      row.original.active ? <strong>Active</strong> : "Inactive",
  },
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
    cell: ({ row }) => semesterTypeMap[row.original.semesterType],
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
    accessorKey: "startDate",
    header: "Start Date",
    cell: ({ getValue }) =>
      new Date(getValue() as string).toLocaleDateString("en-IN"),
    meta: {
      filterType: "date-range",
    },
  },

  {
    accessorKey: "endDate",
    header: "End Date",
    cell: ({ getValue }) =>
      new Date(getValue() as string).toLocaleDateString("en-IN"),
    meta: {
      filterType: "date-range",
    },
  },
];

const SemesterList = () => {
  const [selectedSemesters, setSelectedSemesters] = useState<Semester[]>([]);

  const queryClient = useQueryClient();

  const activateSemesterMutation = useMutation({
    mutationFn: (semesterId: string) =>
      api
        .post(`/allocation/semester/activate/${semesterId}`)
        .then(async () => {
          toast.success("Semester marked as active successfully");
          queryClient.invalidateQueries(["semester"]);
        })
        .catch((e) => {
          console.error("Error while marking semester as active", e);
          toast.error("Something went wrong");
        }),
  });

  const { data: semesters } = useQuery({
    queryKey: ["semester", "list"],
    queryFn: async () =>
      api
        .get<Semester[]>("/allocation/semester/get")
        .then(({ data }) => data)
        .catch((error) => {
          toast.error("Error in fetching semesters!");
          console.error("Error in fetching semesters: ", error);
        }),
  });

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="mb-4 text-2xl font-bold"> Semesters </h1>
      </div>
      <h4 className="text-sm italic text-muted-foreground">
        * HoD and DCA Convener are automatically fetched from the TimeTable
        Division.
      </h4>
      <h4 className="text-sm italic text-muted-foreground">
        * You cannot create a new semester while another semester is in
        allocation or collecting responses.
      </h4>
      {!!semesters && (
        <DataTable
          idColumn="id"
          columns={columns}
          data={semesters}
          setSelected={setSelectedSemesters}
          additionalButtons={
            <div className="flex space-x-2">
              {!semesters.some((semester) =>
                ["inAllocation", "formCollection"].includes(
                  semester.allocationStatus
                )
              ) && (
                <Button>
                  <Link to="new">New Semester</Link>
                </Button>
              )}
              {selectedSemesters.length === 1 &&
                !selectedSemesters[0].active && (
                  <Button
                    variant="secondary"
                    onClick={() =>
                      activateSemesterMutation.mutate(selectedSemesters[0].id)
                    }
                  >
                    Set Active
                  </Button>
                )}
            </div>
          }
        />
      )}
    </div>
  );
};

export default SemesterList;
