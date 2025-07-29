import { useState, useMemo } from "react";
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  Row,
  Column,
  flexRender,
} from "@tanstack/react-table";
import { patentSchemas } from "lib";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Check, X, Pen, ChevronDown, ArrowUp, ArrowDown, Download } from "lucide-react";
import api from "@/lib/axios-instance";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { useCallback } from "react";

export type Patent = patentSchemas.Patent;

interface PatentTableProps {
  patents: Patent[];
  loading: boolean;
  error: string | null;
  onRowClick?: (patent: Patent) => void;
  editable?: boolean;
  onEditSave?: (id: string, changes: Partial<Patent>) => Promise<void>;
}

const PatentTable = ({ patents, loading, error, onRowClick, editable = false, onEditSave }: PatentTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Patent>>({});
  const [exporting, setExporting] = useState(false);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };


  const handleSave = useCallback(async () => {
    if (editingId && onEditSave) {
      await onEditSave(editingId, editValues);
      setEditingId(null);
      setEditValues({});
    }
  }, [editingId, onEditSave, editValues]);

  const handleCancel = () => {
    setEditingId(null);
    setEditValues({});
  };

  const isWithinRangeDate = (row: Row<Patent>, columnId: string, value: [Date, Date]) => {
    const date = row.getValue(columnId);
    if (!date) return false;
    const rowDate = new Date(date as string);
    return rowDate >= value[0] && rowDate <= value[1];
  };

  const isWithinRangeNumber = (row: Row<Patent>, columnId: string, value: [number, number]) => {
    const num = row.getValue(columnId);
    if (num === null || num === undefined) return false;
    return (num as number) >= value[0] && (num as number) <= value[1];
  };

  const renderFilter = (column: Column<Patent, unknown>) => {
    if (column.id === 'filingDate') {
      const value = (column.getFilterValue() as [string, string]) || ['', ''];
      return (
        <div className="flex gap-1">
          {[0, 1].map((idx) => (
            <DateInputWithCalendar
              key={idx}
              value={value[idx]}
              onChange={dateStr => {
                const newValue: [string, string] = idx === 0 ? [dateStr, value[1]] : [value[0], dateStr];
                column.setFilterValue(newValue);
              }}
            />
          ))}
        </div>
      );
    }
    if (column.getCanFilter()) {
      return (
        <Input
          className="w-32"
          placeholder={`Filter...`}
          value={(column.getFilterValue() as string) || ''}
          onChange={e => column.setFilterValue(e.target.value)}
        />
      );
    }
    return null;
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await api.get("/patent/list-all");
      const allPatents: Patent[] = response.data as Patent[];
      if (!allPatents.length) {
        setExporting(false);
        return;
      }
      const columns = [
        'applicationNumber', 'inventorsName', 'department', 'title', 'campus', 'filingDate', 'status'
      ];
      const escapeCSV = (value: string | number | boolean | null | undefined) => {
        const stringValue = String(value ?? '');
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      };
      const csvRows = [columns.join(",")];
      for (const patent of allPatents) {
        const row = columns.map(col => {
          const value = patent[col as keyof Patent];
          if (col === 'filingDate') {
            return escapeCSV(formatDate(value as string));
          }
          if (col === 'inventorsName') {
            return escapeCSV(value as string);
          }
          return escapeCSV(value as string | number | boolean | null | undefined);
        });
        csvRows.push(row.join(","));
      }
      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "patents_export.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch {
      if (typeof window !== 'undefined' && window.alert) {
        window.alert('Failed to export patents. Please try again.');
      }
    } finally {
      setExporting(false);
    }
  };

  const columns = useMemo<ColumnDef<Patent>[]>(
    () => [
      {
        accessorKey: "applicationNumber",
        header: "Application Number",
        cell: ({ row }) => <div>{row.getValue("applicationNumber")}</div>,
      },
      {
        accessorKey: "inventorsName",
        header: "Inventors Name",
        cell: ({ row }) => (
          <div className="max-w-[200px] truncate">{row.getValue("inventorsName")}</div>
        ),
      },
      {
        accessorKey: "department",
        header: "Department",
        cell: ({ row }) => <div>{row.getValue("department")}</div>,
      },
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <div className="max-w-[300px] truncate">{row.getValue("title")}</div>
        ),
      },
      {
        accessorKey: "campus",
        header: "Campus",
        cell: ({ row }) => <div>{row.getValue("campus")}</div>,
      },
      {
        accessorKey: "filingDate",
        header: "Filing Date",
        cell: ({ row }) => <div>{formatDate(row.getValue("filingDate"))}</div>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <div>{row.getValue("status")}</div>,
      },
      ...(editable ? [{
        id: "actions",
        header: "Actions",
        cell: ({ row }: { row: Row<Patent> }) => {
          const isEditing = editingId === row.original.id;
          return (
            <div className="flex space-x-2">
              {isEditing ? (
                <>
                  <Button size="sm" onClick={() => void handleSave()}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancel}>
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setEditingId(row.original.id)}>
                  <Pen className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        },
      }] : []),
    ],
    [editable, editingId, handleSave]
  );

  const table = useReactTable({
    data: patents,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    filterFns: {
      isWithinRangeDate,
      isWithinRangeNumber,
    },
  });

  if (loading) return <div className="w-full text-center py-8">Loading...</div>;
  if (error) return <div className="w-full text-center py-8 text-red-500">{error}</div>;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                Columns <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {table.getAllLeafColumns().map(column => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={value => column.toggleVisibility(!!value)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" onClick={() => { void handleExport(); }} disabled={exporting} className="flex items-center gap-2">
            <Download className="w-4 h-4" /> Export
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          Showing {table.getRowModel().rows.length} of {patents.length} patents
        </div>
      </div>
      <div className="relative overflow-x-auto rounded-md border p-2">
        <Table className="table-auto">
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead
                    key={header.id}
                    className={
                      "align-top px-4 truncate overflow-hidden whitespace-nowrap py-4 group " +
                      (header.column.getCanSort() ? "cursor-pointer select-none" : "")
                    }
                    onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                  >
                    <div className="flex items-center gap-1">
                      {header.isPlaceholder ? null : (
                        <>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && (
                            header.column.getIsSorted() === 'asc' ? (
                              <ArrowUp className="w-5 h-5 text-primary transition-opacity duration-200 opacity-100" />
                            ) : header.column.getIsSorted() === 'desc' ? (
                              <ArrowDown className="w-5 h-5 text-primary transition-opacity duration-200 opacity-100" />
                            ) : (
                              <ArrowUp className="w-5 h-5 transition-opacity duration-200 opacity-0 group-hover:opacity-40" />
                            )
                          )}
                        </>
                      )}
                    </div>
                    <div className="mt-1" onClick={e => e.stopPropagation()}>{renderFilter(header.column)}</div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={table.getAllLeafColumns().length} className="text-center py-8">
                  No patents found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map(row => (
                <TableRow
                  key={row.id}
                  className={(onRowClick ? "cursor-pointer " : "") + "py-4"}
                  onClick={onRowClick && editingId !== row.original.id ? (() => { onRowClick(row.original); }) : undefined}
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id} className="px-4 py-4 truncate overflow-hidden whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="flex gap-2">
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
        <div className="text-sm">
          Page {table.getState().pagination?.pageIndex + 1} of {table.getPageCount()}
        </div>
      </div>
    </div>
  );
}

function DateInputWithCalendar({ value, onChange }: { value: string, onChange: (date: string) => void }) {
  const [open, setOpen] = useState(false);
  const selectedDate = value ? new Date(value) : undefined;
  return (
    <div className="flex items-center gap-1">
      <Input
        className="w-24"
        type="date"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="p-1 h-8 w-8"
            tabIndex={-1}
            aria-label="Pick date"
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={date => {
              setOpen(false);
              if (date) onChange(date.toISOString().slice(0, 10));
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default PatentTable; 