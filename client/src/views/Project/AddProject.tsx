import { useState, useEffect, useRef, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus, User, Users, Building2, Calendar, DollarSign, FileSpreadsheet } from "lucide-react";
import api from "@/lib/axios-instance";
import { useAuth } from "@/hooks/Auth";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import BulkUpload from "./BulkUpload";
import { projectSchemas} from "lib";

type UploadMode = "single" | "bulk";

function debounce<T extends unknown[]>(fn: (...args: T) => void, delay: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: T) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

type Faculty = {
  name?: string;
  email: string;
  department?: string;
  designation?: string;
  room?: string;
  phone?: string;
};

type FacultyResponse = {
  success: boolean;
  faculty?: Faculty;
  error?: string;
};

function extractCampusFromEmail(email: string | undefined): string {
  if (!email) return "";
  if (email.includes("@hyderabad.bits-pilani.ac.in")) return "Hyderabad";
  if (email.includes("@goa.bits-pilani.ac.in")) return "Goa";
  if (email.includes("@pilani.bits-pilani.ac.in")) return "Pilani";
  return "";
}

function getAffiliationFromCampus(campus: string) {
  return campus ? `BITS Pilani ${campus} campus` : "";
}

export default function AddProject() {
  const { authState, checkAccess } = useAuth();
  const [uploadMode, setUploadMode] = useState<UploadMode>("single");
  const [isInternal, setIsInternal] = useState(false);
  const form = useForm<projectSchemas.ProjectFormValues>({
    resolver: zodResolver(projectSchemas.projectSchema),
    defaultValues: {
      title: "",
      pi: { name: "", email: "", department: "", campus: "", affiliation: "" },
      coPIs: [],
      PIs: [],
      fundingAgency: "",
      fundingAgencyNature: "public_sector",
      sanctionedAmount: "",
      capexAmount: "",
      opexAmount: "",
      manpowerAmount: "",
      approvalDate: "",
      startDate: "",
      endDate: "",
      hasExtension: false,
    },
  });
  const { fields: fieldsCoPI, append: appendCoPI, remove: removeCoPI } = useFieldArray({
    control: form.control,
    name: "coPIs",
  });
  const { fields: fieldsPI, append: appendPI, remove: removePI } = useFieldArray({
    control: form.control,
    name: "PIs",
  });
  const [piLoading, setPiLoading] = useState<number | null>(null);
  const [coPiLoading, setCoPiLoading] = useState<number | null>(null);

  const onSubmit = async (data: projectSchemas.ProjectFormValues) => {
    try {
      await api.post("/project/create", data);
      toast.success("Project created successfully!");
      form.reset();
      appendPI({
        name: "",
        email: "",
        department: "",
        campus: "",
        affiliation: "",
      });
      setIsInternal(false);
    } catch (err) {
      const error = err as { response?: { status?: number; data?: { error?: string } } };
      if (error?.response?.status === 409 && error?.response?.data?.error === "Project already exists") {
        toast.error("Project already exists. Please check your data.");
      } else {
        toast.error(error?.response?.data?.error ?? "Error creating project");
      }
    }
  };

  const fetchPiDetails = useCallback(
    async (email: string, idx: number) => {
      if (!email) return;
      setPiLoading(idx);
      try {
        const res = await api.get<FacultyResponse>("/project/faculty/by-email", { params: { email } });
        const data = res.data;
        if (data && data.success && data.faculty) {
          form.setValue(`PIs.${idx}.name`, data.faculty.name || "");
          form.setValue(`PIs.${idx}.department`, data.faculty.department || "");
          const campus = extractCampusFromEmail(data.faculty.email) || data.faculty.room || "";
          form.setValue(`PIs.${idx}.campus`, campus);
          form.setValue(`PIs.${idx}.affiliation`, getAffiliationFromCampus(campus));
        } else {
          form.setValue(`PIs.${idx}.name`, "");
          form.setValue(`PIs.${idx}.department`, "");
          form.setValue(`PIs.${idx}.campus`, "");
          form.setValue(`PIs.${idx}.affiliation`, "");
        }
      } catch {
        form.setValue(`PIs.${idx}.name`, "");
        form.setValue(`PIs.${idx}.department`, "");
        form.setValue(`PIs.${idx}.campus`, "");
        form.setValue(`PIs.${idx}.affiliation`, "");
      }
      setPiLoading(null);
    },
    [form]
  );
  const PiDebouncers = useRef<{ [idx: number]: (email: string) => void }>({});
  useEffect(() => {
    updateMainPI();
    fieldsPI.forEach((_field, idx) => {
      if (!PiDebouncers.current[idx]) {
        PiDebouncers.current[idx] = debounce((email: string) => { void fetchPiDetails(email, idx); }, 500);
      }
    });
  }, [fieldsPI, fetchPiDetails]);
  useEffect(() => {
    const sub = form.watch((values, { name }) => {      
      if (name && name.startsWith("PIs.")) {
        updateMainPI();
        const match = name.match(/^PIs\.(\d+)\.email$/);
        if (match) {
          const idx = Number(match[1]);
          if (values.PIs && typeof values.PIs[idx]?.email === 'string') {
            PiDebouncers.current[idx]?.(values.PIs[idx].email);
          }
        }
      }
    });
    return () => sub.unsubscribe();
  }, [form, fieldsPI]);
  function updateMainPI() {
    if (form.getValues("PIs").length > 0){
      const mainPI = form.getValues("PIs.0");
      form.setValue("pi.name", mainPI.name ?? "");
      form.setValue("pi.email", mainPI.email ?? "");
      form.setValue("pi.department", mainPI.department ?? "");
      form.setValue("pi.campus", mainPI.campus ?? "");
      form.setValue("pi.affiliation", mainPI.affiliation ?? "");
    }
  }

  const fetchCoPiDetails = useCallback(
    async (email: string, idx: number) => {
      if (!email) return;
      setCoPiLoading(idx);
      try {
        const res = await api.get<FacultyResponse>("/project/faculty/by-email", { params: { email } });
        const data = res.data;
        if (data && data.success && data.faculty) {
          form.setValue(`coPIs.${idx}.name`, data.faculty.name || "");
          form.setValue(`coPIs.${idx}.department`, data.faculty.department || "");
          const campus = extractCampusFromEmail(data.faculty.email) || data.faculty.room || "";
          form.setValue(`coPIs.${idx}.campus`, campus);
          form.setValue(`coPIs.${idx}.affiliation`, getAffiliationFromCampus(campus));
        } else {
          form.setValue(`coPIs.${idx}.name`, "");
          form.setValue(`coPIs.${idx}.department`, "");
          form.setValue(`coPIs.${idx}.campus`, "");
          form.setValue(`coPIs.${idx}.affiliation`, "");
        }
      } catch {
        form.setValue(`coPIs.${idx}.name`, "");
        form.setValue(`coPIs.${idx}.department`, "");
        form.setValue(`coPIs.${idx}.campus`, "");
        form.setValue(`coPIs.${idx}.affiliation`, "");
      }
      setCoPiLoading(null);
    },
    [form]
  );
  const coPiDebouncers = useRef<{ [idx: number]: (email: string) => void }>({});
  useEffect(() => {
    fieldsCoPI.forEach((_field, idx) => {
      if (!coPiDebouncers.current[idx]) {
        coPiDebouncers.current[idx] = debounce((email: string) => { void fetchCoPiDetails(email, idx); }, 500);
      }
    });
  }, [fieldsCoPI, fetchCoPiDetails]);
  useEffect(() => {
    const sub = form.watch((values, { name }) => {
      if (name && name.startsWith("coPIs.")) {
        const match = name.match(/^coPIs\.(\d+)\.email$/);
        if (match) {
          const idx = Number(match[1]);
          if (values.coPIs && typeof values.coPIs[idx]?.email === 'string') {
            coPiDebouncers.current[idx]?.(values.coPIs[idx].email);
          }
        }
      }
    });
    return () => sub.unsubscribe();
  }, [form, fieldsCoPI]);

  useEffect(() => {
    appendPI({
      name: "",
      email: "",
      department: "",
      campus: "",
      affiliation: "",
    });
  }, []);

  useEffect(() => {
    if (isInternal) {
      form.setValue("fundingAgency", "BITS Pilani Hyderabad Campus");
      form.setValue("fundingAgencyNature", "private_industry");
    } else {
      form.setValue("fundingAgency", "");
      form.setValue("fundingAgencyNature", "public_sector");
    }
  }, [isInternal]);

  if (!authState) return <Navigate to="/" replace />;
  if (!checkAccess("project:create")) return <Navigate to="/404" replace />;

  if (uploadMode === "bulk") {
    return <BulkUpload onBack={() => setUploadMode("single")} />;
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-start p-8">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New Project</h1>
          <p className="text-gray-600">Fill in the details below to create a new project</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-4">
              <Button
                variant={uploadMode === "single" ? "default" : "outline"}
                onClick={() => setUploadMode("single")}
                className="flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                Single Project
              </Button>
              <Button
                variant="outline"
                onClick={() => setUploadMode("bulk")}
                className="flex items-center gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Bulk Upload
              </Button>
            </div>
          </CardContent>
        </Card>

        <Form {...form}>
          <form onSubmit={(e) => void form.handleSubmit(onSubmit)(e)} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Project Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Project Title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter project title" className="h-10 text-base" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Principal Investigators
                  </CardTitle>
                  <Button 
                    type="button" 
                    onClick={() => appendPI({ name: "", email: "", department: "", campus: "", affiliation: "" })}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add PI
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {fieldsPI.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No PIs added yet. Click &quot;Add PI&quot; to add one.</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {fieldsPI.map((field, idx) => (
                      <div key={field.id} className="relative">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-medium text-gray-900">PI #{idx + 1}</h4>
                          {fieldsPI.length > 1 && (
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removePI(idx)}
                              className="flex items-center gap-2"
                            >
                              <Trash2 className="h-4 w-4" />
                              Remove
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-gray-50 rounded-lg border">
                          <FormField
                            control={form.control}
                            name={`PIs.${idx}.email` as const}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email Address *</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input {...field} type="email" placeholder="Enter email address" />
                                    {piLoading === idx && <span className="absolute right-2 top-2 text-xs text-blue-500">Loading...</span>}
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`PIs.${idx}.name` as const}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Enter full name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`PIs.${idx}.department` as const}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Department</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Enter department" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`PIs.${idx}.campus` as const}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Campus</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Enter campus" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`PIs.${idx}.affiliation` as const}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Affiliation</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Enter affiliation" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Co-Principal Investigators (Co-PIs)
                  </CardTitle>
                  <Button 
                    type="button" 
                    onClick={() => appendCoPI({ name: "", email: "", department: "", campus: "", affiliation: "" })}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Co-PI
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {fieldsCoPI.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No Co-PIs added yet. Click &quot;Add Co-PI&quot; to add one.</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {fieldsCoPI.map((field, idx) => (
                      <div key={field.id} className="relative">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-medium text-gray-900">Co-PI #{idx + 1}</h4>
                          <Button 
                            type="button" 
                            variant="destructive" 
                            size="sm"
                            onClick={() => removeCoPI(idx)}
                            className="flex items-center gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-gray-50 rounded-lg border">
                          <FormField
                            control={form.control}
                            name={`coPIs.${idx}.email` as const}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email Address *</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input {...field} type="email" placeholder="Enter email address" />
                                    {coPiLoading === idx && <span className="absolute right-2 top-2 text-xs text-blue-500">Loading...</span>}
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`coPIs.${idx}.name` as const}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Enter full name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`coPIs.${idx}.department` as const}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Department</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Enter department" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`coPIs.${idx}.campus` as const}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Campus</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Enter campus" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`coPIs.${idx}.affiliation` as const}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Affiliation</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Enter affiliation" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                   Funding Information
                </CardTitle>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Type of Funding Agency *
                  </label>
                  <select
                    value={isInternal ? "internal" : "external"}
                    onChange={e => setIsInternal(e.target.value === "internal")}
                    className="w-full border rounded-md p-3 text-base"
                  >
                    <option value="external">External</option>
                    <option value="internal">Internal</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    disabled={isInternal}
                    control={form.control}
                    name="fundingAgency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Funding Agency *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter funding agency name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    disabled={isInternal}
                    control={form.control}
                    name="fundingAgencyNature"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nature of Funding Agency *</FormLabel>
                        <FormControl>
                          <select {...field} className="w-full border rounded-md p-3 text-base">
                            <option value="public_sector">Public Sector</option>
                            <option value="private_industry">Private Industry</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <FormField
                    control={form.control}
                    name="sanctionedAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sanctioned Amount (₹) *</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="0" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="capexAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CAPEX Amount (₹)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="0" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="opexAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>OPEX Amount (₹)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="0" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="manpowerAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Manpower Amount (₹)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="0" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Project Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="approvalDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Approval Date *</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date *</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date *</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="hasExtension"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={!!field.value}
                            onChange={e => field.onChange(e.target.checked)}
                            className="mt-1 h-4 w-4 rounded border-gray-300"
                          />
                          </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Project has been extended</FormLabel>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center pt-6">
              <Button type="submit" size="lg" className="px-8 py-3 text-base">
                Create Project
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
} 