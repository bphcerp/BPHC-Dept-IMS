import { useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { AxiosError } from "axios";
import {
  TableFilterType,
  DataTable,
} from "@/components/shared/datatable/DataTable";
import { TransferConfirmationDialog } from "@/components/inventory/TransferConfirmationDialog";
import VendorDetailsDialog from "@/components/inventory/VendorDetailsDialog";
import api from "@/lib/axios-instance";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/Auth";
import { useQuery } from "@tanstack/react-query";
import { permissions } from "lib";
import { InventoryItem, Vendor } from "node_modules/lib/src/types/inventory";
import { DEPARTMENT_NAME } from "@/lib/constants";
import DeleteItemConfirmationDialog from "@/components/inventory/DeleteItemConfirmationDialog";

export const ItemsView = () => {
  // const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);

  const [vendorDetails, setVendorDetails] = useState<Vendor | null>(null);
  const [isVendorDialogOpen, setVendorDialogOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<InventoryItem[]>([]);
  const [isTransferDialogOpen, setTransferDialogOpen] = useState(false);
  const tableElementRef = useRef<HTMLTableElement | null>(null);

  const { checkAccess } = useAuth();

  const navigate = useNavigate();

  const handleVendorClick = (vendor: Vendor) => {
    setVendorDetails(vendor);
    setVendorDialogOpen(true);
  };

  const handleTransferSuccess = () => {
    setSelectedItems([]);
    setTransferDialogOpen(false);
    toast.success("Transfer completed successfully!");
  };

  const columns: ColumnDef<InventoryItem>[] = [
    {
      accessorFn: () => "S.No",
      header: "S.No",
    },
    {
      accessorKey: "equipmentID",
      header: "Equipment ID",
      meta: {
        filterType: "search" as TableFilterType,
        tailwindWidthString: "min-w-64",
      },
    },
    {
      accessorKey: "itemName",
      header: "Item Name",
      meta: { tailwindWidthString: "min-w-44" },
    },
    {
      accessorKey: "itemCategory.name",
      header: "Category",
      meta: {
        filterType: "dropdown" as TableFilterType,
        tailwindWidthString: "min-w-28",
      },
    },
    {
      accessorKey: "poNumber",
      header: "PO Number",
      meta: { filterType: "search" as TableFilterType },
    },

    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ getValue }) => new Date(getValue() as string).toLocaleString(),
      enableColumnFilter: false,
    },
    {
      accessorKey: "updatedAt",
      header: "Updated At",
      cell: ({ getValue }) => new Date(getValue() as string).toLocaleString(),
      enableColumnFilter: false,
    },
    {
      accessorKey: "lab.name",
      header: "Laboratory",
      meta: {
        filterType: "multiselect" as TableFilterType,
        tailwindWidthString: "min-w-32",
      },
    },
    {
      accessorKey: "labInchargeAtPurchase",
      header: "Lab Incharge at Purchase",
    },
    {
      accessorKey: "labTechnicianAtPurchase",
      header: "Lab Technician at Purchase",
    },
    {
      accessorFn: (row) => Number(row.poAmount),
      header: "PO Amount",
      cell: ({ getValue }) =>
        (getValue() as number).toLocaleString("en-IN", {
          style: "currency",
          currency: "INR",
        }),
      meta: { filterType: "number-range" as TableFilterType },
    },
    {
      accessorKey: "poDate",
      header: "PO Date",
      meta: { filterType: "date-range" as TableFilterType },
    },
    {
      accessorKey: "currentLocation",
      header: "Current Location",
      meta: { filterType: "dropdown" as TableFilterType },
    },
    {
      accessorKey: "status",
      header: "Status",
      meta: { filterType: "dropdown" as TableFilterType },
    },
    { accessorKey: "specifications", header: "Specifications" },
    { accessorKey: "noOfLicenses", header: "No of Licenses" },
    { accessorKey: "natureOfLicense", header: "Nature of License" },
    {
      accessorKey: "yearOfLease",
      header: "Year of Lease",
      meta: { filterType: "dropdown" as TableFilterType },
    },
    {
      accessorKey: "fundingSource",
      header: "Funding Source",
      meta: { filterType: "dropdown" as TableFilterType },
    },
    {
      accessorKey: "dateOfInstallation",
      header: "Date of Installation",
      meta: { filterType: "date-range" as TableFilterType },
    },
    {
      accessorKey: "vendor.name",
      header: "Vendor Name",
      cell: ({ row, getValue }) => (
        <Button
          variant="link"
          onClick={() => handleVendorClick(row.original.vendor)}
        >
          {getValue() as string}
        </Button>
      ),
    },
    {
      accessorKey: "warrantyFrom",
      header: "Warranty From",
      meta: { filterType: "date-range" as TableFilterType },
    },
    {
      accessorKey: "warrantyTo",
      header: "Warranty To",
      meta: { filterType: "date-range" as TableFilterType },
    },
    {
      accessorKey: "amcFrom",
      header: "AMC From",
      meta: { filterType: "date-range" as TableFilterType },
    },
    {
      accessorKey: "amcTo",
      header: "AMC To",
      meta: { filterType: "date-range" as TableFilterType },
    },
    {
      accessorKey: "softcopyOfPO",
      enableColumnFilter: false,
      header: "Softcopy of PO",
      cell: ({ getValue }) =>
        (getValue() as string | null) ? (
          <Link target="_blank" rel="noopener noreferrer" to={getValue()!}>
            <Button variant="link">View</Button>
          </Link>
        ) : (
          "Not Uploaded"
        ),
    },
    {
      accessorKey: "softcopyOfInvoice",
      enableColumnFilter: false,
      header: "Softcopy of Invoice",
      cell: ({ getValue }) =>
        (getValue() as string | null) ? (
          <Link target="_blank" rel="noopener noreferrer" to={getValue()!}>
            <Button variant="link">View</Button>
          </Link>
        ) : (
          "Not Uploaded"
        ),
    },
    {
      accessorKey: "softcopyOfNFA",
      enableColumnFilter: false,
      header: "Softcopy of NFA",
      cell: ({ getValue }) =>
        (getValue() as string | null) ? (
          <Link target="_blank" rel="noopener noreferrer" to={getValue()!}>
            <Button variant="link">View</Button>
          </Link>
        ) : (
          "Not Uploaded"
        ),
    },
    {
      accessorKey: "softcopyOfAMC",
      enableColumnFilter: false,
      header: "Softcopy of AMC",
      cell: ({ getValue }) =>
        (getValue() as string | null) ? (
          <Link target="_blank" rel="noopener noreferrer" to={getValue()!}>
            <Button variant="link">View</Button>
          </Link>
        ) : (
          "Not Uploaded"
        ),
    },
    {
      accessorKey: "equipmentPhoto",
      enableColumnFilter: false,
      header: "Equipment Photo",
      cell: ({ getValue }) =>
        (getValue() as string | null) ? (
          <Link target="_blank" rel="noopener noreferrer" to={getValue()!}>
            <Button variant="link">View</Button>
          </Link>
        ) : (
          "Not Uploaded"
        ),
    },
    { accessorKey: "remarks", header: "Remarks" },
  ];

  const {
    data: inventoryData,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      try {
        const response = await api("/inventory/items/get");
        return response.data;
      } catch (error) {
        toast.error("Error fetching inventory data");
        console.error({ message: "Error fetching inventory data:", error });
      }
    },
    refetchOnWindowFocus: false,
    refetchOnMount: "always",
    staleTime: 1000 * 60 * 5,
  });

  const handleDelete = () => {
    if (selectedItems.length !== 1) return;

    api
      .delete(`/inventory/items/delete/${selectedItems[0].id}`)
      .then(() => {
        refetch();
        toast.success("Item deleted successfully");
      })
      .catch((err) => {
        console.error({ message: "Error deleting item", err });
        toast.error(
          ((err as AxiosError).response?.data as any).message ??
            (err as AxiosError).response?.data ??
            "Error deleting item"
        );
      });
  };

  return (
    <div className="inventory w-full p-2">
      <div
        className="text-3xl font-bold text-primary"
        style={{ width: tableElementRef.current?.offsetWidth }}
      >
        <span className="sticky left-2 z-10">Inventory</span>
      </div>
      {isFetching ? (
        <div className="my-2 flex h-full w-full flex-col space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      ) : (
        <DataTable<InventoryItem>
          data={inventoryData}
          idColumn="id"
          exportFunction={
            checkAccess(permissions["/inventory/items/export"])
              ? (itemIds, columnsVisible) => {
                  if (!itemIds || !itemIds.length)
                    return toast.warning("No data to export");

                  columnsVisible = columnsVisible.map((column) =>
                    column === "PO Amount" ? "poAmount" : column
                  );

                  columnsVisible = columnsVisible.map((column) =>
                    column === "PO Amount" ? "poAmount" : column
                  );

                  api
                    .post(
                      "/inventory/items/export",
                      { itemIds, columnsVisible },
                      { responseType: "blob" }
                    )
                    .then((response) => {
                      const blob = new Blob([response.data], {
                        type: response.headers["content-type"],
                      });
                      const link = document.createElement("a");
                      link.href = URL.createObjectURL(blob);
                      link.download = `${DEPARTMENT_NAME} Department_Export Inventory_${new Date().toLocaleDateString("en-IN")}.xlsx`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(link.href);
                      toast.success("File downloaded successfully!");
                    })
                    .catch((error) => {
                      console.error("Error:", error);
                      toast.error("Failed to download file");
                    });
                }
              : undefined
          }
          columns={columns}
          setSelected={setSelectedItems}
          initialState={{
            columnPinning: {
              left: [
                "S.No",
                "equipmentID",
                "itemName",
                "itemCategory",
              ],
            },
          }}
          isTableHeaderFixed={true}
          tableElementRefProp={tableElementRef}
          additionalButtons={
            <>
              {selectedItems.length ? (
                <Button
                  variant="outline"
                  onClick={() => setTransferDialogOpen(true)}
                >
                  Transfer
                </Button>
              ) : (
                <></>
              )}
              {selectedItems.length === 1 && (
                <DeleteItemConfirmationDialog
                  onConfirm={handleDelete}
                  selectedItem={selectedItems[0]}
                />
              )}
              {checkAccess("inventory:write") ? (
                selectedItems.length === 1 ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      const item = selectedItems[0];
                      [
                        "createdAt",
                        "updatedAt",
                        "poDate",
                        "dateOfInstallation",
                        "warrantyFrom",
                        "warrantyTo",
                        "amcFrom",
                        "amcTo",
                      ].forEach((field) => {
                        if (item[field as keyof InventoryItem]) {
                          (item[
                            field as keyof InventoryItem
                          ] as unknown as Date) = new Date(
                            item[field as keyof InventoryItem] as string
                          );
                        }
                      });
                      ["itemCategory", "lab", "vendor"].forEach((field) => {
                        if (item[field as keyof InventoryItem]) {
                          (item[field as keyof InventoryItem] as string) =
                            item[field as "lab" | "itemCategory" | "vendor"].id;
                        }
                      });

                      navigate("add-item", {
                        state: {
                          toBeEditedItem: item,
                        },
                      });
                    }}
                    className="text-blue-500 hover:bg-background hover:text-blue-700"
                  >
                    Edit Item
                  </Button>
                ) : (
                  <Button onClick={() => navigate("add-item")}>Add Item</Button>
                )
              ) : (
                <></>
              )}
            </>
          }
        />
      )}
      <TransferConfirmationDialog
        open={isTransferDialogOpen}
        onClose={() => setTransferDialogOpen(false)}
        selectedItems={selectedItems}
        onTransferSuccess={handleTransferSuccess}
      />
      <VendorDetailsDialog
        open={isVendorDialogOpen}
        onClose={() => setVendorDialogOpen(false)}
        vendorDetails={vendorDetails}
      />
    </div>
  );
};
