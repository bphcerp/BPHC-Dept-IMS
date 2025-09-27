import { useState, useRef, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/Auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { patentSchemas } from "lib";
import api from "@/lib/axios-instance";
import { ArrowLeft, Save, User, FileSpreadsheet, Plus, Trash2, Users } from "lucide-react";
import BulkUpload from "./BulkUpload";
import { toast } from "sonner";

type UploadMode = "single" | "bulk";

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

function debounce<T extends unknown[]>(fn: (...args: T) => void, delay: number) {
  let timeoutId: NodeJS.Timeout;
  return (...args: T) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

function getFieldDisplayName(fieldPath: string): string {
  const fieldMap: Record<string, string> = {
    applicationNumber: "Application Number",
    inventorsName: "Inventors Name",
    department: "Department",
    title: "Title",
    campus: "Campus",
    filingDate: "Filing Date",
    filingFY: "Filing FY",
    filingAY: "Filing AY",
    status: "Status",
  };

  // Handle nested paths like inventors.0.name
  if (fieldPath.startsWith('inventors.')) {
    const parts = fieldPath.split('.');
    if (parts.length >= 3) {
      const inventorIndex = parseInt(parts[1]) + 1;
      const field = parts[2];
      if (field === 'name') return `Inventor ${inventorIndex} Name`;
      if (field === 'email') return `Inventor ${inventorIndex} Email`;
    }
  }

  return fieldMap[fieldPath] || fieldPath;
}



export default function AddPatent() {
  const { authState, checkAccess } = useAuth();
  const navigate = useNavigate();
  const [uploadMode, setUploadMode] = useState<UploadMode>("single");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [inventorLoading, setInventorLoading] = useState<number | null>(null);
  const inventorDebouncers = useRef<{ [key: number]: (email: string) => void }>({});

  const [formData, setFormData] = useState({
    applicationNumber: "",
    inventors: [{ name: "", email: "" }],
    department: "",
    title: "",
    campus: "",
    filingDate: "",
    applicationPublicationDate: "",
    grantedDate: "",
    filingFY: "",
    filingAY: "",
    publishedAY: "",
    publishedFY: "",
    grantedFY: "",
    grantedAY: "",
    grantedCY: "",
    status: "Pending" as const,
    grantedPatentCertificateLink: "",
    applicationPublicationLink: "",
    form01Link: "",
  });

  const fetchInventorDetails = async (email: string, index: number) => {
    if (!email || !email.includes("@")) return;

    setInventorLoading(index);
    try {
      const response = await api.get(`/project/faculty/by-email?email=${encodeURIComponent(email)}`);
      const data = response.data as FacultyResponse;
      
      if (data.success && data.faculty) {
        setFormData(prev => ({
          ...prev,
          inventors: prev.inventors.map((inv, idx) => 
            idx === index ? {
              ...inv,
              name: data.faculty!.name || "",
            } : inv
          )
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          inventors: prev.inventors.map((inv, idx) =>
            idx === index ? {
              ...inv,
              name: "",
            } : inv
          )
        }));
      }
    } catch {
      setFormData(prev => ({
        ...prev,
        inventors: prev.inventors.map((inv, idx) =>
          idx === index ? {
            ...inv,
            name: "",
          } : inv
        )
      }));
    } finally {
      setInventorLoading(null);
    }
  };

  useEffect(() => {
    // Set up debounced functions for each inventor
    formData.inventors.forEach((_, index) => {
      if (!inventorDebouncers.current[index]) {
        inventorDebouncers.current[index] = debounce((email: string) => {
          void fetchInventorDetails(email, index);
        }, 500);
      }
    });
  }, [formData.inventors.length]);

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleInventorChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      inventors: prev.inventors.map((inv, idx) =>
        idx === index ? { ...inv, [field]: value } : inv
      )
    }));

    // Trigger auto-fill for email changes
    if (field === "email" && value && value.includes("@")) {
      void inventorDebouncers.current[index]?.(value);
    }
  };

  const addInventor = () => {
    setFormData(prev => ({
      ...prev,
      inventors: [...prev.inventors, { name: "", email: "" }]
    }));
  };

  const removeInventor = (index: number) => {
    if (formData.inventors.length > 1) {
      setFormData(prev => ({
        ...prev,
        inventors: prev.inventors.filter((_, idx) => idx !== index)
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      // Convert inventors array to the format expected by the API
      const inventorsName = formData.inventors.map(inv => inv.name).join(", ");
      const submitData = {
        applicationNumber: formData.applicationNumber,
        inventorsName, // Keep backward compatibility
        inventors: formData.inventors.map(inv => ({
          name: inv.name,
          email: inv.email || undefined,
        })),
        department: formData.department,
        title: formData.title,
        campus: formData.campus,
        filingDate: formData.filingDate,
        applicationPublicationDate: formData.applicationPublicationDate || undefined,
        grantedDate: formData.grantedDate || undefined,
        filingFY: formData.filingFY,
        filingAY: formData.filingAY,
        publishedAY: formData.publishedAY || undefined,
        publishedFY: formData.publishedFY || undefined,
        grantedFY: formData.grantedFY || undefined,
        grantedAY: formData.grantedAY || undefined,
        grantedCY: formData.grantedCY || undefined,
        status: formData.status,
        grantedPatentCertificateLink: formData.grantedPatentCertificateLink || undefined,
        applicationPublicationLink: formData.applicationPublicationLink || undefined,
        form01Link: formData.form01Link || undefined,
      };

      console.log("Submitting patent data:", submitData);
      console.log("Data keys:", Object.keys(submitData));
      console.log("Schema keys:", Object.keys(patentSchemas.patentSchema.shape));
      console.log("Schema shape:", patentSchemas.patentSchema.shape);

      let validatedData;
      try {
        validatedData = patentSchemas.patentSchema.parse(submitData);
        console.log("Validated data:", validatedData);
      } catch (validationError) {
        console.error("Client-side validation error:", validationError);
        throw validationError;
      }

      const response = await api.post("/patent/create", validatedData);
      console.log("API response:", response.data);

      toast.success("Patent created successfully!");
      setSuccess(true);
      setTimeout(() => {
        navigate("/patent/view-your");
      }, 2000);
    } catch (err: unknown) {
      console.error("Error creating patent:", err);

      if (err && typeof err === 'object' && 'response' in err) {
        const apiError = err as { response?: { data?: { error?: string; message?: string } } };
        console.error("API error response:", apiError.response);
        if (apiError.response?.data?.message) {
          const errorMessage = apiError.response.data.message;
          setError(errorMessage);
          toast.error(errorMessage);
        } else if (apiError.response?.data?.error) {
          const errorMessage = apiError.response.data.error;
          setError(errorMessage);
          toast.error(errorMessage);
        } else {
          const errorMessage = "Failed to create patent";
          setError(errorMessage);
          toast.error(errorMessage);
        }
      } else if (err && typeof err === 'object' && 'errors' in err) {
        // Handle Zod validation errors
        const zodError = err as { errors?: Array<{ path?: string[], message?: string }> };
        console.error("Validation errors:", zodError.errors);
        const errors: Record<string, string> = {};
        if (zodError.errors) {
          console.log("Zod validation errors:", zodError.errors);
          zodError.errors.forEach((error) => {
            if (error.path && error.path.length > 0) {
              // Handle nested paths like inventors.0.name
              const fieldPath = error.path.join('.');
              if (error.message) {
                errors[fieldPath] = error.message;
                console.log(`Field error: ${fieldPath} - ${error.message}`);
              }
            }
          });
        }
        setFieldErrors(errors);

        // Show specific validation errors in toast
        const errorMessages = Object.values(errors).slice(0, 3); // Show first 3 errors
        const errorText = errorMessages.length > 0
          ? `Validation errors: ${errorMessages.join(', ')}`
          : "Please correct the validation errors";
        toast.error(errorText);
      } else {
        const errorMessage = "Failed to create patent";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!authState) return <Navigate to="/" replace />;
  if (!checkAccess("patent:create")) return <Navigate to="/404" replace />;

  if (uploadMode === "bulk") {
    return <BulkUpload onBack={() => setUploadMode("single")} />;
  }

  return (
    <div className="w-full h-screen overflow-y-auto bg-background-faded">
      <div className="flex flex-col items-center gap-6 p-8">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/patent/view-your")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h2 className="text-3xl font-normal">Add Patent</h2>
          </div>
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
                Single Patent
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

        <Card className="w-full max-w-4xl">
          <CardHeader>
            <CardTitle>Patent Information</CardTitle>
            <CardDescription>
              Fill in the details below to create a new patent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {Object.keys(fieldErrors).length > 0 && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-semibold">Please fix the following validation errors:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {Object.entries(fieldErrors).map(([field, message]) => (
                          <li key={field}>
                            <span className="font-medium">{getFieldDisplayName(field)}:</span> {message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <AlertDescription>
                    Patent created successfully! Redirecting...
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="applicationNumber" className="text-red-600">Application Number *</Label>
                  <Input
                    id="applicationNumber"
                    value={formData.applicationNumber}
                    onChange={(e) => handleInputChange("applicationNumber", e.target.value)}
                    placeholder="e.g., 202411002982"
                    className={fieldErrors.applicationNumber ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                  />
                  {fieldErrors.applicationNumber && (
                    <p className="text-sm text-red-500 mt-1">{fieldErrors.applicationNumber}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Enter the patent application number</p>
                </div>
              </div>

              <div>
                <Label htmlFor="title" className="text-red-600">Title *</Label>
                <Textarea
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Enter the patent title"
                  rows={3}
                  className={fieldErrors.title ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                />
                {fieldErrors.title && (
                  <p className="text-sm text-red-500 mt-1">{fieldErrors.title}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">Enter the full patent title</p>
              </div>

              {/* Inventors Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Inventors
                    </CardTitle>
                    <Button
                      type="button"
                      onClick={addInventor}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Inventor
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {formData.inventors.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No inventors added yet. Click &quot;Add Inventor&quot; to add one.</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {formData.inventors.map((inventor, idx) => (
                        <div key={idx} className="relative">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-medium text-gray-900">Inventor #{idx + 1}</h4>
                            {formData.inventors.length > 1 && (
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => removeInventor(idx)}
                                className="flex items-center gap-2"
                              >
                                <Trash2 className="h-4 w-4" />
                                Remove
                              </Button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50 rounded-lg border">
                            <div>
                              <Label htmlFor={`inventor-${idx}-email`}>Email Address</Label>
                              <div className="relative">
                                <Input
                                  id={`inventor-${idx}-email`}
                                  type="email"
                                  value={inventor.email}
                                  onChange={(e) => handleInventorChange(idx, "email", e.target.value)}
                                  placeholder="Enter email address"
                                />
                                {inventorLoading === idx && <span className="absolute right-2 top-2 text-xs text-blue-500">Loading...</span>}
                              </div>
                              <p className="text-xs text-gray-500 mt-1">Optional - will auto-fill name</p>
                            </div>
                            <div>
                              <Label htmlFor={`inventor-${idx}-name`}>Full Name *</Label>
                              <Input
                                id={`inventor-${idx}-name`}
                                value={inventor.name}
                                onChange={(e) => handleInventorChange(idx, "name", e.target.value)}
                                placeholder="Enter full name"
                                className={fieldErrors[`inventors.${idx}.name`] ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                              />
                              {fieldErrors[`inventors.${idx}.name`] && (
                                <p className="text-sm text-red-500 mt-1">{fieldErrors[`inventors.${idx}.name`]}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="department" className="text-red-600">Department *</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => handleInputChange("department", e.target.value)}
                    placeholder="e.g., EEE, CSE"
                    className={fieldErrors.department ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                  />
                  {fieldErrors.department && (
                    <p className="text-sm text-red-500 mt-1">{fieldErrors.department}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Enter the department name</p>
                </div>

                <div>
                  <Label htmlFor="campus" className="text-red-600">Campus *</Label>
                  <Input
                    id="campus"
                    value={formData.campus}
                    onChange={(e) => handleInputChange("campus", e.target.value)}
                    placeholder="e.g., Hyderabad, Pilani"
                    className={fieldErrors.campus ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                  />
                  {fieldErrors.campus && (
                    <p className="text-sm text-red-500 mt-1">{fieldErrors.campus}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Enter the campus name</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="filingDate" className="text-red-600">Filing Date *</Label>
                  <Input
                    id="filingDate"
                    type="date"
                    value={formData.filingDate}
                    onChange={(e) => handleInputChange("filingDate", e.target.value)}
                    className={fieldErrors.filingDate ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                  />
                  {fieldErrors.filingDate && (
                    <p className="text-sm text-red-500 mt-1">{fieldErrors.filingDate}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Select the filing date</p>
                </div>

                <div>
                  <Label htmlFor="status" className="text-red-600">Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleInputChange("status", value)}
                  >
                    <SelectTrigger className={fieldErrors.status ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Filed">Filed</SelectItem>
                      <SelectItem value="Granted">Granted</SelectItem>
                      <SelectItem value="Abandoned">Abandoned</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldErrors.status && (
                    <p className="text-sm text-red-500 mt-1">{fieldErrors.status}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Select the current status</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="filingFY" className="text-red-600">Filing FY *</Label>
                  <Input
                    id="filingFY"
                    value={formData.filingFY}
                    onChange={(e) => handleInputChange("filingFY", e.target.value)}
                    placeholder="e.g., 2023-24"
                    className={fieldErrors.filingFY ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                  />
                  {fieldErrors.filingFY && (
                    <p className="text-sm text-red-500 mt-1">{fieldErrors.filingFY}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Enter the filing financial year</p>
                </div>

                <div>
                  <Label htmlFor="filingAY" className="text-red-600">Filing AY *</Label>
                  <Input
                    id="filingAY"
                    value={formData.filingAY}
                    onChange={(e) => handleInputChange("filingAY", e.target.value)}
                    placeholder="e.g., 2023-24"
                    className={fieldErrors.filingAY ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                  />
                  {fieldErrors.filingAY && (
                    <p className="text-sm text-red-500 mt-1">{fieldErrors.filingAY}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Enter the filing academic year</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="applicationPublicationDate">Application Publication Date</Label>
                  <Input
                    id="applicationPublicationDate"
                    type="date"
                    value={formData.applicationPublicationDate}
                    onChange={(e) => handleInputChange("applicationPublicationDate", e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">Optional - publication date</p>
                </div>

                <div>
                  <Label htmlFor="grantedDate">Granted Date</Label>
                  <Input
                    id="grantedDate"
                    type="date"
                    value={formData.grantedDate}
                    onChange={(e) => handleInputChange("grantedDate", e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">Optional - granted date</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="publishedAY">Published AY</Label>
                  <Input
                    id="publishedAY"
                    value={formData.publishedAY}
                    onChange={(e) => handleInputChange("publishedAY", e.target.value)}
                    placeholder="e.g., 2023-24"
                  />
                  <p className="text-xs text-gray-500 mt-1">Optional - published academic year</p>
                </div>

                <div>
                  <Label htmlFor="publishedFY">Published FY</Label>
                  <Input
                    id="publishedFY"
                    value={formData.publishedFY}
                    onChange={(e) => handleInputChange("publishedFY", e.target.value)}
                    placeholder="e.g., 2024-25"
                  />
                  <p className="text-xs text-gray-500 mt-1">Optional - published financial year</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="grantedFY">Granted FY</Label>
                  <Input
                    id="grantedFY"
                    value={formData.grantedFY}
                    onChange={(e) => handleInputChange("grantedFY", e.target.value)}
                    placeholder="e.g., 2024-25"
                  />
                  <p className="text-xs text-gray-500 mt-1">Optional - granted financial year</p>
                </div>

                <div>
                  <Label htmlFor="grantedAY">Granted AY</Label>
                  <Input
                    id="grantedAY"
                    value={formData.grantedAY}
                    onChange={(e) => handleInputChange("grantedAY", e.target.value)}
                    placeholder="e.g., 2024-25"
                  />
                  <p className="text-xs text-gray-500 mt-1">Optional - granted academic year</p>
                </div>
              </div>

              <div>
                <Label htmlFor="grantedCY">Granted CY</Label>
                <Input
                  id="grantedCY"
                  value={formData.grantedCY}
                  onChange={(e) => handleInputChange("grantedCY", e.target.value)}
                  placeholder="e.g., 2024"
                />
                <p className="text-xs text-gray-500 mt-1">Optional - granted calendar year</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="grantedPatentCertificateLink">Granted Patent Certificate Link</Label>
                  <Input
                    id="grantedPatentCertificateLink"
                    value={formData.grantedPatentCertificateLink}
                    onChange={(e) => handleInputChange("grantedPatentCertificateLink", e.target.value)}
                    placeholder="https://..."
                  />
                  <p className="text-xs text-gray-500 mt-1">Optional - link to certificate</p>
                </div>

                <div>
                  <Label htmlFor="applicationPublicationLink">Application Publication Link</Label>
                  <Input
                    id="applicationPublicationLink"
                    value={formData.applicationPublicationLink}
                    onChange={(e) => handleInputChange("applicationPublicationLink", e.target.value)}
                    placeholder="https://..."
                  />
                  <p className="text-xs text-gray-500 mt-1">Optional - link to publication</p>
                </div>
              </div>

              <div>
                <Label htmlFor="form01Link">Form 01 Link</Label>
                <Input
                  id="form01Link"
                  value={formData.form01Link}
                  onChange={(e) => handleInputChange("form01Link", e.target.value)}
                  placeholder="https://..."
                />
                <p className="text-xs text-gray-500 mt-1">Optional - link to Form 01</p>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={loading} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  {loading ? "Creating..." : "Create Patent"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 