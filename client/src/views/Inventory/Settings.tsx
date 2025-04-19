import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ColumnDef } from "@tanstack/react-table";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { TableFilterType, DataTable } from "@/components/inventory/DataTable";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "@/lib/axios-instance";
import AddInventoryCategoryDialog from "@/components/inventory/AddInventoryCategoryDialog";
import AddLabDialog from "@/components/inventory/AddLabDialog";
import AddVendorCategoryDialog from "@/components/inventory/AddVendorCategoryDialog";
import AddVendorDialog from "@/components/inventory/AddVendorDialog";
import DeleteConfirmationDialog from "@/components/inventory/DeleteConfirmationDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Laboratory, Category, Vendor, NewLaboratoryRequest, NewVendorRequest, NewCategoryRequest } from "node_modules/lib/src/types/inventory";

const labColumns: ColumnDef<Laboratory>[] = [
    { accessorFn: () => 'S.No', header: 'S.No', cell: ({ row }) => row.index + 1 },
    { accessorKey: 'createdAt', header: 'Created At', cell: ({ getValue }) => new Date(getValue() as string).toLocaleString(), enableColumnFilter: false },
    { accessorKey: 'updatedAt', header: 'Updated At', cell: ({ getValue }) => new Date(getValue() as string).toLocaleString(), enableColumnFilter: false },
    { accessorKey: 'name', header: 'Name', meta: { tailwindWidthString: 'min-w-28' } },
    { accessorKey: 'code', header: 'Code', meta: { filterType: 'search' as TableFilterType } },
    { accessorKey: 'location', header: 'Location', meta: { filterType: 'search' as TableFilterType } },
    { accessorKey: 'technicianInCharge.name', header: 'Technician In Charge' },
    { accessorKey: 'facultyInCharge.name', header: 'Faculty In Charge' },
];

const categoryColumns: ColumnDef<Category>[] = [
    { accessorFn: () => 'S.No', header: 'S.No', cell: ({ row }) => row.index + 1 },
    { accessorKey: 'createdAt', header: 'Created At', cell: ({ getValue }) => new Date(getValue() as string).toLocaleString(), enableColumnFilter: false },
    { accessorKey: 'updatedAt', header: 'Updated At', cell: ({ getValue }) => new Date(getValue() as string).toLocaleString(), enableColumnFilter: false },
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'code', header: 'Code', meta: { filterType: 'search' as TableFilterType } },
];

const vendorColumns: ColumnDef<Vendor>[] = [
    { accessorFn: () => 'S.No', header: 'S.No', cell: ({ row }) => row.index + 1 },
    { accessorKey: 'createdAt', header: 'Created At', cell: ({ getValue }) => new Date(getValue() as string).toLocaleString(), enableColumnFilter: false },
    { accessorKey: 'updatedAt', header: 'Updated At', cell: ({ getValue }) => new Date(getValue() as string).toLocaleString(), enableColumnFilter: false },
    { accessorKey: 'vendorId', header: 'Vendor ID', meta: { filterType: 'search' as TableFilterType } },
    { accessorKey: 'name', header: 'Name', meta: { tailwindWidthString: 'min-w-52' } },
    { accessorKey: 'address', header: 'Address' },
    { accessorKey: 'pocName', header: 'POC Name' },
    { accessorKey: 'phoneNumber', header: 'Phone Number' },
    { accessorKey: 'email', header: 'Email' },
];

const Settings = () => {
    const [searchParams] = useSearchParams()
    const [selectedOption, setSelectedOption] = useState<string | null>(searchParams.get("view"));
    const [data, setData] = useState<Laboratory[] | Vendor[] | Category[]>([]);
    const navigate = useNavigate();

    const [isLabAddDialogOpen, setIsLabAddDialogOpen] = useState(false)
    const [isVendorAddDialogOpen, setIsVendorAddDialogOpen] = useState(false)
    const [isVendorCategoryAddDialogOpen, setIsVendorCategoryAddDialogOpen] = useState(false)
    const [isInventoryCategoryAddDialogOpen, setIsInventoryCategoryAddDialogOpen] = useState(false)

    const [selected, setSelected] = useState<Laboratory[] | Vendor[] | Category[]>([])

    type RouteMap = {
        create: string
        read: string
        update: string | ((id: string) => string)
        delete: string | ((id: string) => string)
    }
    const routeMap: Record<string, RouteMap> = {
        "Labs": {
            create: "/inventory/labs/create",
            read: "/inventory/labs/get",
            update: "/inventory/labs/update",
            delete: "/inventory/labs/delete"
        },
        "Vendors": {
            create: "/inventory/vendors/create",
            read: "/inventory/vendors/get",
            update: "/inventory/vendors/update",
            delete: "/inventory/vendors/delete"
        },
        "VendorCategory": {
            create: "/inventory/categories/create?type=Vendor",
            read: "/inventory/categories/get?type=Vendor",
            update: (id: string) => `/inventory/categories/update/${id}?type=Vendor`,
            delete: (id: string) => `/inventory/categories/delete/${id}?type=Vendor`
        },
        "InventoryCategory": {
            create: "/inventory/categories/create?type=Inventory",
            read: "/inventory/categories/get?type=Inventory",
            update: (id: string) => `/inventory/categories/update/${id}?type=Inventory`,
            delete: (id: string) => `/inventory/categories/delete/${id}?type=Inventory`
        }
    };

    const { isSuccess, isFetching, refetch } = useQuery({
        queryKey: ["settings", selectedOption],
        queryFn: async () => {
            const response = await api(routeMap[selectedOption!].read)
            setData(response.data)
            return response.data
        },
        refetchOnWindowFocus: false,
        enabled: !!selectedOption,
    });

    useEffect(() => {
        const addItemParam = searchParams.get('action')
        if (addItemParam === 'addLab') setIsLabAddDialogOpen(true)
        else if (addItemParam === 'addVendor') setIsVendorAddDialogOpen(true)
        else if (addItemParam === 'addVendorCategory') setIsInventoryCategoryAddDialogOpen(true)
        else if (addItemParam === 'addInventoryCategory') setIsInventoryCategoryAddDialogOpen(true)

        refetch()
    }, [selectedOption]);

    const handleAddLab = (newLab: NewLaboratoryRequest, edit?: boolean) => {
        const route = edit ? `${routeMap["Labs"].update}/${selected[0].id}` : routeMap["Labs"].create;
        const method = edit ? api.patch : api.post;
        method(route, { ...newLab, id: edit ? selected[0].id : undefined })
            .then(() => {
                refetch();
                toast.success(edit ? "Lab edited successfully" : "Lab added successfully");
            })
            .catch((err) => {
                console.error({ message: `Error ${edit ? "editing" : "adding"} lab`, err });
                toast.error(((err as AxiosError).response?.data as any).message ?? (err as AxiosError).response?.data ?? `Error ${edit ? "editing" : "adding"} lab`);
            });
    };

    const handleAddVendor = (newVendor: NewVendorRequest, edit?: boolean) => {
        const route = edit ? `${routeMap["Vendors"].update}/${selected[0].id}` : routeMap["Vendors"].create;
        const method = edit ? api.patch : api.post;
        method(route, { ...newVendor, id: edit ? selected[0].id : undefined })
            .then(() => {
                refetch();
                toast.success(edit ? "Vendor edited successfully" : "Vendor added successfully");
            })
            .catch((err) => {
                console.error({ message: `Error ${edit ? "editing" : "adding"} vendor`, err });
                toast.error(((err as AxiosError).response?.data as any).message ?? (err as AxiosError).response?.data ?? `Error ${edit ? "editing" : "adding"} vendor`);
            });
    };

    const handleAddCategory = (newCategory: NewCategoryRequest, type: "Vendor" | "Inventory", edit?: boolean) => {
        const route = edit ? (routeMap[type === "Vendor" ? "VendorCategory" : "InventoryCategory"].update as (id: string) => string)(selected[0].id) : routeMap[type === "Vendor" ? "VendorCategory" : "InventoryCategory"].create;
        const method = edit ? api.patch : api.post;
        method(route, { ...newCategory, id: edit ? selected[0].id : undefined, type })
            .then(() => {
                refetch();
                toast.success(edit ? "Category edited successfully" : "Category added successfully");
            })
            .catch((err) => {
                console.error({ message: `Error ${edit ? "editing" : "adding"} category`, err });
                toast.error(((err as AxiosError).response?.data as any).message ?? (err as AxiosError).response?.data ?? `Error ${edit ? "editing" : "adding"} category`);
            });
    };

    const handleDelete = () => {
        if (!selectedOption || selected.length !== 1) return;

        const route = `${routeMap[selectedOption].delete}/${selected[0].id}`;
        api
            .delete(route)
            .then(() => {
                refetch();
                toast.success("Item deleted successfully");
            })
            .catch((err) => {
                console.error({ message: "Error deleting item", err });
                toast.error(((err as AxiosError).response?.data as any).message ?? (err as AxiosError).response?.data ?? "Error deleting item");
            });
    };

    return (
        <div className="flex flex-col space-y-4 p-4">
            <h1 className="text-3xl font-bold text-primary">Settings</h1>
            <div className="flex justify-between items-center">
                <Select value={selectedOption ?? undefined} onValueChange={(value) => {
                    setData([])
                    navigate(`?view=${value}`)
                    setSelectedOption(value)
                }}>
                    <SelectTrigger className="w-[220px]">
                        <SelectValue placeholder="Select a setting" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Labs">Labs</SelectItem>
                        <SelectItem value="Vendors">Vendors</SelectItem>
                        <SelectItem value="VendorCategory">Vendor Category</SelectItem>
                        <SelectItem value="InventoryCategory">Inventory Category</SelectItem>
                    </SelectContent>
                </Select>
                <div className="flex space-x-2">
                    {selectedOption && selected.length === 1 && (
                        <DeleteConfirmationDialog onConfirm={handleDelete} />
                    )}
                    {selectedOption && selectedOption === "Labs" && (
                        <AddLabDialog editInitialData={selected.length === 1 ? selected[0] as Laboratory : undefined} isOpen={isLabAddDialogOpen} setIsOpen={setIsLabAddDialogOpen} onAddLab={handleAddLab} />
                    )}
                    {selectedOption && selectedOption === "Vendors" && (
                        <AddVendorDialog
                            editInitialData={selected.length === 1 ? selected[0] as Vendor : undefined}
                            isOpen={isVendorAddDialogOpen}
                            setIsOpen={setIsVendorAddDialogOpen}
                            onAddVendor={(data) => handleAddVendor(data, selected.length === 1)}
                        />
                    )}
                    {selectedOption && selectedOption === "VendorCategory" && (
                        <AddVendorCategoryDialog
                            editInitialData={selected.length === 1 ? selected[0] as Category : undefined}
                            isOpen={isVendorCategoryAddDialogOpen}
                            setIsOpen={setIsVendorCategoryAddDialogOpen}
                            onAddCategory={(data) => handleAddCategory(data, "Vendor", selected.length === 1)}
                        />
                    )}
                    {selectedOption && selectedOption === "InventoryCategory" && (
                        <AddInventoryCategoryDialog
                            editInitialData={selected.length === 1 ? selected[0] as Category : undefined}
                            isOpen={isInventoryCategoryAddDialogOpen}
                            setIsOpen={setIsInventoryCategoryAddDialogOpen}
                            onAddCategory={(data) => handleAddCategory(data, "Inventory", selected.length === 1)}
                        />
                    )}
                </div>
            </div>
            {isFetching ? (
                selectedOption ? <div className="mt-4 space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-96 w-full" />
                    <Skeleton className="h-8 w-full" />
                </div> : <div className="flex flex-col items-center justify-center h-64">
                    <p className="text-lg text-gray-500">No data available</p>
                    <p className="text-sm text-gray-400">Please select a setting to view the data</p>
                </div>
            ) : (
                <div className="mt-4">
                    {isSuccess ? (
                        selectedOption === "Labs" ? (
                            <DataTable<Laboratory> data={data as Laboratory[]} columns={labColumns} mainSearchColumn="name" setSelected={setSelected as any} />
                        ) : selectedOption === 'Vendors' ? (
                            <DataTable<Vendor> data={data as Vendor[]} columns={vendorColumns} mainSearchColumn="name" setSelected={setSelected as any} /> // Vendor table
                        ) : selectedOption === 'VendorCategory' ? (
                            <DataTable<Category> data={data as Category[]} columns={categoryColumns} mainSearchColumn="name" setSelected={setSelected as any} /> // Vendor table
                        ) : (
                            <DataTable<Category> data={data as Category[]} columns={categoryColumns} mainSearchColumn="name" setSelected={setSelected as any} /> // Vendor table
                        )
                    ) : <div>
                        <div className="flex flex-col items-center justify-center h-64 text-red-500">
                            <p className="text-lg">Something went wrong</p>
                            <p className="text-sm text-red-400">Please contact the website administrator</p>
                        </div>
                    </div>}
                </div>
            )}
        </div>
    );
};

export default Settings;