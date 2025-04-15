"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useForm } from "@tanstack/react-form";
import { AlertTriangle } from "lucide-react";
import { AxiosError } from "axios";
import api from "@/lib/axios-instance";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Laboratory, Category, Vendor } from "./types";

const AddInventoryItem = () => {
    const [labs, setLabs] = useState<Laboratory[]>([]);
    const [filteredLabs, setFilteredLabs] = useState<Laboratory[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([])
    const [lastItemNumber, setLastItemNumber] = useState<number>()

    const location = useLocation()
    const editMode = !!(location.state?.toBeEditedItem ?? false)
    const navigate = useNavigate()

    useEffect(() => {
        api("/inventory/labs/get").then(({ data }) => {
            setLabs(data)
            setFilteredLabs(data)
        });

        api("/inventory/categories/get?type=Inventory").then(({ data }) => {
            setCategories(data);
        });

        api("/inventory/vendors/get").then(({ data }) => {
            setVendors(data);
        });

    }, []);


    const updateLastItemNumber = (labId: string) => {
        api(`/inventory/labs/lastItemNumber/${labId}`).then(({ data }) => setLastItemNumber(data.lastItemNumber))
    }

    const { Field, Subscribe, handleSubmit, setFieldValue } = useForm({
        defaultValues: location.state?.toBeEditedItem ?? {
            labId: "",
            itemCategoryId: "",
            itemName: "",
            specifications: "",
            quantity: 1,
            noOfLicenses: null as number | null,
            natureOfLicense: "",
            yearOfLease: null as number | null,
            poAmount: 0,
            poNumber: "",
            poDate: null as Date | null,
            labInchargeAtPurchase: "",
            labTechnicianAtPurchase: "",
            equipmentID: "",
            fundingSource: "",
            dateOfInstallation: null as Date | null,
            vendorId: "",
            warrantyFrom: null as Date | null,
            warrantyTo: null as Date | null,
            amcFrom: null as Date | null,
            amcTo: null as Date | null,
            currentLocation: "",
            status: "Working" as "Working" | "Not Working" | "Under Repair" | null,
            remarks: "",
            softcopyOfPO: null as string | null,
            softcopyOfInvoice: null as string | null,
            softcopyOfNFA: null as string | null,
            softcopyOfAMC: null as string | null,
            equipmentPhoto: null as string | null,
        },
        onSubmit: async ({ value: data, formApi: form }) => {
            if (editMode) {
                const dirtyFields = Object.entries(form.state.fieldMetaBase).filter(([_key, value]) => value.isDirty).map(([key]) => key)

                if (!dirtyFields.length) {
                    toast.info("No updated fields detected")
                    return
                }

                const editedItem = Object.fromEntries(Object.entries(data).filter(([key]) => dirtyFields.includes(key)))

                toast.info("Saving Edits...")
                api.patch(`/inventory/items/update/${location.state!.toBeEditedItem.id}`, editedItem)
                    .then(() => toast.success("Edit successful"))
                    .catch((err) => toast.error(((err as AxiosError).response?.data as any).message ?? "Error editing item"));
            }
            else {
                try {
                    if (!data.fundingSource) {
                        toast.error("Funding Source is required")
                        return
                    }
                    toast.info("Submitting...")
                    const response = await api.post("/inventory/items/create", data);
    
                    if (response.status === 201) {
                        toast.success(`Item${data.quantity > 1 ? 's' : ''} added successfully!`);
                    } else {
                        toast.error(`Failed to add item${data.quantity > 1 ? 's' : ''}.`);
                    }
                } catch (error) {
                    console.error("Error adding item:", error);
                    toast.error("An error occurred while adding the item.");
                }
            }
            navigate('/inventory/items')
        },
    });

    useEffect(() => {
        if (editMode) setLastItemNumber(parseInt(location.state!.toBeEditedItem.equipmentID.match(/\d+/)[0] as string))
    }, [])


    return (
        <div className="relative flex flex-col p-5">

            <span className="flex justify-center items-center mt-2 mb-10 w-full text-3xl text-primary text-center">{editMode ? "Edit Inventory Item" : "Add an item to the inventory"}</span>

            {!editMode && <Link to='excel'><Button className="absolute m-5 top-2 right-0">Add with Excel</Button></Link>}

            {/* Left Side - Form Fields */}
            <form className="flex flex-col space-y-6" id="inventory-form" onSubmit={(e) => {
                e.preventDefault()
                handleSubmit()
            }}>
                <span className="text-2xl text-zinc-600 dark:text-zinc-300">Lab Details</span>
                <div className="grid grid-cols-3 gap-4">
                    <Subscribe selector={(state) => [state.values]} children={([values]) => (
                        <Field name="labId">
                            {(field) => (
                                <div className="flex flex-col space-y-2">
                                    <Label>Lab</Label>
                                    <Select disabled={editMode} value={field.state.value} onValueChange={(value) => {
                                        field.handleChange(value)
                                        updateLastItemNumber(value)
                                        const lab = labs.find(lab => lab.id === value)
                                        setFieldValue('labInchargeAtPurchase', lab?.facultyInCharge?.name)
                                        setFieldValue('labTechnicianAtPurchase', lab?.technicianInCharge?.name)
                                        setFieldValue("currentLocation", lab?.location ?? '')
                                    }}>
                                        <SelectTrigger className="w-52">
                                            <SelectValue placeholder="Select Lab" />
                                        </SelectTrigger>
                                        <SelectContent onPointerDownOutside={() => setFilteredLabs(labs)}>
                                            <div id="addLabForm" className="grid grid-cols-4 gap-x-2">
                                                <Input name="lab" onKeyDown={(e) => e.stopPropagation()} className="col-span-3" placeholder="Search Labs..." onChange={(e) => {
                                                    setFilteredLabs(labs.filter(lab => lab.name.includes(e.target.value)));
                                                }} />
                                                <Link to="/inventory/settings?view=Labs&action=addLab" state={values}><Button>Add</Button></Link> </div>
                                            {filteredLabs.map((lab) => (
                                                <SelectItem key={lab.id} value={lab.id}>
                                                    {lab.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </Field>
                    )} />
                    <Field name="labInchargeAtPurchase">
                        {({ state }) => (
                            <div className="flex flex-col space-y-2">
                                <div className="flex space-x-2">
                                    <Label>Lab In-charge at Purchase<span className="text-xs text-zinc-600">Auto filled</span></Label>
                                    {!state.value && <AlertTriangle className="text-yellow-400" />}
                                </div>
                                <Input className="bg-zinc-200 dark:bg-zinc-800" disabled value={state.value ?? "None Specified"} />
                            </div>
                        )}
                    </Field>
                    <Field name="labTechnicianAtPurchase">
                        {({ state }) => (
                            <div className="flex flex-col space-y-2">
                                <div className="flex space-x-2">
                                    <Label>Lab Technician at Purchase<span className="text-xs text-zinc-600">Auto filled</span></Label>
                                    {!state.value && <AlertTriangle className="text-yellow-400" />}
                                </div>
                                <Input className="bg-zinc-200 dark:bg-zinc-800" disabled value={state.value ?? "None Specified"} />
                            </div>
                        )}
                    </Field>
                </div>
                <span className="text-2xl text-zinc-600 dark:text-zinc-300">Item Details</span>
                <div className="grid grid-cols-3 gap-4">
                    <Subscribe selector={(state) => [state.values.labId, state.values.itemCategoryId, state.values.quantity, lastItemNumber, state.fieldMetaBase.labId?.isDirty || state.fieldMetaBase.itemCategoryId?.isDirty]} children={([labId, categoryId, quantity, lastItemNumber, isDirty]) => {
                        if (isDirty) {
                            const lab = labs.find(lab => lab.id === labId)
                            const categoryCode = categories.find(cateogory => cateogory.id === categoryId)?.code

                            const equipmentID = (lab && categoryCode && lastItemNumber) ? `BITS/EEE/${lab.code}/${categoryCode}/${quantity > 1 ? `${lastItemNumber.toString().padStart(4, '0')}-(01-${quantity.toString().padStart(2, '0')})` : lastItemNumber.toString().padStart(4, '0')}` : ''
                            setFieldValue('equipmentID', equipmentID)
                        }
                        return (<Field name="equipmentID">
                            {({ state }) => (
                                <div className="flex flex-col space-y-2">
                                    <Label>Equipment ID<span className="text-xs text-zinc-600">Auto generated</span></Label>
                                    <Input className="bg-zinc-200 dark:bg-zinc-800" disabled value={state.value ?? "Not Provided"} required />
                                </div>
                            )}
                        </Field>)
                    }} />
                    <Field name="itemCategoryId">
                        {(field) => (
                            <div className="flex flex-col space-y-2">
                                <Label>Item Category</Label>
                                <Select value={field.state.value} onValueChange={(value) => field.handleChange(value)} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Category" />
                                    </SelectTrigger>
                                    <SelectContent onBlur={field.handleBlur}>
                                        {categories.map((category) => (
                                            <SelectItem key={category.id} value={category.id}>
                                                {category.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </Field>
                    <Field name="itemName">
                        {(field) => (
                            <div className="flex flex-col space-y-2">
                                <Label>Item Name</Label>
                                <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} required />
                            </div>
                        )}
                    </Field>
                    <Field name="quantity">
                        {(field) => (
                            <div className="flex flex-col space-y-2">
                                <Label>Quantity</Label>
                                <Input type="number" min={1} value={field.state.value} onChange={(e) => field.handleChange(parseInt(e.target.value))} onBlur={field.handleBlur} required />
                            </div>
                        )}
                    </Field>
                    <Field name="currentLocation">
                            {(field) => (
                                <div className="flex flex-col space-y-2">
                                    <Label>
                                        <span>Current Location</span>
                                        {(!field.state.value) && <AlertTriangle size={20} className="text-yellow-400" />}
                                    </Label>
                                    <Input placeholder="Ex: J-106, W-101" title="Please enter a valid room no (Ex. J-106, W-101)" pattern="^[A-Z]-\d{3}$" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} required />
                                </div>
                            )}
                        </Field>
                    <Field name="status">
                        {(field) => (
                            <div className="flex flex-col space-y-2">
                                <Label>Status</Label>
                                <Select value={field.state.value ?? "NA"} onValueChange={(value) => field.handleChange((value === "NA" ? null : value) as 'Working' | 'Not Working' | null)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Working"><span className="text-green-600 dark:text-green-500">Working</span></SelectItem>
                                        <SelectItem value="Not Working"><span className="text-red-600 dark:text-red-500">Not Working</span></SelectItem>
                                        <SelectItem value="Under Repair"><span className="text-yellow-600 dark:text-yellow-500">Under Repair</span></SelectItem>
                                        <SelectItem value="NA">Not Applicable</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </Field>
                    <Field name="specifications">
                        {(field) => (
                            <div className="col-span-2 flex flex-col space-y-2">
                                <Label>Specifications</Label>
                                <Textarea value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} required />
                            </div>
                        )}
                    </Field>
                </div>
                <span className="text-2xl text-zinc-600 dark:text-zinc-300">License & Registration</span>
                <div className="grid grid-cols-3 gap-4">
                    <Field name="noOfLicenses">
                        {(field) => (
                            <div className="flex flex-col space-y-2">
                                <Label>No. of Licenses</Label>
                                <Input min={0} type="number" value={field.state.value?.toString()} onChange={(e) => field.handleChange(parseInt(e.target.value))} onBlur={field.handleBlur} />
                            </div>
                        )}
                    </Field>
                    <Field name="natureOfLicense">
                        {(field) => (
                            <div className="flex flex-col space-y-2">
                                <Label>Nature of License</Label>
                                <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} />
                            </div>
                        )}
                    </Field>
                    <Field name="yearOfLease">
                        {(field) => (
                            <div className="flex flex-col space-y-2">
                                <Label>Year of Lease</Label>
                                <Input type="number" min={2007} value={field.state.value?.toString()} onChange={(e) => field.handleChange(parseInt(e.target.value))} onBlur={field.handleBlur} />
                            </div>
                        )}
                    </Field>
                    <Field name="poAmount">
                        {(field) => (
                            <div className="flex flex-col space-y-2">
                                <Label>Item PO Amount</Label>
                                <Input type="number" value={field.state.value} onChange={(e) => field.handleChange(parseFloat(e.target.value))} onBlur={field.handleBlur} required />
                            </div>
                        )}
                    </Field>
                    <Field name="poNumber">
                        {(field) => (
                            <div className="flex flex-col space-y-2">
                                <Label>PO Number</Label>
                                <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value.toUpperCase())} onBlur={field.handleBlur} required />
                            </div>
                        )}
                    </Field>
                    <Field name="poDate">
                        {(field) => (
                            <div className="flex flex-col space-y-2">
                                <Label>PO Date</Label>
                                <Input type="date" value={field.state.value?.toISOString().split("T")[0]} onChange={(e) => field.handleChange(e.target.value ? new Date(e.target.value) : null)} onBlur={field.handleBlur} required />
                            </div>
                        )}
                    </Field>
                    <Field name="fundingSource">
                        {(field) => (
                            <div className="flex flex-col space-y-2">
                                <Label className="after:content-['*'] after:text-red-500">Funding Source</Label>
                                <Select value={field.state.value} onValueChange={(value) => field.handleChange(value)} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Funding Source" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Institute">Institute</SelectItem>
                                        <SelectItem value="Project">Project</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </Field>
                    <Field name="dateOfInstallation">
                        {(field) => (
                            <div className="flex flex-col space-y-2">
                                <Label>Date of Installation</Label>
                                <Input type="date" value={field.state.value?.toISOString().split("T")[0]} onChange={(e) => field.handleChange(e.target.value ? new Date(e.target.value) : null)} onBlur={field.handleBlur} />
                            </div>
                        )}
                    </Field>
                </div>

                <span className="text-2xl text-zinc-600 dark:text-zinc-300">Vendor Information</span>
                <div className="grid grid-cols-3 gap-4">
                    <Field name="vendorId">
                        {(field) => (
                            <div className="flex flex-col space-y-2">
                                <Label>Vendor</Label>
                                <Select value={field.state.value} onValueChange={(value) => field.handleChange(value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Vendor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {vendors.map((vendor) => (
                                            <SelectItem key={vendor.id} value={vendor.id}>
                                                {vendor.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </Field>
                    <Subscribe selector={(state) => ([state.values.vendorId])} children={([vendorId]) => {
                        const vendor = vendors.find(vendor => vendor.id === vendorId)
                        return <>
                            <div className="flex flex-col space-y-2">
                                <Label>Vendor Address<span className="text-xs text-zinc-600">Auto filled</span></Label>
                                <Input disabled className="bg-zinc-200 dark:bg-zinc-800" value={vendor?.address ?? 'Not Provided'} />
                            </div>
                            <div className="flex flex-col space-y-2">
                                <Label>Vendor POC Name<span className="text-xs text-zinc-600">Auto filled</span></Label>
                                <Input disabled className="bg-zinc-200 dark:bg-zinc-800" value={vendor?.pocName ?? "Not Provided"} required />
                            </div>
                            <div className="flex flex-col space-y-2">
                                <Label>Vendor POC Phone Number<span className="text-xs text-zinc-600">Auto filled</span></Label>
                                <Input disabled className="bg-zinc-200 dark:bg-zinc-800" value={vendor?.phoneNumber ?? 'Not Provided'} required />
                            </div>
                            <div className="flex flex-col space-y-2">
                                <Label>Vendor POC Email ID<span className="text-xs text-zinc-600">Auto filled</span></Label>
                                <Input disabled className="bg-zinc-200 dark:bg-zinc-800" type="email" value={vendor?.email ?? 'Not Provided'} required />
                            </div>
                        </>
                    }} />
                </div>
                <span className="text-2xl text-zinc-600 dark:text-zinc-300">Warranty & AMC</span>
                <div className="grid grid-cols-3 gap-4">
                    <Field name="warrantyFrom">
                        {(field) => (
                            <div className="flex flex-col space-y-2">
                                <Label>Warranty From</Label>
                                <Input type="date" value={field.state.value?.toISOString().split("T")[0]} onChange={(e) => field.handleChange(e.target.value ? new Date(e.target.value) : null)} />
                            </div>
                        )}
                    </Field>
                    <Subscribe selector={(state) => [state.values.warrantyFrom]} children={([warrantyFrom]) => (
                        <Field name="warrantyTo">
                            {(field) => (
                                <div className="flex flex-col space-y-2">
                                    <Label>Warranty To</Label>
                                    <Input type="date" {...(warrantyFrom !== null ? ({ min: warrantyFrom.toISOString().split("T")[0] }) : {})} value={field.state.value?.toISOString().split("T")[0]} onChange={(e) => field.handleChange(e.target.value ? new Date(e.target.value) : null)} />
                                </div>
                            )}
                        </Field>
                    )} />
                    <Field name="amcFrom">
                        {(field) => (
                            <div className="flex flex-col space-y-2">
                                <Label>AMC From</Label>
                                <Input type="date" value={field.state.value?.toISOString().split("T")[0]} onChange={(e) => field.handleChange(e.target.value ? new Date(e.target.value) : null)} />
                            </div>
                        )}
                    </Field>
                    <Subscribe selector={(state) => [state.values.amcFrom]} children={([amcFrom]) => (
                        <Field name="amcTo">
                            {(field) => (
                                <div className="flex flex-col space-y-2">
                                    <Label>AMC To</Label>
                                    <Input type="date" {...(amcFrom !== null ? ({ min: amcFrom.toISOString().split("T")[0] }) : {})} value={field.state.value?.toISOString().split("T")[0]} onChange={(e) => field.handleChange(e.target.value ? new Date(e.target.value) : null)} />
                                </div>
                            )}
                        </Field>
                    )} />
                </div>
                <span className="text-2xl text-zinc-600 dark:text-zinc-300">Documents</span>
                <div className="grid grid-cols-3 gap-4"><Field name="softcopyOfPO">
                    {(field) => (
                        <div className="flex flex-col space-y-2">
                            <Label>Soft Copy of PO</Label>
                            <Input placeholder="Paste link here" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} />
                        </div>
                    )}
                </Field>
                    <Field name="softcopyOfInvoice">
                        {(field) => (
                            <div className="flex flex-col space-y-2">
                                <Label>Soft Copy of Invoice</Label>
                                <Input placeholder="Paste link here" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} />
                            </div>
                        )}
                    </Field>
                    <Field name="softcopyOfNFA">
                        {(field) => (
                            <div className="flex flex-col space-y-2">
                                <Label>Soft Copy of NFA</Label>
                                <Input placeholder="Paste link here" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} />
                            </div>
                        )}
                    </Field>
                    <Field name="softcopyOfAMC">
                        {(field) => (
                            <div className="flex flex-col space-y-2">
                                <Label>Soft Copy of AMC</Label>
                                <Input placeholder="Paste link here" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} />
                            </div>
                        )}
                    </Field>
                    <Field name="equipmentPhoto">
                        {(field) => (
                            <div className="flex flex-col space-y-2">
                                <Label>Equipment Photo</Label>
                                <Input placeholder="Paste link here" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} />
                            </div>
                        )}
                    </Field></div>
                <Field name="remarks">
                    {(field) => (
                        <div className="flex flex-col space-y-2">
                            <Label>Remarks</Label>
                            <Textarea value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} />
                        </div>
                    )}
                </Field>

                {/* Submit Button */}
                <div className="col-span-3 flex justify-end">
                    <Subscribe selector={(state) => [state.canSubmit, state.isSubmitting, state.isSubmitted]}>
                        {([canSubmit, isSubmitting, isSubmitted]) => <Button disabled={!canSubmit || isSubmitting || isSubmitted} form="inventory-form">{isSubmitting ? "Processing..." : editMode ? "Edit Item" : "Add Item"}</Button>}
                    </Subscribe>
                </div>
            </form>
        </div>
    );
};

export default AddInventoryItem;