import { conferenceSchemas } from "lib";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/Auth";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { format } from "date-fns";

const columns: ColumnDef<{
  id: number;
  user: {
    name: string | null;
    email: string;
  };
  state: (typeof conferenceSchemas.states)[number];
  createdAt: string;
}>[] = [
  {
    header: ({ column }) => {
      return (
        <Button
          variant="link"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
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
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex w-full items-center justify-start p-0 font-semibold text-foreground"
        >
          Applicant
        </Button>
      );
    },
    accessorKey: "user",
    cell: ({ row }) => {
      const user: { name: string; email: string } = row.getValue("user");
      return (
        <div className="flex flex-col">
          <p className="font-semibold">{user.name}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      );
    },
    sortingFn: (rowA, rowB) => {
      const userA: { name: string } = rowA.getValue("user");
      const userB: { name: string } = rowB.getValue("user");
      return userA.name.localeCompare(userB.name);
    },
  },
  {
    header: ({ column }) => {
      return (
        <Button
          variant="link"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex w-full items-center justify-start p-0 font-semibold text-foreground"
        >
          Status
        </Button>
      );
    },
    accessorKey: "state",
  },
  {
    header: () => {
      return (
        <p className="flex w-full items-center justify-start p-0 font-semibold">
          Submitted At
        </p>
      );
    },
    cell({ row }) {
      const createdAt: string = row.getValue("createdAt");
      return (
        <p className="text-muted-foreground">
          {format(createdAt, "LLL dd, y • hh:mm a")}
        </p>
      );
    },
    accessorKey: "createdAt",
  },
];

const ConferencePendingApplicationsView = () => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { checkAccess } = useAuth();

  const canSetFlow = checkAccess("conference:application:set-flow");
  const canViewFlow = checkAccess("conference:application:get-flow");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["conference", "pending"],
    queryFn: async () => {
      return (
        await api.get<conferenceSchemas.pendingApplicationsResponse>(
          "/conference/applications/pending"
        )
      ).data;
    },
  });

  const toggleFlowMutation = useMutation({
    mutationFn: async (flowBody: conferenceSchemas.FlowBody) => {
      return await api.post("/conference/setFlow", flowBody);
    },
    onSuccess: (_res, vars) => {
      toast.success(
        "Changed flow to " + (vars.directFlow ? "DIRECT" : "PROCESS")
      );
      void queryClient.refetchQueries({
        queryKey: ["conference", "pending"],
      });
    },
    onError: (err) => {
      if (isAxiosError(err))
        toast.error((err.response?.data as string) ?? "An error occurred");
    },
  });

  const table = useReactTable({
    data:
      data?.applications?.map(({ userEmail, userName, ...appl }) => ({
        ...appl,
        user: {
          name: userName || "Unknown",
          email: userEmail,
        },
      })) ?? [],
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
      <h2 className="self-start text-3xl font-normal">Pending Applications</h2>
      {isLoading && <p>Loading...</p>}
      {isError && <p>Error loading applications</p>}
      {canViewFlow ? (
        <div className="flex items-center gap-2 self-stretch">
          <span className="text-muted-foreground">
            Current flow:{" "}
            <span className="text-foreground underline">
              {data?.isDirect ? "DIRECT" : "PROCESS"}
            </span>
          </span>
          {canSetFlow ? (
            <Button
              onClick={() =>
                toggleFlowMutation.mutate({ directFlow: !data?.isDirect })
              }
              disabled={toggleFlowMutation.isLoading}
            >
              Toggle
            </Button>
          ) : null}
        </div>
      ) : null}
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
                      navigate(`../view/${row.original.id}`);
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

export default ConferencePendingApplicationsView;
