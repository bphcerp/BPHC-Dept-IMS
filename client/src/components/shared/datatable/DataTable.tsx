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

const HEADER_COLOR = "#E8E8F0";
const ROW_COLOR_ODD = "#F7F7FB";
const ROW_COLOR_EVEN = "white";

type BaseTableProps<T> = {
  data: T[];
  columns: ColumnDef<T>[];
  initialState?: InitialTableState;
  setSelected?: (selected: T[]) => void;
  additionalButtons?: ReactNode;
  exportFunction?: (itemIds: string[], columnsVisible: string[]) => void;
  isTableHeaderFixed?: boolean;
  tableElementRefProp?: MutableRefObject<HTMLTableElement | null>;
  mainSearchColumn?: keyof T;
};

type AltTableProps1<T> = {
  exportFunction?: (itemIds: T[keyof T][], columnsVisible: string[]) => void;
  idColumn: keyof T;
};

type AltTableProps2 = {
  exportFunction?: never;
  idColumn?: never;
};

type DataTableProps<T> = BaseTableProps<T> &
  (AltTableProps1<T> | AltTableProps2);

export type TableFilterType =
  | "dropdown"
  | "multiselect"
  | "search"
  | "number-range"
  | "date-range";

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
  mainSearchColumn,
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
    const element = containerElementRef.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setAvailableWindowWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(element);

    return () => resizeObserver.disconnect();
  }, []);

  const initialColumnFilters = useMemo(() => {
    const filters: ColumnFiltersState = [];
    searchParams.forEach((value, key) => {
      if (key.startsWith("filter_")) {
        let parsedValue: any = value;
        try {
          if (value.startsWith("[") || value.startsWith("{")) {
            parsedValue = JSON.parse(value);
          }
        } catch (e) {
          console.warn("Failed to parse filter from URL search param:", e);
          parsedValue = value;
        }

        filters.push({
          id: key.replace("filter_", ""),
          value: parsedValue,
        });
      }
    });
    return filters;
  }, [searchParams]);

  const initialSorting = useMemo(() => {
    const sortParam = searchParams.get("sort");
    if (!sortParam) return [];
    const [id, desc] = sortParam.split(".");
    return [{ id, desc: desc === "desc" }] as SortingState;
  }, [searchParams]);

  const [columnFilters, setColumnFilters] =
    useState<ColumnFiltersState>(initialColumnFilters);
  const [sorting, setSorting] = useState<SortingState>(initialSorting);

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

  const isWithinRange = (row: Row<T>, columnId: string, value: any) => {
    const [startDateString, endDateString] = value as [
      string | undefined,
      string | undefined,
    ];

    if (!startDateString && !endDateString) return true;

    const rawDate = row.getValue(columnId);

    if (!rawDate) {
      return false;
    }

    const date = new Date(rawDate as string | number | Date);

    if (isNaN(date.getTime())) {
      return false;
    }

    const cellTime = date.getTime();

    let startTime = -Infinity;
    if (startDateString) {
      const start = new Date(startDateString);
      start.setHours(0, 0, 0, 0);
      startTime = start.getTime();
    }

    let endTime = Infinity;
    if (endDateString) {
      const end = new Date(endDateString);
      end.setHours(23, 59, 59, 999);
      endTime = end.getTime();
    }

    return cellTime >= startTime && cellTime <= endTime;
  };

  const isWithinRangeNumber = (row: Row<T>, columnId: string, value: any) => {
    const rawValue = row.getValue(columnId);

    const [startNum, endNum] = value as [
      number | undefined,
      number | undefined,
    ];

    if (startNum === undefined && endNum === undefined) {
      return true;
    }

    if (rawValue === null || rawValue === undefined || rawValue === "") {
      return false;
    }

    const cellValue = Number(rawValue);

    if (isNaN(cellValue)) {
      return false;
    }

    const min = startNum ?? -Infinity;
    const max = endNum ?? Infinity;

    return cellValue >= min && cellValue <= max;
  };

  const multiFilterFn = (row: Row<T>, columnId: string, filterValue: any) => {
    if (!filterValue || filterValue.length === 0) return true;
    return filterValue.includes(row.getValue(columnId));
  };

  const getLSPageSizeKey = () => `${location.pathname}-table-page-size`;

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
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
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

  const saveFiltersToUrl = () => {
    setSearchParams(
      (prevParams) => {
        const newParams = new URLSearchParams(prevParams);
        [...newParams.keys()]
          .filter((k) => k.startsWith("filter_"))
          .forEach((k) => newParams.delete(k));
        newParams.delete("sort");

        columnFilters.forEach((f) => {
          let valueToStore: string | undefined;

          if (Array.isArray(f.value)) {
            if (
              f.value.every((v) => v === undefined || v === null || v === "")
            ) {
              valueToStore = undefined;
            } else {
              valueToStore = JSON.stringify(f.value);
            }
          } else {
            valueToStore = f.value as string;
          }

          if (valueToStore) {
            newParams.set(`filter_${f.id}`, valueToStore);
          }
        });

        if (sorting.length > 0) {
          const s = sorting[0];
          newParams.set("sort", `${s.id}.${s.desc ? "desc" : "asc"}`);
        }

        return newParams;
      },
      { replace: true }
    );
  };

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
            value={(column.getFilterValue() as string) ?? ""}
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
                const prevFilterValue = (column.getFilterValue() as [
                  number,
                  number,
                ]) ?? [undefined, undefined];
                const newValue = event.target.value;
                const min = newValue === "" ? undefined : Number(newValue);
                column.setFilterValue([min, prevFilterValue[1]]);
              }}
              placeholder="Min"
            />
            <Input
              type="number"
              value={(column.getFilterValue() as [number, number])?.[1] ?? ""}
              onChange={(event) => {
                const prevFilterValue = (column.getFilterValue() as [
                  number,
                  number,
                ]) ?? [undefined, undefined];
                const newValue = event.target.value;
                const max = newValue === "" ? undefined : Number(newValue);
                column.setFilterValue([prevFilterValue[0], max]);
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
                const prevFilterValue = (column.getFilterValue() as [
                  string,
                  string,
                ]) ?? [undefined, undefined];
                const newValue = event.target.value;
                const min = newValue === "" ? undefined : newValue;
                column.setFilterValue([min, prevFilterValue[1]]);
              }}
            />
            <Input
              type="date"
              value={(column.getFilterValue() as [string, string])?.[1] ?? ""}
              onChange={(event) => {
                const prevFilterValue = (column.getFilterValue() as [
                  string,
                  string,
                ]) ?? [undefined, undefined];
                const newValue = event.target.value;
                const max = newValue === "" ? undefined : newValue;
                column.setFilterValue([prevFilterValue[0], max]);
              }}
            />
          </div>
        );
      default:
        return null;
    }
  };

  const resetFiltersAndSorting = () => {
    table.resetColumnFilters();
    table.resetSorting();

    setSearchParams(
      (prevParams) => {
        const newParams = new URLSearchParams(prevParams);
        [...newParams.keys()]
          .filter((k) => k.startsWith("filter_"))
          .forEach((k) => newParams.delete(k));
        newParams.delete("sort");
        return newParams;
      },
      { replace: true }
    );
  };

  const camelToTitle = (str: string) =>
    str.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

  const handleExport = (selected: boolean) => {
    if (!idColumn) return;

    const rowModel = selected
      ? table.getSelectedRowModel()
      : table.getPrePaginationRowModel();
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
            <Button variant="outline" onClick={saveFiltersToUrl}>Save Filters to URL</Button>
            {mainSearchColumn && (
              <Input
                placeholder={`Search ${String(camelToTitle(mainSearchColumn.toString()))}..`}
                className="w-128"
                value={
                  (table
                    .getColumn(String(mainSearchColumn))
                    ?.getFilterValue() as string) ?? ""
                }
                onChange={(event) =>
                  table
                    .getColumn(String(mainSearchColumn))
                    ?.setFilterValue(event.target.value)
                }
              />
            )}
          </div>
          <div className="flex justify-center space-x-2">
            {additionalButtons}
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
                <TableHead
                  className="sticky left-0 z-[3] w-2"
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

                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    id={header.column.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={`${header.column.getCanSort() ? "cursor-pointer select-none" : ""}`}
                    style={{
                      ...getCommonPinningStyles(header.column),
                      backgroundColor: HEADER_COLOR,
                    }}
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

            {columns.some((column) => column.meta?.calculateSum) && (
              <TableRow>
                <TableCell className="sticky left-0 z-10 w-2 bg-white opacity-100"></TableCell>
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
