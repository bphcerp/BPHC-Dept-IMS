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
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/Auth";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

type ApplicationRow = {
  id: number;
  user: {
    name: string | null;
    email: string;
  };
  state: (typeof conferenceSchemas.states)[number];
  createdAt: string;
  membersAssigned?: number;
  membersReviewed?: number;
};

const createColumns = (
  showMemberProgress: boolean
): ColumnDef<ApplicationRow>[] => [
  {
    header: ({ column }) => (
      <Button
        variant="link"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="flex w-full items-center justify-start p-0 font-semibold text-foreground"
      >
        ID
      </Button>
    ),
    accessorKey: "id",
    size: 80,
  },
  {
    header: ({ column }) => (
      <Button
        variant="link"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="flex w-full items-center justify-start p-0 font-semibold text-foreground"
      >
        Applicant
      </Button>
    ),
    accessorKey: "user",
    cell: ({ row }) => {
      const user: { name: string | null; email: string } = row.getValue("user");

      return (
        <div className="flex flex-col">
          <p className="font-semibold">{user.name || "Unknown"}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      );
    },
    sortingFn: (rowA, rowB) => {
      const userA: { name: string | null } = rowA.getValue("user");
      const userB: { name: string | null } = rowB.getValue("user");
      const nameA = userA.name || "Unknown";
      const nameB = userB.name || "Unknown";
      return nameA.localeCompare(nameB);
    },
  },
  {
    header: ({ column }) => (
      <Button
        variant="link"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="flex w-full items-center justify-start p-0 font-semibold text-foreground"
      >
        Status
      </Button>
    ),
    accessorKey: "state",
    cell: ({ row }) => {
      const state: string = row.getValue("state");
      return <Badge variant="outline">{state}</Badge>;
    },
  },
  ...(showMemberProgress
    ? [
        {
          header: () => (
            <p className="flex w-full items-center justify-start p-0 font-semibold">
              Review Progress
            </p>
          ),
          accessorKey: "reviewProgress",
          cell: ({ row }: { row: { original: ApplicationRow } }) => {
            const { membersAssigned = 0, membersReviewed = 0 } = row.original;
            const allReviewed =
              membersAssigned > 0 && membersReviewed === membersAssigned;
            return (
              <div className="flex items-center gap-2">
                <span
                  className={allReviewed ? "font-medium text-green-600" : ""}
                >
                  {membersReviewed} / {membersAssigned}
                </span>
                {allReviewed && (
                  <Badge variant="default" className="text-xs">
                    Complete
                  </Badge>
                )}
              </div>
            );
          },
        } as ColumnDef<ApplicationRow>,
      ]
    : []),
  {
    header: () => (
      <p className="flex w-full items-center justify-start p-0 font-semibold">
        Submitted At
      </p>
    ),
    cell: ({ row }) => {
      const createdAt: string = row.getValue("createdAt");
      return (
        <p className="text-muted-foreground">
          {format(new Date(createdAt), "LLL dd, y • hh:mm a")}
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
  const isConvener = checkAccess("conference:application:convener");
  const isHoD = checkAccess("conference:application:hod");

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
        `Changed flow to ${vars.directFlow ? "DIRECT" : "PROCESS"}`
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

  // Determine if we should show member progress column (for conveners/HoDs viewing DRC Member state apps)
  const showMemberProgress = useMemo(() => {
    return (
      ((isConvener || isHoD) &&
        data?.applications.some(
          (app) =>
            app.state === "DRC Member" && app.membersAssigned !== undefined
        )) ||
      false
    );
  }, [data?.applications, isConvener, isHoD]);

  const columns = useMemo(
    () => createColumns(showMemberProgress),
    [showMemberProgress]
  );

  const tableData = useMemo(
    () =>
      data?.applications?.map(({ userEmail, userName, ...appl }) => ({
        ...appl,
        user: {
          name: userName,
          email: userEmail,
        },
      })) ?? [],
    [data?.applications]
  );

  const table = useReactTable({
    data: tableData,
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
      <div className="flex w-full items-center justify-between">
        <h2 className="text-3xl font-normal">Pending Applications</h2>

        {canViewFlow && data?.isDirect !== undefined && (
          <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-2">
            <span className="text-sm text-muted-foreground">
              Current flow:{" "}
              <Badge variant={data.isDirect ? "default" : "secondary"}>
                {data.isDirect ? "DIRECT" : "PROCESS"}
              </Badge>
            </span>
            {canSetFlow && (
              <Button
                onClick={() =>
                  toggleFlowMutation.mutate({ directFlow: !data.isDirect })
                }
                disabled={toggleFlowMutation.isLoading}
                size="sm"
                variant="outline"
              >
                {toggleFlowMutation.isLoading ? "Updating..." : "Toggle Flow"}
              </Button>
            )}
          </div>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading applications...</p>
        </div>
      )}

      {isError && (
        <div className="flex items-center justify-center py-12">
          <p className="text-destructive">
            Error loading applications. Please try again.
          </p>
        </div>
      )}

      {data && (
        <div className="w-full space-y-4">
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className="cursor-pointer transition-colors hover:bg-muted/50"
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
                      className="h-24 text-center text-muted-foreground"
                    >
                      No pending applications found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {table.getRowModel().rows.length} of{" "}
              {data.applications.length} application(s)
            </p>
            <div className="flex items-center gap-2">
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
          </div>
        </div>
      )}
    </div>
  );
};

export default ConferencePendingApplicationsView;
