import { conferenceSchemas, formSchemas } from "lib";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import api from "@/lib/axios-instance";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const columns: ColumnDef<{
  id: number;
  state: string;
  createdAt: string;
}>[] = [
  {
    header: ({ column }) => {
      return (
        <Button
          variant="link"
          onClick={() => column.toggleSorting(column.getIsSorted() !== "desc")}
          className="flex w-full items-center justify-start p-0 font-semibold text-foreground"
        >
          ID
        </Button>
      );
    },
    accessorKey: "id",
  },
  {
    header: ({ column }) => {
      return (
        <Button
          variant="link"
          onClick={() => column.toggleSorting(column.getIsSorted() !== "desc")}
          className="flex w-full items-center justify-start p-0 font-semibold text-foreground"
        >
          Status
        </Button>
      );
    },
    accessorKey: "status",
    cell: ({ row }) => {
      const status: (typeof formSchemas.applicationStatuses)[number] =
        row.getValue("status");
      return status === "approved"
        ? "Accepted"
        : status === "rejected"
          ? "Rejected"
          : "Pending";
    },
  },
  {
    header: () => {
      return (
        <p className="flex w-full items-center justify-start p-0 font-semibold">
          Submitted At
        </p>
      );
    },
    accessorKey: "createdAt",
  },
];

const ConferenceSubmittedApplicationsView = () => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["conference", "submitted"],
    queryFn: async () => {
      return (
        await api.get<conferenceSchemas.submittedApplicationsResponse>(
          "/conference/applications/my"
        )
      ).data;
    },
  });

  const table = useReactTable({
    data: data?.applications ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center gap-6 bg-background-faded p-8">
      <h2 className="self-start text-3xl font-normal">
        Submitted Applications
      </h2>
      {isLoading && <p>Loading...</p>}
      {isError && <p>Error loading applications</p>}
      {data && (
        <>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="cursor-pointer"
                    onClick={() => {
                      navigate(`${row.original.id}`);
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="flex items-center gap-2 self-start">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default ConferenceSubmittedApplicationsView;
