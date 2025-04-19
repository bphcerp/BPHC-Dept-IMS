import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { X } from "lucide-react";
import { useForm } from "@tanstack/react-form";
import { Textarea } from "../ui/textarea";
import api from "@/lib/axios-instance";
import {
  NewVendorRequest,
  Vendor,
  Category,
} from "node_modules/lib/src/types/inventory";
import { useQuery } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

interface AddVendorDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onAddVendor: (newVendor: NewVendorRequest) => void;
  editInitialData?: Vendor;
}

const AddVendorDialog = ({
  isOpen,
  setIsOpen,
  onAddVendor,
  editInitialData,
}: AddVendorDialogProps) => {
  const [availableCategories, setAvailableCategories] = useState<Category[]>(
    []
  );

  const { Field, Subscribe, handleSubmit, reset } = useForm({
    defaultValues: {
      vendorId: editInitialData?.vendorId ?? undefined,
      name: editInitialData?.name ?? "",
      pocName: editInitialData?.pocName ?? "",
      phoneNumber: editInitialData?.phoneNumber ?? "",
      email: editInitialData?.email ?? "",
      address: editInitialData?.address ?? "",
      categories:
        editInitialData?.categories?.map((cat: Category) => cat.id) ?? [],
    } as NewVendorRequest,
    onSubmit: ({ value: data }) => {
      if (
        !data.vendorId ||
        !data.name ||
        !data.pocName ||
        !data.phoneNumber ||
        !data.email
      ) {
        toast.error("Fields are missing");
        return;
      }
      onAddVendor(data);
      setIsOpen(false);
    },
  });

  useQuery({
    queryKey: ["categories", isOpen],
    queryFn: async () => {
      const response = await api("/inventory/categories/get?type=Vendor");
      setAvailableCategories(response.data);
      return response.data;
    },
    refetchOnWindowFocus: false,
    enabled: isOpen,
  });

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        reset();
      }}
    >
      <DialogTrigger asChild>
        {editInitialData ? (
          <Button
            variant="outline"
            className="text-blue-500 hover:bg-background hover:text-blue-700"
          >
            Edit Vendor
          </Button>
        ) : (
          <Button>Add Vendor</Button>
        )}
      </DialogTrigger>
      <DialogContent className="!max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editInitialData ? "Edit Vendor" : "Add Vendor"}
          </DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          id="vendor-add-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <div className="grid md:grid-cols-2 md:gap-2">
            <Field name="vendorId">
              {(field) => (
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="vendor-id">Vendor ID</Label>
                  <Input
                    required
                    id="vendor-id"
                    type="number"
                    value={field.state.value ?? ""}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                    onBlur={field.handleBlur}
                  />
                </div>
              )}
            </Field>
            <Field name="name">
              {(field) => (
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="vendor-name">Vendor Name</Label>
                  <Input
                    required
                    id="vendor-name"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                </div>
              )}
            </Field>
            <Field name="pocName">
              {(field) => (
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="poc-name">POC Name</Label>
                  <Input
                    required
                    id="poc-name"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                </div>
              )}
            </Field>
            <Field name="phoneNumber">
              {(field) => (
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="phone-number">Phone Number</Label>
                  <Input
                    required
                    id="phone-number"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                </div>
              )}
            </Field>
          </div>
          <Field name="email">
            {(field) => (
              <>
                <Label htmlFor="email">Email</Label>
                <Input
                  required
                  type="email"
                  id="email"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
              </>
            )}
          </Field>
          <Field name="address">
            {(field) => (
              <div className="grid h-36 grid-rows-2">
                <Label htmlFor="vendor-address">Vendor Address</Label>
                <Textarea
                  id="vendor-address"
                  className="resize-none overflow-y-auto"
                  value={field.state.value ?? ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
              </div>
            )}
          </Field>
          <Field name="categories">
            {(field) => (
              <>
                <Label htmlFor="vendor-categories">Vendor Categories</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="w-full justify-between rounded-md border px-3 py-2 text-sm shadow-sm hover:bg-muted"
                    >
                      {field.state.value.length > 0
                        ? `${field.state.value.length} selected`
                        : "Select Categories"}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    {availableCategories.map((category: Category) => (
                      <DropdownMenuCheckboxItem
                        key={category.id}
                        checked={field.state.value.includes(category.id)}
                        onCheckedChange={(checked) => {
                          const newValue = checked
                            ? [...field.state.value, category.id]
                            : field.state.value.filter(
                                (id: string) => id !== category.id
                              );
                          field.handleChange(newValue);
                        }}
                      >
                        {category.name}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {field.state.value.map((category, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-center space-x-1 rounded-md bg-primary/20 p-1 hover:bg-primary/30"
                    >
                      <span>
                        {
                          availableCategories.find(
                            (availableCategory) =>
                              availableCategory.id === category
                          )?.name
                        }
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          field.handleChange(
                            field.state.value.filter(
                              (prevCategory) => prevCategory !== category
                            )
                          )
                        }
                        className="text-red-600 hover:cursor-pointer hover:text-red-700"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Field>
        </form>
        <DialogFooter>
          <Subscribe
            selector={(state) => [state.canSubmit]}
            children={([canSubmit]) => (
              <>
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <Button disabled={!canSubmit} form="vendor-add-form">
                  {editInitialData ? "Edit Vendor" : "Add Vendor"}
                </Button>
              </>
            )}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddVendorDialog;
