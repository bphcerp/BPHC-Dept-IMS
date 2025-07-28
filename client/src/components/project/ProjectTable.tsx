import { useState, useMemo, useCallback, useRef, useEffect } from "react";
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
import { projectSchemas } from "lib";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Check, X, Pen, ChevronDown, ArrowUp, ArrowDown, Download } from "lucide-react";
import api from "@/lib/axios-instance";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";

export type Project = projectSchemas.Project;

interface ProjectTableProps {
  projects: Project[];
  loading: boolean;
  error: string | null;
  editable?: boolean;
  onEditSave?: (id: string, changes: Partial<Project>) => Promise<void>;
  onRowClick?: (project: Project) => void;
}

type EditableInputCellProps = {
  value: string | number | undefined;
  onChange: (value: string | number) => void;
  autoFocus?: boolean;
  type?: 'text' | 'number' | 'date';
  className?: string;
  onFocus?: () => void;
};
function EditableInputCell({ value, onChange, autoFocus, type = 'text', className, onFocus }: EditableInputCellProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);
  return (
    <Input
      ref={inputRef}
      type={type}
      value={value === undefined || value === null ? '' : value}
      onChange={e => {
        if (type === 'number') {
          onChange(e.target.value === '' ? '' : Number(e.target.value));
        } else {
          onChange(e.target.value);
        }
      }}
      className={className}
      onFocus={onFocus}
    />
  );
}
type EditableCheckboxCellProps = {
  value: boolean | undefined;
  onChange: (value: boolean) => void;
  autoFocus?: boolean;
  onFocus?: () => void;
};
function EditableCheckboxCell({ value, onChange, autoFocus, onFocus }: EditableCheckboxCellProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);
  return (
    <input
      ref={inputRef}
      type="checkbox"
      checked={!!value}
      onChange={e => onChange(e.target.checked)}
      onFocus={onFocus}
    />
  );
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
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Project>>({});
  const [initialEditState, setInitialEditState] = useState<Partial<Project> | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [exporting, setExporting] = useState(false);

  const isWithinRangeNumber = useCallback(
    (row: Row<Project>, columnId: string, value: [number | string, number | string]) => {
      const cellValue = Number(row.getValue(columnId));
      const [start, end] = value;
      if ((start || end) && !cellValue) return false;
      if (start && !end) return cellValue >= Number(start);
      if (!start && end) return cellValue <= Number(end);
      if (start && end) return cellValue >= Number(start) && cellValue <= Number(end);
      return true;
    },
    []
  );

  const isWithinRangeDate = useCallback(
    (row: Row<Project>, columnId: string, value: [string, string]) => {
      const date = new Date(row.getValue(columnId));
      const [start, end] = value;
      if ((start || end) && !date) return false;
      if (start && !end) return date >= new Date(start);
      if (!start && end) return date <= new Date(end);
      if (start && end) return date >= new Date(start) && date <= new Date(end);
      return true;
    },
    []
  );

  const formatDate = useCallback((dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }, []);

  const handleEditChange = useCallback(<K extends keyof Project>(key: K, value: Project[K]) => {
    setEditValues(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(async (id: string) => {
    if (!onEditSave || !initialEditState) return;
    const changes: Record<string, string | number | boolean | undefined> = {};
    (Object.keys(editValues) as (keyof Project)[]).forEach((key) => {
      const value = editValues[key];
      if (
        value !== initialEditState[key] &&
        (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === undefined)
      ) {
        changes[key] = value;
      }
    });
    if (Object.keys(changes).length > 0) {
      try {
        await onEditSave(id, changes);
      } catch {
        alert('Failed to save changes. Please try again.');
        return;
      }
    }
    setEditingId(null);
    setEditValues({});
    setInitialEditState(null);
  }, [onEditSave, initialEditState, editValues]);

  const handleCancel = () => {
    setEditingId(null);
    setEditValues({});
    setInitialEditState(null);
  };

  const columns = useMemo<ColumnDef<Project>[]>(() => [
    {
      header: "S. No.",
      id: "serialNumber",
      cell: ({ row }) => <span>{row.index + 1}</span>,
      enableSorting: false,
    },
    {
      header: "Title",
      accessorKey: "title",
      cell: ({ row }) => {
        const isEditing = editingId === row.original.id;
        if (isEditing) {
          return (
            <EditableInputCell
              value={editValues.title}
              onChange={v => handleEditChange('title', v as string)}
              autoFocus={editingField === 'title' && editingId === row.original.id}
              className="min-w-[200px]"
              onFocus={() => setEditingField('title')}
            />
          );
        }
        const title: string = row.getValue("title");
        return <span>{title && title.length > 60 ? `${title.substring(0, 60)}...` : title}</span>;
      },
    },
    {
      header: "PI",
      accessorKey: "piName",
      cell: ({ row }) => {
        const piName: string = row.getValue("piName");
        const piEmail: string = row.getValue("piEmail");
        return (
          <div>
            <span>{piName || "Not assigned"}</span>
            <div className="text-xs text-muted-foreground">{piEmail || ""}</div>
          </div>
        );
      },
    },
    {
      header: "Funding Agency",
      accessorKey: "fundingAgencyName",
      cell: ({ row }) => {
        const fundingAgencyName: string = row.getValue("fundingAgencyName");
        return <span>{fundingAgencyName || "Not specified"}</span>;
      },
    },
    {
      header: "Amount",
      accessorKey: "sanctionedAmount",
      filterFn: isWithinRangeNumber,
      cell: ({ row }) => {
        const isEditing = editingId === row.original.id;
        if (isEditing) {
          return (
            <EditableInputCell
              value={editValues.sanctionedAmount}
              onChange={v => handleEditChange('sanctionedAmount', v as number)}
              type="number"
              autoFocus={editingField === 'sanctionedAmount' && editingId === row.original.id}
              onFocus={() => setEditingField('sanctionedAmount')}
            />
          );
        }
        const amount: number = row.getValue("sanctionedAmount");
        return <span>{amount ? `₹${amount.toLocaleString("en-IN")}` : "Not specified"}</span>;
      },
    },
    {
      header: "Approval Date",
      accessorKey: "approvalDate",
      cell: ({ row }) => {
        const isEditing = editingId === row.original.id;
        if (isEditing) {
          const dateValue = editValues.approvalDate ? new Date(editValues.approvalDate).toISOString().slice(0, 10) : row.original.approvalDate?.slice(0, 10) || '';
          return (
            <EditableInputCell
              value={dateValue}
              onChange={v => handleEditChange('approvalDate', v as string)}
              type="date"
              autoFocus={editingField === 'approvalDate' && editingId === row.original.id}
              onFocus={() => setEditingField('approvalDate')}
            />
          );
        }
        const value: string = row.getValue("approvalDate");
        return <span>{value ? formatDate(value) : "Not set"}</span>;
      },
    },
    {
      header: "Start Date",
      accessorKey: "startDate",
      filterFn: isWithinRangeDate,
      cell: ({ row }) => {
        const isEditing = editingId === row.original.id;
        if (isEditing) {
          const dateValue = editValues.startDate ? new Date(editValues.startDate).toISOString().slice(0, 10) : row.original.startDate?.slice(0, 10) || '';
          return (
            <EditableInputCell
              value={dateValue}
              onChange={v => handleEditChange('startDate', v as string)}
              type="date"
              autoFocus={editingField === 'startDate' && editingId === row.original.id}
              onFocus={() => setEditingField('startDate')}
            />
          );
        }
        const value: string = row.getValue("startDate");
        return <span>{value ? formatDate(value) : "Not set"}</span>;
      },
    },
    {
      header: "End Date",
      accessorKey: "endDate",
      filterFn: isWithinRangeDate,
      cell: ({ row }) => {
        const isEditing = editingId === row.original.id;
        if (isEditing) {
          const dateValue = editValues.endDate ? new Date(editValues.endDate).toISOString().slice(0, 10) : row.original.endDate?.slice(0, 10) || '';
          return (
            <EditableInputCell
              value={dateValue}
              onChange={v => handleEditChange('endDate', v as string)}
              type="date"
              autoFocus={editingField === 'endDate' && editingId === row.original.id}
              onFocus={() => setEditingField('endDate')}
            />
          );
        }
        const value: string = row.getValue("endDate");
        return <span>{value ? formatDate(value) : "Not set"}</span>;
      },
    },
    {
      header: "Extended",
      accessorKey: "hasExtension",
      cell: ({ row }) => {
        const isEditing = editingId === row.original.id;
        if (isEditing) {
          return (
            <EditableCheckboxCell
              value={editValues.hasExtension}
              onChange={v => handleEditChange('hasExtension', v)}
              autoFocus={editingField === 'hasExtension' && editingId === row.original.id}
              onFocus={() => setEditingField('hasExtension')}
            />
          );
        }
        const value: boolean = row.getValue("hasExtension");
        return value ? <span className="text-orange-600">Yes</span> : <span>No</span>;
      },
    },
    ...(editable
      ? [
          {
            id: "actions",
            header: "",
            cell: ({ row }: { row: Row<Project> }) => {
              const isEditing = editingId === row.original.id;
              return isEditing ? (
                <div className="flex gap-1">
                  <Button size="icon" onClick={(e) => { e.stopPropagation(); void handleSave(row.original.id); }}>
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); handleCancel(); }}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button size="icon" variant="outline" onClick={(e) => { e.stopPropagation(); handleEdit(row.original); }}>
                  <Pen className="w-4 h-4" />
                </Button>
              );
            },
            enableSorting: false,
          },
        ]
      : []),
  ], [editable, editingId, editingField, editValues, handleEditChange, isWithinRangeNumber, isWithinRangeDate, formatDate, handleSave]);

  const table = useReactTable({
    data: projects,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const handleEdit = (project: Project) => {
    setEditingId(project.id);
    setEditingField('title');
    const initialData = { ...project };
    setInitialEditState(initialData);
    setEditValues(initialData);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await api.get("/project/list-all");
      const allProjects: Project[] = response.data as Project[];
      if (!allProjects.length) {
        setExporting(false);
        return;
      }
      const columns = [
        'title', 'piName', 'piEmail', 'piDepartment', 'piCampus', 'piAffiliation',
        'coPINames', 'coPIs', 'fundingAgency', 'fundingAgencyNature', 'sanctionedAmount',
        'capexAmount', 'opexAmount', 'manpowerAmount', 'approvalDate',
        'startDate', 'endDate', 'hasExtension'
      ];
      const escapeCSV = (value: string | number | boolean | null | undefined) => {
        const stringValue = String(value ?? '');
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      };
      const csvRows = [columns.join(",")];
      for (const project of allProjects) {
        const row = columns.map(col => {
          if (col === 'coPINames') {
            if (Array.isArray(project.coPIs) && project.coPIs.length > 0) {
              return escapeCSV(project.coPIs.map(c => c.name).filter(Boolean).join(', '));
            }
            return '';
          }
          if (col === 'coPIs') {
            if (Array.isArray(project.coPIs) && project.coPIs.length > 0) {
              return escapeCSV(project.coPIs.map(c => c.email).filter(Boolean).join(', '));
            }
            return '';
          }
          if (col === 'fundingAgency') {
            return escapeCSV(project.fundingAgencyName ?? '');
          }
          if (col === 'fundingAgencyNature') {
            return escapeCSV(project.fundingAgencyNature ?? '');
          }
          const value = project[col as keyof Project];
          if (Array.isArray(value)) {
            return escapeCSV(JSON.stringify(value));
          }
          return escapeCSV(value);
        });
        csvRows.push(row.join(","));
      }
      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "projects_export.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch {
      if (typeof window !== 'undefined' && window.alert) {
        window.alert('Failed to export projects. Please try again.');
      }
    } finally {
      setExporting(false);
    }
  };

  const renderFilter = (column: Column<Project, unknown>) => {
    if (column.id === 'fundingAgencyName') {
      return (
        <Input
          className="w-32"
          placeholder="Search..."
          value={(column.getFilterValue() as string) || ''}
          onChange={e => column.setFilterValue(e.target.value || undefined)}
        />
      );
    }
    if (column.id === 'sanctionedAmount') {
      const value = (column.getFilterValue() as [string, string]) || ['', ''];
      return (
        <div className="flex gap-1">
          <Input
            className="w-20"
            type="number"
            placeholder="Min"
            value={value[0]}
            onChange={e => column.setFilterValue([e.target.value, value[1]])}
          />
          <Input
            className="w-20"
            type="number"
            placeholder="Max"
            value={value[1]}
            onChange={e => column.setFilterValue([value[0], e.target.value])}
          />
        </div>
      );
    }
    if (column.id === 'startDate' || column.id === 'endDate') {
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
          Showing {table.getRowModel().rows.length} of {projects.length} projects
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
                  No projects found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map(row => (
                <TableRow
                  key={row.id}
                  className={(onRowClick ? "cursor-pointer " : "") + "py-4"}
                  onClick={onRowClick && editingId !== row.original.id ? handleRowClick(row.original) : undefined}
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