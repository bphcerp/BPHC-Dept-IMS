"use client";

import {
  Column,
  ColumnDef,
  ColumnFiltersState,
  InitialTableState,
  Row,
  RowData,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ReactNode, useEffect, useState } from "react";
import OverflowHandler from "./OverflowHandler";

type BaseTableProps<T> =  {
  data: T[];
  columns: ColumnDef<T>[];
  // If mainSearchColumn is set, the meta filter options if set are ignored as there is a global filter already present.
  mainSearchColumn?: keyof T;
  initialState?: InitialTableState;
  setSelected?: (selected: T[]) => void;
  additionalButtons?: ReactNode;
}

type AltTableProps1<T> = {
  exportFunction?: ((itemIds: (T[keyof T])[], columnsVisible: string[]) => void);
  idColumn: keyof T;
}

type AltTableProps2 = {
  exportFunction?: never;
  idColumn?: never
}

type DataTableProps<T> = BaseTableProps<T> & (AltTableProps1<T> | AltTableProps2  )

export type TableFilterType =
  | "dropdown"
  | "multiselect"
  | "search"
  | "number-range"
  | "date-range";

// Extend ColumnMeta interface to add custom properties
declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    calculateSum?: (rows: TData[]) => string;
    truncateLength?: number;
    filterType?: TableFilterType;
    tailwindWidthString?: string;
  }
}

export function DataTable<T>({
  data,
  columns,
  mainSearchColumn,
  initialState,
  setSelected,
  exportFunction,
  additionalButtons,
  idColumn
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const isWithinRange = (row: Row<T>, columnId: string, value: any) => {
    const date = new Date(row.getValue(columnId));
    const [startDateString, endDateString] = value;
    const [start, end] = [
      startDateString ? new Date(startDateString) : undefined,
      endDateString ? new Date(endDateString) : undefined,
    ];

    // value => two date input values
    //If one filter defined and date is null filter it
    if ((start || end) && !date) return false;
    if (start && !end) {
      return date.getTime() >= start.getTime();
    } else if (!start && end) {
      return date.getTime() <= end.getTime();
    } else if (start && end) {
      return (
        date.getTime() >= start.getTime() && date.getTime() <= end.getTime()
      );
    } else return true;
  };

  const isWithinRangeNumber = (row: Row<T>, columnId: string, value: any) => {
    const cellValue = Number(row.getValue(columnId));
    const [start, end] = value;

    if ((start || end) && !cellValue) return false;
    if (start && !end) {
      return cellValue >= start;
    } else if (!start && end) {
      return cellValue <= end;
    } else if (start && end) {
      return cellValue >= start && cellValue <= end;
    } else return true;
  };

  const multiFilterFn = (row: Row<T>, columnId: string, filterValue: any) => {
    if (!filterValue || filterValue.length === 0) return true;
    return filterValue.includes(row.getValue(columnId));
  };

  const getLSPageSizeKey = () => `${location.href.split('/').at(-1)}-table-page-size`

  //save selected pageSize to localStorage
  const setPageSize = (pageSize: number) => {
    table.setPageSize(pageSize)
    localStorage.setItem(getLSPageSizeKey(), pageSize.toString())
  }

  const getPageSize = () => parseInt(localStorage.getItem(getLSPageSizeKey()) ?? '5')


  const table = useReactTable({
    data,
    columns: columns.map((columnDef) => ({
      ...columnDef,
      ...(columnDef.meta
        ? columnDef.meta.filterType === "date-range"
          ? { filterFn: isWithinRange }
          : columnDef.meta.filterType === "multiselect"
            ? { filterFn: multiFilterFn }
            : columnDef.meta.filterType === "number-range"
              ? { filterFn: isWithinRangeNumber }
              : {}
        : {}),
    })),
    initialState: {
      ...initialState,
      pagination: {
        ...initialState?.pagination,
        pageSize: initialState?.pagination?.pageSize ?? getPageSize()
      }
    },
    enableColumnPinning: true,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  useEffect(() => {
    if (setSelected)
      setSelected(
        Object.keys(rowSelection).map((row) => table.getRow(row).original)
      );
  }, [rowSelection]);

  const renderFilter = (column: Column<T>) => {
    const filterType = column.columnDef.meta?.filterType;
    const uniqueValues = Array.from(column.getFacetedUniqueValues().keys());

    switch (filterType) {
      case "dropdown":
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Filter</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {uniqueValues.map((value) => (
                <DropdownMenuCheckboxItem
                  key={value as string}
                  checked={column.getFilterValue() === value}
                  onCheckedChange={(checked) =>
                    column.setFilterValue(checked ? value : null)
                  }
                >
                  {(value as string) ?? "Not Provided"}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      case "multiselect":
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Filter</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {uniqueValues.map((value) => (
                <DropdownMenuCheckboxItem
                  key={value as string}
                  onSelect={(e) => e.preventDefault()}
                  checked={(
                    (column.getFilterValue() as string[]) ?? []
                  ).includes(value as string)}
                  onCheckedChange={(checked) => {
                    const currentValue =
                      (column.getFilterValue() as string[]) ?? [];
                    column.setFilterValue(
                      !checked
                        ? currentValue.filter((v) => v !== value)
                        : [...currentValue, value as string]
                    );
                  }}
                >
                  {(value as string) ?? "Not Provided"}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      case "search":
        return (
          <Input
            placeholder="Search"
            className="w-32"
            value={column.getFilterValue() as string}
            onChange={(event) => column.setFilterValue(event.target.value)}
          />
        );
      case "number-range":
        return (
          <div className="flex w-64 space-x-2">
            <Input
              type="number"
              value={(column.getFilterValue() as [number, number])?.[0] ?? ""}
              onChange={(event) => {
                const prevFilterValue = column.getFilterValue() as [
                  number,
                  number,
                ];
                if (!event.target.value) {
                  column.setFilterValue([undefined, prevFilterValue[1]]);
                  return;
                }
                if (prevFilterValue) {
                  const [, max] = prevFilterValue;
                  column.setFilterValue([event.target.value, max]);
                } else {
                  column.setFilterValue([event.target.value, undefined]);
                }
              }}
              placeholder="Min"
            />
            <Input
              type="number"
              value={(column.getFilterValue() as [number, number])?.[1] ?? ""}
              onChange={(event) => {
                const prevFilterValue = column.getFilterValue() as [
                  number,
                  number,
                ];
                if (!event.target.value) {
                  column.setFilterValue([prevFilterValue[0], undefined]);
                  return;
                }
                if (prevFilterValue) {
                  const [min] = prevFilterValue;
                  column.setFilterValue([min, event.target.value]);
                } else {
                  column.setFilterValue([undefined, event.target.value]);
                }
              }}
              placeholder="Max"
            />
          </div>
        );
      case "date-range":
        return (
          <div className="flex space-x-2">
            <Input
              type="date"
              value={(column.getFilterValue() as [string, string])?.[0] ?? ""}
              onChange={(event) => {
                const prevFilterValue = column.getFilterValue() as [
                  string,
                  string,
                ];
                if (!event.target.value) {
                  column.setFilterValue([undefined, prevFilterValue[1]]);
                  return;
                }
                if (prevFilterValue) {
                  const [, max] = prevFilterValue;
                  column.setFilterValue([event.target.value, max]);
                } else {
                  column.setFilterValue([event.target.value, undefined]);
                }
              }}
            />
            <Input
              type="date"
              value={(column.getFilterValue() as [string, string])?.[1] ?? ""}
              onChange={(event) => {
                const prevFilterValue = column.getFilterValue() as [
                  string,
                  string,
                ];
                if (!event.target.value) {
                  column.setFilterValue([prevFilterValue[0], undefined]);
                  return;
                }
                if (prevFilterValue) {
                  const [min] = prevFilterValue;
                  column.setFilterValue([min, event.target.value]);
                } else {
                  column.setFilterValue([undefined, event.target.value]);
                }
              }}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between py-4">
        {mainSearchColumn && (
          <Input
            placeholder={`Filter ${table.getColumn(mainSearchColumn as string)?.columnDef.header?.toString()}...`}
            value={
              (table
                .getColumn(mainSearchColumn as string)
                ?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table
                .getColumn(mainSearchColumn as string)
                ?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        )}
        <div className="flex items-center space-x-2">
          {additionalButtons}
          {exportFunction ? (
            <>
            <Button
              onClick={() => {
                // Export function just returns the ids of the rows and visible columns, data fetching and excel
                // generation is handled by the backend

                const itemIds = table
                  .getPrePaginationRowModel()
                  .rows.map((row) => row.original[idColumn]);
                const columnsVisible = table
                  .getVisibleFlatColumns()
                  .map((column) =>
                    column.id.includes("_")
                      ? column.id.split("_")[0]
                      : column.id
                  )
                  .filter((columnId) => columnId !== "S.No");
                exportFunction(itemIds, columnsVisible);
              }}
            >
              Export Data
            </Button>
            <Button
              onClick={() => {
                // Export function just returns the ids of the rows and visible columns, data fetching and excel
                // generation is handled by the backend

                const itemIds = table
                  .getSelectedRowModel()
                  .rows.map((row) => row.original[idColumn]);
                const columnsVisible = table
                  .getVisibleFlatColumns()
                  .map((column) =>
                    column.id.includes("_")
                      ? column.id.split("_")[0]
                      : column.id
                  )
                  .filter((columnId) => columnId !== "S.No");
                exportFunction(itemIds, columnsVisible);
              }}
            >
              Export Selected
            </Button>
            </>
          ) : (
            <></>
          )}
          <Button
            onClick={() => {
              // table.reset() doesn't work
              table.resetColumnFilters();
              table.resetColumnVisibility();
              table.resetGlobalFilter();
              table.resetRowSelection();
            }}
          >
            Reset
          </Button>
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  Columns <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div
                  className={`${table.getAllColumns().length >= 6 && "grid grid-cols-3"} max-h-56 overflow-y-auto`}
                >
                  {table
                    .getAllColumns()
                    .filter(
                      (column) => column.getCanHide() && !column.getIsPinned()
                    )
                    .map((column) => {
                      return (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize"
                          checked={column.getIsVisible()}
                          //To stop the dropdown from closing on click (onSelect)
                          onSelect={(e) => e.preventDefault()}
                          onCheckedChange={(value) =>
                            column.toggleVisibility(!!value)
                          }
                        >
                          {column.columnDef.header?.toString()}
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      {data.length ? (
        <div className="relative overflow-x-auto rounded-md border p-2">
          <Table className="table-auto">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  <TableHead>
                    <Checkbox
                      checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && "indeterminate")
                      }
                      onCheckedChange={(value) =>
                        table.toggleAllPageRowsSelected(!!value)
                      }
                      aria-label="Select all"
                    />
                  </TableHead>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        {...{
                          className: header.column.getCanSort()
                            ? "cursor-pointer select-none"
                            : "",
                          onClick: header.column.getToggleSortingHandler(),
                        }}
                        id={header.column.id}
                        colSpan={header.colSpan}
                        key={header.id}
                      >
                        <div className="flex w-max flex-col items-start gap-y-2 py-2 text-center">
                          <div className="flex space-x-2">
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                            {header.column.getIsSorted() === "asc" ? (
                              <ArrowUp />
                            ) : header.column.getIsSorted() === "desc" ? (
                              <ArrowDown />
                            ) : null}
                          </div>
                          <div onClick={(e) => e.stopPropagation()}>
                            {(!mainSearchColumn ||
                              header.column.columnDef.header
                                ?.toString()
                                .toLowerCase() !==
                              mainSearchColumn.toString().toLowerCase()) &&
                              renderFilter(header.column)}
                          </div>
                        </div>
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            {table.getVisibleLeafColumns().length ? (
              <TableBody>
                {table.getRowModel().rows.map((row, idx) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    <TableCell>
                      <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                        aria-label="Select row"
                      />
                    </TableCell>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        className={`${cell.column.id === "S.No" ? "min-w-2" : (cell.column.columnDef.meta?.tailwindWidthString ?? "")} ${cell.column.columnDef.meta && ["date-range", "number-range"].includes(cell.column.columnDef.meta.filterType ?? "") ? "text-center" : ""}`}
                        key={cell.id}
                        title={
                          cell.getValue() &&
                            (cell.getValue() as any).toString().length > 20
                            ? (cell.getValue() as any).toString()
                            : undefined
                        }
                      >
                        {cell.column.id === 'S.No' ? idx + 1 : typeof columns.find(
                          (column) =>
                            column.header === cell.column.columnDef.header
                        )?.cell === "function" ||
                          (cell.getValue() &&
                            typeof cell.getValue() !== "string") ? (
                          flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )
                        ) : cell.getValue() ? (
                          <OverflowHandler text={cell.getValue() as string} />
                        ) : (
                          <div className="w-full p-0.5 text-center">
                            Not Provided
                          </div>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                {columns.some((column) => column.meta?.calculateSum) ? (
                  <TableRow>
                    <TableCell className="z-2 sticky left-0 w-[20px]">
                      {/* Empty cell for the checkbox column */}
                    </TableCell>
                    {table.getVisibleLeafColumns().map((column) => (
                      <TableCell key={column.id} className="font-bold">
                        {column.columnDef.meta?.calculateSum ? (
                          column.columnDef.meta.calculateSum(
                            table.getRowModel().rows.map((row) => row.original)
                          )
                        ) : (
                          <></>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ) : (
                  <></>
                )}
              </TableBody>
            ) : (
              <div>
                <div className="flex flex-col items-center justify-center">
                  <p className="text-lg text-gray-500">No columns to show</p>
                </div>
              </div>
            )}
          </Table>
        </div>
      ) : (
        <div>
          <div className="border-1 flex h-40 flex-col items-center justify-center rounded-md border-primary">
            <p className="text-lg text-gray-500">No data</p>
          </div>
        </div>
      )}
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Rows per page <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {[5, 10, 20, 50, 100].map((pageSize) => (
                <DropdownMenuCheckboxItem
                  key={pageSize}
                  checked={table.getState().pagination.pageSize === pageSize}
                  onCheckedChange={() => setPageSize(pageSize)}
                >
                  {pageSize}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
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
  );
}
