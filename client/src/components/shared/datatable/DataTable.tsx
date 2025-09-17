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
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  FileDownIcon,
  RotateCcwIcon,
} from "lucide-react";

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
import {
  CSSProperties,
  MutableRefObject,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import OverflowHandler from "./OverflowHandler";
import { ActionItemsMenu } from "./ActionItemsMenu";
import { useSearchParams } from "react-router-dom";

const HEADER_COLOR = "#E8E8F0"
const ROW_COLOR_ODD = "#F7F7FB"
const ROW_COLOR_EVEN = "white"

type BaseTableProps<T> =  {
  data: T[];
  columns: ColumnDef<T>[];
  initialState?: InitialTableState;
  setSelected?: (selected: T[]) => void;
  additionalButtons?: ReactNode;
  exportFunction?: (itemIds: string[], columnsVisible: string[]) => void;
  isTableHeaderFixed?: boolean;
  tableElementRefProp?: MutableRefObject<HTMLTableElement | null>;
  mainSearchColumn? : keyof T;
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
  initialState,
  setSelected,
  idColumn,
  exportFunction,
  additionalButtons,
  isTableHeaderFixed,
  tableElementRefProp,
  mainSearchColumn
}: DataTableProps<T>) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const [searchParams, setSearchParams] = useSearchParams();
  const tableElementRef =
    tableElementRefProp ?? useRef<HTMLTableElement | null>(null);
  const containerElementRef = useRef<HTMLTableElement | null>(null);
  const [availableWindowWidth, setAvailableWindowWidth] = useState<
    number | undefined
  >();

  const [cellLeftMap, setCellLeftMap] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    if (data.length)
      table
        .getAllColumns()
        .filter((column) => column.getIsPinned())
        .map((pinnedColumn) =>
          setCellLeftMap((prev) => ({
            ...prev,
            [pinnedColumn.id]: document.getElementById(pinnedColumn.id)!
              .offsetLeft,
          }))
        );
  }, []);

  useEffect(() => {
    const handleResize = () =>
      setAvailableWindowWidth(containerElementRef.current?.offsetWidth);

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (containerElementRef.current)
      setAvailableWindowWidth(containerElementRef.current.offsetWidth);
  }, [containerElementRef.current]);

  const initialColumnFilters = useMemo(() => {
    const filters: ColumnFiltersState = [];
    searchParams.forEach((value, key) => {
      if (key.startsWith("filter_")) {
        filters.push({
          id: key.replace("filter_", ""),
          value,
        });
      }
    });
    return filters;
  }, [searchParams]);

  const getCommonPinningStyles = (column: Column<T>): CSSProperties => {
    const isPinned = column.getIsPinned();
    const isLastLeftPinnedColumn =
      isPinned === "left" && column.getIsLastColumn("left");

    return {
      boxShadow: isLastLeftPinnedColumn
        ? "-4px 0 4px -4px gray inset"
        : undefined,
      left: isPinned === "left" ? cellLeftMap[column.id] : undefined,
      opacity: isPinned ? 0.95 : 1,
      position: isPinned ? "sticky" : "relative",
      width: column.getSize(),
      zIndex: isPinned ? 1 : 0,
    };
  };

  const initialSorting = useMemo(() => {
    const sortParam = searchParams.get("sort");
    if (!sortParam) return [];
    // e.g. ?sort=age.desc
    const [id, desc] = sortParam.split(".");
    return [{ id, desc: desc === "desc" }] as SortingState;
  }, [searchParams]);

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

  const getLSPageSizeKey = () => `${location.pathname}-table-page-size`;

  //save selected pageSize to localStorage
  const setPageSize = (pageSize: number) => {
    table.setPageSize(pageSize);
    localStorage.setItem(getLSPageSizeKey(), pageSize.toString());
  };

  const getPageSize = () =>
    parseInt(localStorage.getItem(getLSPageSizeKey()) ?? "5");

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
        pageSize: initialState?.pagination?.pageSize ?? getPageSize(),
      },
    },
    enableColumnPinning: true,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    onColumnFiltersChange: (updater) => {
      let newFilters =
        typeof updater === "function"
          ? updater(table.getState().columnFilters)
          : updater;

      // update search params
      const params = new URLSearchParams(searchParams);
      // remove old filters
      [...params.keys()]
        .filter((k) => k.startsWith("filter_"))
        .forEach((k) => params.delete(k));
      // add new ones
      newFilters.forEach((f) => {
        params.set(`filter_${f.id}`, f.value as string);
      });
      setSearchParams(params);
    },
    onSortingChange: (updater) => {
      let newSorting =
        typeof updater === "function"
          ? updater(table.getState().sorting)
          : updater;

      const params = new URLSearchParams(searchParams);
      if (newSorting.length > 0) {
        const s = newSorting[0];
        params.set("sort", `${s.id}.${s.desc ? "desc" : "asc"}`);
      } else {
        params.delete("sort");
      }
      setSearchParams(params);
    },
    state: {
      sorting: initialSorting,
      columnFilters: initialColumnFilters,
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

  const resetFiltersAndSorting = () => {
    const params = new URLSearchParams(searchParams);
    [...params.keys()]
      .filter((k) => k.startsWith("filter_"))
      .forEach((k) => params.delete(k));
    params.delete("sort");
    setSearchParams(params);

    // Reset table state
    table.reset()
  };

  const handleExport = (selected: boolean) => {
    // Export function just returns the ids of the rows and visible columns, data fetching and excel
    // generation is handled by the backend
    if(!idColumn) return;

    const rowModel = selected ? table.getSelectedRowModel() : table.getPrePaginationRowModel();
    const itemIds = rowModel.rows.map((row) => row.original[idColumn]);
    const columnsVisible = table
      .getVisibleFlatColumns()
      .map((column) =>
        column.id.includes("_") ? column.id.split("_")[0] : column.id
      )
      .filter((columnId) => columnId !== "S.No");
    exportFunction!(itemIds, columnsVisible);
    
  };

  return (
    <div
      className="datatable mt-4 flex flex-col space-y-4"
      ref={containerElementRef}
    >
      <div
        className={
          isTableHeaderFixed
            ? `sticky top-0 z-20 h-16 bg-background`
            : undefined
        }
        style={
          isTableHeaderFixed
            ? { width: tableElementRef.current?.offsetWidth }
            : undefined
        }
      >
        <div
          className={
            isTableHeaderFixed
              ? "sticky left-2 z-30 flex h-full items-center justify-between space-x-2"
              : "flex h-full items-center justify-between space-x-2"
          }
          style={
            isTableHeaderFixed ? { width: availableWindowWidth } : undefined
          }
        >
          <div className="flex justify-center space-x-2">
            <ActionItemsMenu
              items={[
                {
                  label: "Clear All Filters",
                  icon: RotateCcwIcon,
                  onClick: resetFiltersAndSorting,
                },
                ...(exportFunction
                  ? [
                      {
                        label: "Export Current View",
                        icon: FileDownIcon,
                        onClick: () => handleExport(false),
                      },
                      {
                        label: "Export Selected from View",
                        icon: FileDownIcon,
                        onClick: () => handleExport(true),
                      },
                    ]
                  : []),
              ]}
            />
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="ml-auto">
                    Select Columns <ChevronDown />
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
          <div className="flex justify-center space-x-2">
            {additionalButtons}
          </div>
          <div className="px-5">
              {
              mainSearchColumn ?
              (
                <Input
                  placeholder={`Search ${String(mainSearchColumn)}..`}
                  className="w-128"
                  value={table.getColumn(String(mainSearchColumn))?.getFilterValue() as string}
                  onChange={(event) => table.getColumn(String(mainSearchColumn))?.setFilterValue(event.target.value)}
                />
              ) :
              undefined
              }
          </div>
        </div>
      </div>
      {data.length ? (
        <Table noWrapper={isTableHeaderFixed} ref={tableElementRef}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className={
                  isTableHeaderFixed
                    ? "sticky top-16 z-20 bg-background shadow-md hover:bg-background"
                    : undefined
                }
              >
                {/* Sticky first column (checkbox for select all) */}
                <TableHead
                  className="sticky left-0 w-2 z-3"
                  style={{ backgroundColor: HEADER_COLOR }}
                >
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

                {/* Other headers */}
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    id={header.column.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={`${header.column.getCanSort() ? "cursor-pointer select-none" : ""}`}
                    style={{ ...getCommonPinningStyles(header.column), backgroundColor: HEADER_COLOR }}
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
                        {renderFilter(header.column)}
                      </div>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.map((row, idx) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {/* Sticky first column (row checkbox) */}
                <TableCell
                  className="sticky left-0 z-10 w-2"
                  style={{
                    backgroundColor: idx % 2 ? ROW_COLOR_ODD : ROW_COLOR_EVEN,
                  }}
                >
                  <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                  />
                </TableCell>

                {/* Other cells */}
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={`${cell.column.id === "S.No" ? "min-w-2" : (cell.column.columnDef.meta?.tailwindWidthString ?? "")} ${
                      cell.column.columnDef.meta &&
                      ["date-range", "number-range"].includes(
                        cell.column.columnDef.meta.filterType ?? ""
                      )
                        ? "text-center"
                        : ""
                    }`}
                    style={{
                      ...getCommonPinningStyles(cell.column),
                      backgroundColor: idx % 2 ? ROW_COLOR_ODD : ROW_COLOR_EVEN,
                    }}
                    title={
                      cell.getValue() &&
                      (cell.getValue() as any).toString().length > 20
                        ? (cell.getValue() as any).toString()
                        : undefined
                    }
                  >
                    {cell.column.id === "S.No" ? (
                      cell.row.index + 1
                    ) : typeof columns.find(
                        (column) =>
                          column.header === cell.column.columnDef.header
                      )?.cell === "function" ||
                      (cell.getValue() &&
                        typeof cell.getValue() !== "string") ? (
                      flexRender(cell.column.columnDef.cell, cell.getContext())
                    ) : cell.getValue() ? (
                      <OverflowHandler text={cell.getValue() as string} />
                    ) : (
                      <div className="w-full p-0.5 text-center text-secondary">
                        Not Provided
                      </div>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}

            {/* Sum row (sticky first column) */}
            {columns.some((column) => column.meta?.calculateSum) && (
              <TableRow>
                <TableCell className="sticky left-0 z-10 w-2 bg-white opacity-100">
                  {/* empty cell for checkbox column */}
                </TableCell>
                {table.getVisibleLeafColumns().map((column) => (
                  <TableCell
                    key={column.id}
                    className="font-bold"
                    style={{
                      ...getCommonPinningStyles(column),
                      backgroundColor: ROW_COLOR_EVEN,
                    }}
                  >
                    {column.columnDef.meta?.calculateSum?.(
                      table.getRowModel().rows.map((row) => row.original)
                    )}
                  </TableCell>
                ))}
              </TableRow>
            )}
          </TableBody>
        </Table>
      ) : (
        <div>
          <div className="border-1 flex h-40 flex-col items-center justify-center rounded-md border-primary">
            <p className="text-lg text-gray-500">No data</p>
          </div>
        </div>
      )}

      <div
        style={
          isTableHeaderFixed
            ? { width: tableElementRef.current?.offsetWidth }
            : undefined
        }
      >
        <div
          className={
            isTableHeaderFixed
              ? "sticky left-2 z-20 flex items-center justify-between space-x-2 py-4"
              : "flex items-center justify-between space-x-2 py-4"
          }
          style={
            isTableHeaderFixed ? { width: availableWindowWidth } : undefined
          }
        >
          <div className="text-sm text-muted-foreground">
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
    </div>
  );
}
