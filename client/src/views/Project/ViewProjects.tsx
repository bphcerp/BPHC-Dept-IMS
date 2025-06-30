import { useEffect, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import api from "@/lib/axios-instance";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/Auth";
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
import { format } from "date-fns";
import { projectSchemas } from "lib";

const columns: ColumnDef<projectSchemas.Project>[] = [
  {
    header: () => (
      <span className="font-semibold text-foreground">S. No.</span>
    ),
    id: "serialNumber",
    cell: ({ row }) => {
      return <span>{row.index + 1}</span>;
    },
    size: 32,
    minSize: 32,
    maxSize: 48,
    enableSorting: false,
    enableResizing: false,
  },
  {
    header: ({ column }) => {
      return (
        <Button
          variant="link"
          onClick={() => column.toggleSorting(column.getIsSorted() !== "desc")}
          className="flex w-full min-w-48 items-center justify-start p-0 font-semibold text-foreground"
        >
          Title
        </Button>
      );
    },
    accessorKey: "title",
    cell: ({ row }) => {
      const title: string = row.getValue("title");
      return (
        <p className="font-medium text-foreground">
          {title && title.length > 60 ? `${title.substring(0, 60)}...` : title}
        </p>
      );
    },
  },
  {
    header: ({ column }) => {
      return (
        <Button
          variant="link"
          onClick={() => column.toggleSorting(column.getIsSorted() !== "desc")}
          className="flex w-full min-w-32 items-center justify-start p-0 font-semibold text-foreground"
        >
          PI
        </Button>
      );
    },
    accessorKey: "piName",
    cell: ({ row }) => {
      const piName: string = row.getValue("piName");
      const piEmail: string = row.getValue("piEmail");
      return (
        <div>
          <p className="font-medium text-foreground">{piName || "Not assigned"}</p>
          <p className="text-sm text-muted-foreground">{piEmail || ""}</p>
        </div>
      );
    },
  },
  {
    header: ({ column }) => {
      return (
        <Button
          variant="link"
          onClick={() => column.toggleSorting(column.getIsSorted() !== "desc")}
          className="flex w-full min-w-32 items-center justify-start p-0 font-semibold text-foreground"
        >
          Funding Agency
        </Button>
      );
    },
    accessorKey: "fundingAgencyName",
    cell: ({ row }) => {
      const fundingAgencyName: string = row.getValue("fundingAgencyName");
      return (
        <p className="text-foreground">
          {fundingAgencyName || "Not specified"}
        </p>
      );
    },
  },
  {
    header: ({ column }) => {
      return (
        <Button
          variant="link"
          onClick={() => column.toggleSorting(column.getIsSorted() !== "desc")}
          className="flex w-full min-w-32 items-center justify-start p-0 font-semibold text-foreground"
        >
          Amount
        </Button>
      );
    },
    accessorKey: "sanctionedAmount",
    cell: ({ row }) => {
      const amount: number = row.getValue("sanctionedAmount");
      return (
        <p className="font-medium">
          {amount ? `₹${amount.toLocaleString("en-IN")}` : "Not specified"}
        </p>
      );
    },
  },
  {
    header: ({ column }) => {
      return (
        <Button
          variant="link"
          onClick={() => column.toggleSorting(column.getIsSorted() !== "desc")}
          className="flex w-full min-w-32 items-center justify-start p-0 font-semibold text-foreground"
        >
          Start Date
        </Button>
      );
    },
    accessorKey: "startDate",
    cell: ({ row }) => {
      const startDate: string = row.getValue("startDate");
      return (
        <p className="text-muted-foreground">
          {startDate ? format(new Date(startDate), "MMM dd, yyyy") : "Not set"}
        </p>
      );
    },
  },
  {
    header: ({ column }) => {
      return (
        <Button
          variant="link"
          onClick={() => column.toggleSorting(column.getIsSorted() !== "desc")}
          className="flex w-full min-w-32 items-center justify-start p-0 font-semibold text-foreground"
        >
          End Date
        </Button>
      );
    },
    accessorKey: "endDate",
    cell: ({ row }) => {
      const endDate: string = row.getValue("endDate");
      return (
        <p className="text-muted-foreground">
          {endDate ? format(new Date(endDate), "MMM dd, yyyy") : "Not set"}
        </p>
      );
    },
  },
];

export default function ViewProjects() {
  const { authState, checkAccess } = useAuth();
  const [projects, setProjects] = useState<projectSchemas.Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/project/list")
      .then(res => {
        console.log("API Response:", res.data); 
        setProjects(res.data as projectSchemas.Project[]);
      })
      .catch((err) => {
        console.error("API Error:", err); 
        setError("Failed to load projects");
      })
      .finally(() => setLoading(false));
  }, []);

  const table = useReactTable({
    data: projects,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  if (!authState) return <Navigate to="/" replace />;
  if (!checkAccess("project:view")) return <Navigate to="/404" replace />;

  if (loading) return <div className="flex-1 flex items-center justify-center">Loading...</div>;
  if (error) return <div className="flex-1 flex items-center justify-center text-red-500">{error}</div>;

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center gap-6 bg-background-faded p-8">
      <h2 className="self-start text-3xl font-normal">
        Projects
      </h2>
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
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => {
                  navigate(`${row.original.id}`);
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="py-3">
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
                No projects found.
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
    </div>
  );
} 