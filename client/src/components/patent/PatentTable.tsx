import { useState, useMemo, useRef, useEffect, useCallback } from "react";
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
import { Check, X, Pen, ChevronDown, ArrowUp, ArrowDown, Download, Calendar as CalendarIcon } from "lucide-react";
import api from "@/lib/axios-instance";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

export type Patent = patentSchemas.Patent;

interface PatentTableProps {
  patents: Patent[];
  loading: boolean;
  error: string | null;
  onRowClick?: (patent: Patent) => void;
  editable?: boolean;
  onEditSave?: (id: string, changes: Partial<Patent>) => Promise<void>;
}

type EditableInputCellProps = {
  readonly value: string | number | undefined;
  readonly onChange: (value: string | number) => void;
  readonly autoFocus?: boolean;
  readonly type?: 'text' | 'number' | 'date';
  readonly className?: string;
  readonly onFocus?: () => void;
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
      value={value ?? ''}
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

type EditableCellProps = {
  readonly isEditing: boolean;
  readonly isFieldEditing: boolean;
  readonly value: string;
  readonly editValue: string | undefined;
  readonly onEditChange: (val: string | number) => void;
  readonly onFieldClick: () => void;
  readonly className?: string;
  readonly type?: 'text' | 'date';
  readonly displayValue?: string;
};

function EditableCell({
  isEditing,
  isFieldEditing,
  value,
  editValue,
  onEditChange,
  onFieldClick,
  className = "w-full",
  type = 'text',
  displayValue
}: EditableCellProps) {
  if (isEditing && isFieldEditing) {
    return (
      <EditableInputCell
        value={editValue ?? value}
        onChange={onEditChange}
        autoFocus={true}
        type={type}
        className={className}
        onFocus={() => onFieldClick()}
      />
    );
  } else if (isEditing) {
    return (
      <button
        onClick={onFieldClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onFieldClick();
          }
        }}
        className={`cursor-pointer hover:bg-gray-100 p-1 rounded ${className}`}
        type="button"
      >
        {displayValue ?? editValue ?? value}
      </button>
    );
  }
  return <div className={className}>{displayValue ?? value}</div>;
}

type EditableSelectCellProps = {
  readonly isEditing: boolean;
  readonly isFieldEditing: boolean;
  readonly value: string;
  readonly editValue: string | undefined;
  readonly onEditChange: (val: string) => void;
  readonly onFieldClick: () => void;
  readonly options: readonly { value: string; label: string }[];
};

function EditableSelectCell({
  isEditing,
  isFieldEditing,
  value,
  editValue,
  onEditChange,
  onFieldClick,
  options
}: EditableSelectCellProps) {
  if (isEditing && isFieldEditing) {
    return (
      <select
        value={editValue ?? value}
        onChange={(e) => onEditChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
        autoFocus
        onFocus={() => onFieldClick()}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  } else if (isEditing) {
    return (
      <button
        onClick={onFieldClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onFieldClick();
          }
        }}
        className="cursor-pointer hover:bg-gray-100 p-1 rounded"
        type="button"
      >
        {editValue ?? value}
      </button>
    );
  }
  return <div>{value}</div>;
}

const PatentTable = ({ patents, loading, error, onRowClick, editable = false, onEditSave }: PatentTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Patent>>({});
  const [initialEditState, setInitialEditState] = useState<Partial<Patent> | null>(null);
  const [exporting, setExporting] = useState(false);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };


  const handleEditChange = useCallback(<K extends keyof Patent>(key: K, value: Patent[K]) => {
    setEditValues(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(async (id: string) => {
    if (!onEditSave || !initialEditState) return;
    const changes: Record<string, string | number | boolean | undefined> = {};
    (Object.keys(editValues) as (keyof Patent)[]).forEach((key) => {
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
    setEditingField(null);
    setEditValues({});
    setInitialEditState(null);
  }, [onEditSave, initialEditState, editValues]);

  const handleCancel = () => {
    setEditingId(null);
    setEditingField(null);
    setEditValues({});
    setInitialEditState(null);
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
        cell: ({ row }) => {
          const isEditing = editingId === row.original.id;
          const fieldKey = `${row.original.id}-applicationNumber`;
          const isFieldEditing = editingField === fieldKey;
          const value = row.getValue("applicationNumber");

          return (
            <EditableCell
              isEditing={isEditing}
              isFieldEditing={isFieldEditing}
              value={String(value)}
              editValue={editValues.applicationNumber}
              onEditChange={(val) => handleEditChange('applicationNumber', val as string)}
              onFieldClick={() => {
                setEditingField(fieldKey);
                if (!initialEditState) {
                  setInitialEditState({ ...row.original });
                }
              }}
              className="w-full"
            />
          );
        },
      },
      {
        accessorKey: "inventorsName",
        header: "Inventors Name",
        cell: ({ row }) => {
          const isEditing = editingId === row.original.id;
          const fieldKey = `${row.original.id}-inventorsName`;
          const isFieldEditing = editingField === fieldKey;
          const value = row.getValue("inventorsName");

          return (
            <EditableCell
              isEditing={isEditing}
              isFieldEditing={isFieldEditing}
              value={String(value)}
              editValue={editValues.inventorsName}
              onEditChange={(val) => handleEditChange('inventorsName', val as string)}
              onFieldClick={() => {
                setEditingField(fieldKey);
                if (!initialEditState) {
                  setInitialEditState({ ...row.original });
                }
              }}
              className="w-full max-w-[200px]"
            />
          );
        },
      },
      {
        accessorKey: "department",
        header: "Department",
        cell: ({ row }) => {
          const isEditing = editingId === row.original.id;
          const fieldKey = `${row.original.id}-department`;
          const isFieldEditing = editingField === fieldKey;
          const value = row.getValue("department");

          return (
            <EditableCell
              isEditing={isEditing}
              isFieldEditing={isFieldEditing}
              value={String(value)}
              editValue={editValues.department}
              onEditChange={(val) => handleEditChange('department', val as string)}
              onFieldClick={() => {
                setEditingField(fieldKey);
                if (!initialEditState) {
                  setInitialEditState({ ...row.original });
                }
              }}
              className="w-full"
            />
          );
        },
      },
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => {
          const isEditing = editingId === row.original.id;
          const fieldKey = `${row.original.id}-title`;
          const isFieldEditing = editingField === fieldKey;
          const value = row.getValue("title");

          return (
            <EditableCell
              isEditing={isEditing}
              isFieldEditing={isFieldEditing}
              value={String(value)}
              editValue={editValues.title}
              onEditChange={(val) => handleEditChange('title', val as string)}
              onFieldClick={() => {
                setEditingField(fieldKey);
                if (!initialEditState) {
                  setInitialEditState({ ...row.original });
                }
              }}
              className="w-full max-w-[300px]"
            />
          );
        },
      },
      {
        accessorKey: "campus",
        header: "Campus",
        cell: ({ row }) => {
          const isEditing = editingId === row.original.id;
          const fieldKey = `${row.original.id}-campus`;
          const isFieldEditing = editingField === fieldKey;
          const value = row.getValue("campus");

          return (
            <EditableCell
              isEditing={isEditing}
              isFieldEditing={isFieldEditing}
              value={String(value)}
              editValue={editValues.campus}
              onEditChange={(val) => handleEditChange('campus', val as string)}
              onFieldClick={() => {
                setEditingField(fieldKey);
                if (!initialEditState) {
                  setInitialEditState({ ...row.original });
                }
              }}
              className="w-full"
            />
          );
        },
      },
      {
        accessorKey: "filingDate",
        header: "Filing Date",
        cell: ({ row }) => {
          const isEditing = editingId === row.original.id;
          const fieldKey = `${row.original.id}-filingDate`;
          const isFieldEditing = editingField === fieldKey;
          const value = row.getValue("filingDate");

          return (
            <EditableCell
              isEditing={isEditing}
              isFieldEditing={isFieldEditing}
              value={String(value)}
              editValue={editValues.filingDate}
              onEditChange={(val) => handleEditChange('filingDate', val as string)}
              onFieldClick={() => {
                setEditingField(fieldKey);
                if (!initialEditState) {
                  setInitialEditState({ ...row.original });
                }
              }}
              className="w-full"
              type="date"
              displayValue={formatDate(editValues.filingDate ?? (String(value)))}
            />
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const isEditing = editingId === row.original.id;
          const fieldKey = `${row.original.id}-status`;
          const isFieldEditing = editingField === fieldKey;
          const value = row.getValue("status");

          const statusOptions = [
            { value: "Pending", label: "Pending" },
            { value: "Filed", label: "Filed" },
            { value: "Granted", label: "Granted" },
            { value: "Abandoned", label: "Abandoned" },
            { value: "Rejected", label: "Rejected" }
          ] as const;

          return (
            <EditableSelectCell
              isEditing={isEditing}
              isFieldEditing={isFieldEditing}
              value={String(value)}
              editValue={editValues.status}
              onEditChange={(val) => handleEditChange('status', val as "Pending" | "Filed" | "Granted" | "Abandoned" | "Rejected")}
              onFieldClick={() => {
                setEditingField(fieldKey);
                if (!initialEditState) {
                  setInitialEditState({ ...row.original });
                }
              }}
              options={statusOptions}
            />
          );
        },
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
                  <Button size="sm" onClick={() => void handleSave(row.original.id)}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancel}>
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline" onClick={() => {
                  setEditingId(row.original.id);
                  setInitialEditState({ ...row.original });
                }}>
                  <Pen className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        },
      }] : []),
    ],
    [editable, editingId, editingField, handleSave, editValues, handleEditChange, initialEditState]
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
                          {header.column.getCanSort() && (() => {
                            const sortDirection = header.column.getIsSorted();
                            if (sortDirection === 'asc') {
                              return <ArrowUp className="w-5 h-5 text-primary transition-opacity duration-200 opacity-100" />;
                            }
                            if (sortDirection === 'desc') {
                              return <ArrowDown className="w-5 h-5 text-primary transition-opacity duration-200 opacity-100" />;
                            }
                            return <ArrowUp className="w-5 h-5 transition-opacity duration-200 opacity-0 group-hover:opacity-40" />;
                          })()}
                        </>
                      )}
                    </div>
                    <button
                      className="mt-1"
                      onClick={e => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                        }
                      }}
                      type="button"
                    >
                      {renderFilter(header.column)}
                    </button>
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

type DateInputWithCalendarProps = {
  readonly value: string;
  readonly onChange: (date: string) => void;
};

function DateInputWithCalendar({ value, onChange }: DateInputWithCalendarProps) {
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