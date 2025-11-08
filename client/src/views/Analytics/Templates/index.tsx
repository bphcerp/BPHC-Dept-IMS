'use-client'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import api from "@/lib/axios-instance";
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
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { analyticsSchemas } from "lib";
import { Plus, Trash2 } from "lucide-react";

const fetchTemplates = async (): Promise<
    { id: string, title: string, slides: number }[]
> => {
    const response = await api.get<{ id: string, title: string, slides: number }[]>(
        "/analytics/templates/"
    );
    return response.data;
};

const deleteTemplate = async (id: string): Promise<
    { id: string }[]
> => {
    const response = await api.delete<{ id: string }[]>(
        `/analytics/templates/delete/${id}`
    );
    return response.data;
};

const createTemplate = async (template: analyticsSchemas.Template): Promise<
    { id: string }[]
> => {
    const response = await api.post<{ id: string }[]>(
        "/analytics/templates/create", template
    );
    return response.data;
};

export default function PresentationTemplates() {
    const queryClient = useQueryClient();

    const [sorting, setSorting] = useState<SortingState>([]);
    const navigate = useNavigate();

    const { data, isLoading, isError } = useQuery({
        queryKey: ["presentation:templates"],
        queryFn: fetchTemplates,
    });


    const createTemplateMutation = useMutation({
        mutationFn: createTemplate,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["presentation:templates"] });
            toast.success("Template created!");
        },
        onError: (err: any) => {
            toast.error(`Failed to create: ${err.message}`);
        }
    });

    const deleteTemplateMutation = useMutation({
        mutationFn: deleteTemplate,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["presentation:templates"] });
            toast.success("Template deleted!");
        },
        onError: (err: any) => {
            toast.error(`Failed to delete: ${err.message}`);
        }
    });

    const columns: ColumnDef<{
        id: string;
        title: string;
        slides: number;
    }>[] = [
            {
                header: () => {
                    return (
                        <p
                            className="flex w-full items-center justify-start p-0 font-semibold text-foreground"
                        >
                            SI. No
                        </p>
                    );
                },
                accessorKey: "id",
                cell: ({ row }) => row.index + 1,
            },
            {
                header: ({ column }) => {
                    return (
                        <Button
                            variant="link"
                            onClick={() => column.toggleSorting(column.getIsSorted() !== "desc")}
                            className="flex w-full min-w-32 items-center justify-start p-0 font-semibold text-foreground"
                        >
                            Title
                        </Button>
                    );
                },
                accessorKey: "title"
            },
            {
                header: () => {
                    return (
                        <p
                            className="flex max-w-1 items-center justify-start p-0 font-semibold text-foreground"
                        >
                            Delete
                        </p>
                    );
                },
                accessorKey: "delete",
                cell: ({ row }) => {
                    return <Button
                        variant="ghost"
                        onClick={(e) => {
                            e.stopPropagation();
                            deleteTemplateMutation.mutate(row.id);
                        }}
                        className="items-center justify-start p-0 font-semibold text-foreground"
                    >
                        <Trash2 className="w-6 h-6 stroke-[#dd0000]" />
                    </Button>
                }
            }
        ];

    const table = useReactTable({
        data: data ?? [],
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
            <div className="flex w-full justify-between">
                <h2 className="self-start text-3xl font-normal">
                    Manage Templates
                </h2>
                <Button
                    variant={"outline"}
                    className="rounded-full w-10 h-10"
                    onClick={() => createTemplateMutation.mutate({ title: "New Template", slides: [] })}
                >
                    <Plus className="w-6 h-6"></Plus>
                </Button>
            </div>
            {isLoading && <p>Loading...</p>}
            {isError && <p>Error loading templates</p>}
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
                                        onClick={()=>navigate(row.original.id)}
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