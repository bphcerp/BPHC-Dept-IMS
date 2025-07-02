import { useState } from "react";
import { Button } from "@/components/ui/button";
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
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { projectSchemas } from "lib";
import { Check, X, Pen } from "lucide-react";

export type Project = projectSchemas.Project;

interface ProjectTableProps {
  projects: Project[];
  loading: boolean;
  error: string | null;
  editable?: boolean;
  onEditSave?: (id: string, changes: Partial<Project>) => Promise<void>;
  onRowClick?: (project: Project) => void;
}

export default function ProjectTable({
  projects,
  loading,
  error,
  editable = false,
  onEditSave,
  onRowClick,
}: ProjectTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Project>>({});

  const columns: ColumnDef<Project>[] = [
    {
      header: () => <span className="font-semibold text-foreground">S. No.</span>,
      id: "serialNumber",
      cell: ({ row }) => <span>{row.index + 1}</span>,
      size: 32,
      minSize: 32,
      maxSize: 48,
      enableSorting: false,
      enableResizing: false,
    },
    {
      header: () => <span className="font-semibold text-foreground">Title</span>,
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
      header: () => <span className="font-semibold text-foreground">PI</span>,
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
      header: () => <span className="font-semibold text-foreground">Funding Agency</span>,
      accessorKey: "fundingAgencyName",
      cell: ({ row }) => {
        const fundingAgencyName: string = row.getValue("fundingAgencyName");
        return <p className="text-foreground">{fundingAgencyName || "Not specified"}</p>;
      },
    },
    {
      header: () => <span className="font-semibold text-foreground">Amount</span>,
      accessorKey: "sanctionedAmount",
      cell: ({ row }) => {
        const amount: number = row.getValue("sanctionedAmount");
        return <p className="font-medium">{amount ? `₹${amount.toLocaleString("en-IN")}` : "Not specified"}</p>;
      },
    },
    {
      header: () => <span className="font-semibold text-foreground">Start Date</span>,
      accessorKey: "startDate",
      cell: ({ row }) => {
        const startDate: string = row.getValue("startDate");
        return <p className="text-muted-foreground">{startDate ? format(new Date(startDate), "MMM dd, yyyy") : "Not set"}</p>;
      },
    },
    {
      header: () => <span className="font-semibold text-foreground">End Date</span>,
      accessorKey: "endDate",
      cell: ({ row }) => {
        const endDate: string = row.getValue("endDate");
        return <p className="text-muted-foreground">{endDate ? format(new Date(endDate), "MMM dd, yyyy") : "Not set"}</p>;
      },
    },
  ];

  const table = useReactTable({
    data: projects,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const handleEdit = (project: Project) => {
    setEditingId(project.id);
    setEditValues({ ...project });
  };
  const handleCancel = () => {
    setEditingId(null);
    setEditValues({});
  };
  const handleChange = (field: keyof Project, value: unknown) => {
    setEditValues(prev => ({ ...prev, [field]: value }));
  };
  const handleSave = async (id: string) => {
    if (!onEditSave) return;
    const changed: Record<string, unknown> = {};
    (Object.keys(editValues) as (keyof Project)[]).forEach((key) => {
      const original = projects.find((p) => p.id === id);
      if (original && editValues[key] !== original[key]) {
        changed[key] = editValues[key];
      }
    });
    if (Object.keys(changed).length === 0) {
      setEditingId(null);
      setEditValues({});
      return;
    }
    await onEditSave(id, changed as Partial<Project>);
    setEditingId(null);
    setEditValues({});
  };

  if (loading) return <div className="flex-1 flex items-center justify-center">Loading...</div>;
  if (error) return <div className="flex-1 flex items-center justify-center text-red-500">{error}</div>;

  return (
    <>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => {
              const isEditing = editable && editingId === row.original.id;
              return (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={editable ? "" : "cursor-pointer hover:bg-muted/50"}
                  onClick={
                    !editable && onRowClick
                      ? () => onRowClick(row.original)
                      : undefined
                  }
                >
                  {row.getVisibleCells().map((cell) => {
                    const colKey = cell.column.id;
                    if (
                      editable &&
                      isEditing &&
                      ["title", "sanctionedAmount", "startDate", "endDate"].includes(colKey)
                    ) {
                      let inputValue = "";
                      if (colKey === "title" && typeof editValues.title === "string") {
                        inputValue = editValues.title;
                      } else if (colKey === "sanctionedAmount") {
                        const amount = editValues.sanctionedAmount;
                        if (typeof amount === "number") {
                          inputValue = String(amount);
                        } else if (typeof amount === "string") {
                          inputValue = amount;
                        }
                      } else if (colKey === "startDate" && typeof editValues.startDate === "string") {
                        inputValue = editValues.startDate;
                      } else if (colKey === "endDate" && typeof editValues.endDate === "string") {
                        inputValue = editValues.endDate;
                      }
                      
                      return (
                        <TableCell key={cell.id} className="py-3">
                          <input
                            className="border rounded px-2 py-1 w-full"
                            value={inputValue}
                            onChange={e => handleChange(colKey as keyof Project, e.target.value)}
                            type={colKey.includes("Date") ? "date" : colKey === "sanctionedAmount" ? "number" : "text"}
                          />
                        </TableCell>
                      );
                    }
                    return (
                      <TableCell key={cell.id} className="py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    );
                  })}
                  {editable && (
                    <TableCell>
                      {isEditing ? (
                        <>
                          <Button size="icon" onClick={() => void handleSave(row.original.id)}>
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={handleCancel}>
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <Button size="icon" variant="outline" onClick={() => handleEdit(row.original)}>
                          <Pen className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
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
    </>
  );
} 