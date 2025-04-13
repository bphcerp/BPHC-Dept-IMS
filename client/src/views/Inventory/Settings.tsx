import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ColumnDef } from "@tanstack/react-table";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { TableFilterType, DataTable } from "@/components/inventory/DataTable";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "@/lib/axios-instance";
import { Laboratory, Category, Vendor, NewLaboratoryRequest, NewVendorRequest, NewCategoryRequest } from "./types";
import AddInventoryCategoryDialog from "@/components/inventory/AddInventoryCategoryDialog";
import AddLabDialog from "@/components/inventory/AddLabDialog";
import AddVendorCategoryDialog from "@/components/inventory/AddVendorCategoryDialog";
import AddVendorDialog from "@/components/inventory/AddVendorDialog";
import DeleteConfirmationDialog from "@/components/inventory/DeleteConfirmationDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const labColumns: ColumnDef<Laboratory>[] = [
    { accessorFn: () => 'S.No', header: 'S.No', cell: ({ row }) => row.index + 1 },
    { accessorKey: 'createdAt', header: 'Created At', cell: ({ getValue }) => new Date(getValue() as string).toLocaleString(), enableColumnFilter: false },
    { accessorKey: 'updatedAt', header: 'Updated At', cell: ({ getValue }) => new Date(getValue() as string).toLocaleString(), enableColumnFilter: false },
    { accessorKey: 'name', header: 'Name', meta: { filterType: 'search' as TableFilterType } },
    { accessorKey: 'code', header: 'Code', meta: { filterType: 'search' as TableFilterType } },
    { accessorKey: 'location', header: 'Location', meta: { filterType: 'search' as TableFilterType } },
    { accessorKey: 'technicianInCharge.name', header: 'Technician In Charge' },
    { accessorKey: 'facultyInCharge.name', header: 'Faculty In Charge' },
];

const categoryColumns: ColumnDef<Category>[] = [
    { accessorFn: () => 'S.No', header: 'S.No', cell: ({ row }) => row.index + 1 },
    { accessorKey: 'createdAt', header: 'Created At', cell: ({ getValue }) => new Date(getValue() as string).toLocaleString(), enableColumnFilter: false },
    { accessorKey: 'updatedAt', header: 'Updated At', cell: ({ getValue }) => new Date(getValue() as string).toLocaleString(), enableColumnFilter: false },
    { accessorKey: 'name', header: 'Name', meta: { filterType: 'search' as TableFilterType } },
    { accessorKey: 'code', header: 'Code', meta: { filterType: 'search' as TableFilterType } },
];

const vendorColumns: ColumnDef<Vendor>[] = [
    { accessorFn: () => 'S.No', header: 'S.No', cell: ({ row }) => row.index + 1 },
    { accessorKey: 'createdAt', header: 'Created At', cell: ({ getValue }) => new Date(getValue() as string).toLocaleString(), enableColumnFilter: false },
    { accessorKey: 'updatedAt', header: 'Updated At', cell: ({ getValue }) => new Date(getValue() as string).toLocaleString(), enableColumnFilter: false },
    { accessorKey: 'vendorId', header: 'Vendor ID', meta: { filterType: 'search' as TableFilterType } },
    { accessorKey: 'name', header: 'Name', meta: { filterType: 'search' as TableFilterType } },
    { accessorKey: 'address', header: 'Address' },
    { accessorKey: 'pocName', header: 'POC Name' },
    { accessorKey: 'phoneNumber', header: 'Phone Number' },
    { accessorKey: 'email', header: 'Email' },
];

const Settings = () => {
    const [searchParams] = useSearchParams()
    const [selectedOption, setSelectedOption] = useState<string | null>(searchParams.get("view"));
    const [data, setData] = useState<Laboratory[] | Vendor[] | Category[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const [isLabAddDialogOpen, setIsLabAddDialogOpen] = useState(false)
    const [isVendorAddDialogOpen, setIsVendorAddDialogOpen] = useState(false)
    const [isVendorCategoryAddDialogOpen, setIsVendorCategoryAddDialogOpen] = useState(false)
    const [isInventoryCategoryAddDialogOpen, setIsInventoryCategoryAddDialogOpen] = useState(false)

    const [selected, setSelected] = useState<Laboratory[] | Vendor[] | Category[]>([])

    type RouteMap = {
        create: string
        read: string
        update: string
        delete: string
    }
    const routeMap: Record<string, RouteMap> = {
        "Labs": {
            create: "/labs",
            read: "/labs/getLabs",
            update: "/labs",
            delete: "/labs"
        },
        "Vendors": {
            create: "/vendors",
            read: "/vendors",
            update: "/vendors",
            delete: "/vendors"
        },
        "VendorCategory": {
            create: "/categories?type=Vendor",
            read: "/categories?type=Vendor",
            update: "/categories",
            delete: "/categories"
        },
        "InventoryCategory": {
            create: "/categories?type=Inventory",
            read: "/categories?type=Inventory",
            update: "/categories",
            delete: "/categories"
        }
    };

    const fetchData = () => {
        if (selectedOption) {
            if (!routeMap[selectedOption]) {
                navigate("", { replace: true });
                setSelectedOption(null);
                return;
            }
            setLoading(true);
            api(`/inventory${routeMap[selectedOption].read}`)
                .then(({ data }) => {
                    setData(data);
                    setLoading(false);
                });
        }
    }

    useEffect(() => {
        const addItemParam = searchParams.get('action')
        if (addItemParam === 'addLab') setIsLabAddDialogOpen(true)
        else if (addItemParam === 'addVendor') setIsVendorAddDialogOpen(true)
        else if (addItemParam === 'addVendorCategory') setIsInventoryCategoryAddDialogOpen(true)
        else if (addItemParam === 'addInventoryCategory') setIsInventoryCategoryAddDialogOpen(true)

        fetchData()
    }, [selectedOption]);

    const handleAddLab = (newLab: NewLaboratoryRequest, edit?: boolean) => {
        const route = edit ? `${routeMap["Labs"].update}/${selected[0].id}` : routeMap["Labs"].create;
        const method = edit ? api.patch : api.post;
        method(route, { ...newLab, id: edit ? selected[0].id : undefined })
            .then(() => {
                fetchData();
                toast.success(edit ? "Lab edited successfully" : "Lab added successfully");
            })
            .catch((err) => {
                console.error({ message: `Error ${edit ? "editing" : "adding"} lab`, err });
                toast.error(((err as AxiosError).response?.data as any).message ?? `Error ${edit ? "editing" : "adding"} lab`);
            });
    };

    const handleAddVendor = (newVendor: NewVendorRequest, edit?: boolean) => {
        const route = edit ? `${routeMap["Vendors"].update}/${selected[0].id}` : routeMap["Vendors"].create;
        const method = edit ? api.patch : api.post;
        method(route, { ...newVendor, id: edit ? selected[0].id : undefined })
            .then(() => {
                fetchData();
                toast.success(edit ? "Vendor edited successfully" : "Vendor added successfully");
            })
            .catch((err) => {
                console.error({ message: `Error ${edit ? "editing" : "adding"} vendor`, err });
                toast.error(((err as AxiosError).response?.data as any).message ?? `Error ${edit ? "editing" : "adding"} vendor`);
            });
    };

    const handleAddCategory = (newCategory: NewCategoryRequest, type: "Vendor" | "Inventory", edit?: boolean) => {
        const route = edit ? `${routeMap[type === "Vendor" ? "VendorCategory" : "InventoryCategory"].update}/${selected[0].id}` : routeMap[type === "Vendor" ? "VendorCategory" : "InventoryCategory"].create;
        const method = edit ? api.patch : api.post;
        method(route, { ...newCategory, id: edit ? selected[0].id : undefined, type })
            .then(() => {
                fetchData();
                toast.success(edit ? "Category edited successfully" : "Category added successfully");
            })
            .catch((err) => {
                console.error({ message: `Error ${edit ? "editing" : "adding"} category`, err });
                toast.error(((err as AxiosError).response?.data as any).message ?? `Error ${edit ? "editing" : "adding"} category`);
            });
    };

    const handleDelete = () => {
        if (!selectedOption || selected.length !== 1) return;

        const route = `${routeMap[selectedOption].delete}/${selected[0].id}`;
        api
            .delete(route)
            .then(() => {
                fetchData();
                toast.success("Item deleted successfully");
            })
            .catch((err) => {
                console.error({ message: "Error deleting item", err });
                toast.error(((err as AxiosError).response?.data as any).message ?? "Error deleting item");
            });
    };

    return (
        <div className="w-full p-4">
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

            {loading ? (
                <div className="mt-4 space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-96 w-full" />
                    <Skeleton className="h-8 w-full" />
                </div>
            ) : (
                <div className="mt-4">
                    {data.length > 0 ? (
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
                        <div className="flex flex-col items-center justify-center h-64">
                            <p className="text-lg text-gray-500">No data available</p>
                            {!selectedOption && <p className="text-sm text-gray-400">Please select a setting to view the data</p>}
                        </div>
                    </div>}
                </div>
            )}
        </div>
    );
};

export default Settings;