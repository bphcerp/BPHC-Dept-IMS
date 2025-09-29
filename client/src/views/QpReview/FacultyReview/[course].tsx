"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Info, Save } from "lucide-react";
import RemarksModal from "@/components/qp_review/RemarksModal";
import api from "@/lib/axios-instance";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const tabItems = [
  { value: "midSemQp", label: "Mid Sem" },
  { value: "midSemSol", label: "Mid Sem Solutions" },
  { value: "compreQp", label: "Compre" },
  { value: "compreSol", label: "Compre Solutions" },
];

const ALL_SECTIONS = ["MidSem", "Compre", "Others"];
const FIELDS = [
  { key: "language", label: "Language is simple and clear" },
  {
    key: "length",
    label: "Length of the paper is appropriate to the time allocated",
  },
  {
    key: "mixOfQuestions",
    label: "Has good mix of questions representing different order of thinking skills",
  },
  { key: "coverLearning", label: "Questions cover important learning aspects" },
  {
    key: "solution",
    label: "Solution is well-prepared and mark distribution is shown in detail",
  },
];

interface FormData {
  [section: string]: {
    [field: string]: string;
    remarks: string;
  };
}

export default function FacultyReview() {
  const [files, setFiles] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<FormData>({});
  const [remarksModalOpen, setRemarksModalOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [courseInfo, setCourseInfo] = useState({ courseName: "", courseCode: "" });
  const navigate = useNavigate();
  
  const location = useLocation();
  const requestId = location.state?.requestId;

  // Determine which sections to show based on available files
  const getAvailableSections = () => {
    const sections = [];
    
    // Check if MidSem documents exist
    const hasMidSem = files["midSemQp"] || files["midSemSol"];
    if (hasMidSem) {
      sections.push("MidSem");
    }
    
    // Check if Compre documents exist
    const hasCompre = files["compreQp"] || files["compreSol"];
    if (hasCompre) {
      sections.push("Compre");
    }
    
    // Always include Others section
    sections.push("Others");
    
    return sections;
  };

  // Initialize form data structure based on available sections
  const initializeFormData = (availableSections: string[]) => {
    const initialData: FormData = {};
    availableSections.forEach((section) => {
      initialData[section] = {
        language: "",
        length: "",
        mixOfQuestions: "",
        coverLearning: "",
        solution: "",
        remarks: "",
      };
    });
    return initialData;
  };

  // Fetch files and review data
  useEffect(() => {
    async function fetchData() {
      if (!requestId) return;

      try {
        // Fetch files first
        const filesResponse = await api.get(
          `/qp/getFilesByRequestID/${Number(requestId)}`
        );
        setFiles(filesResponse.data.data);

        // After files are loaded, determine available sections
        const availableSections = getAvailableSectionsFromFiles(filesResponse.data.data);
        
        // Fetch existing review data
        const reviewResponse = await api.get(`/qp/getReviews/${requestId}`);
        
        if (reviewResponse.data.success && reviewResponse.data.data) {
          const responseData = reviewResponse.data.data;
          
          // Set course information
          setCourseInfo({
            courseName: responseData.courseName || "",
            courseCode: responseData.courseCode || "",
          });
          
          // Initialize form data with available sections
          const initializedData = initializeFormData(availableSections);
          
          // Populate form data with existing review data
          if (responseData.review) {
            availableSections.forEach((section) => {
              if (responseData.review[section]) {
                // Merge existing review data with initialized structure
                initializedData[section] = {
                  language: responseData.review[section].language || "",
                  length: responseData.review[section].length || "",
                  mixOfQuestions: responseData.review[section].mixOfQuestions || "",
                  coverLearning: responseData.review[section].coverLearning || "",
                  solution: responseData.review[section].solution || "",
                  remarks: responseData.review[section].remarks || "",
                };
              }
            });
          }
          
          setFormData(initializedData);
        } else {
          // Initialize fresh form if no data exists
          setFormData(initializeFormData(availableSections));
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        // Initialize with minimal data on error
        setFormData(initializeFormData(["Others"]));
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [requestId ]);

  // Helper function to determine sections from files data
  const getAvailableSectionsFromFiles = (filesData: Record<string, string | null>) => {
    const sections = [];
    
    // Check if MidSem documents exist
    const hasMidSem = filesData["midSemQp"] || filesData["midSemSol"];
    if (hasMidSem) {
      sections.push("MidSem");
    }
    
    // Check if Compre documents exist
    const hasCompre = filesData["compreQp"] || filesData["compreSol"];
    if (hasCompre) {
      sections.push("Compre");
    }
    
    // Always include Others section
    sections.push("Others");
    
    return sections;
  };

  // Validate and handle input changes for numeric fields
  const handleInputChange = (section: string, field: string, value: string) => {
    // Remove any non-digit characters
    const numericValue = value.replace(/\D/g, '');
    
    // Convert to number and validate range
    const numValue = parseInt(numericValue);
    
    // Only update if empty, or if it's a valid number between 0-10
    if (numericValue === '' || (numValue >= 0 && numValue <= 10)) {
      setFormData((prev) => ({
        ...prev,
        [section]: { ...prev[section], [field]: numericValue },
      }));
    }
  };

  // Handle key press to prevent form submission on Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  // Save Review (draft) - uses the same endpoint but different messaging
  const handleSave = async () => {
    setSaving(true);

    try {
      const payload = {
        requestId: Number(requestId),
        email : "test@test.com", 
        review: formData,
      };

      const response = await api.post("/qp/saveReview", payload);

      if (response.data.success) {
        toast.success("Review saved as draft successfully");
      } else {
        toast.error(response.data.message || "Failed to save review");
      }
    } catch (error) {
      console.error("Review save error:", error);
      toast.error("Failed to save review");
    } finally {
      setSaving(false);
    }
  };

  // Submit Review (final submission)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        requestId: Number(requestId),
        email : "test@test.com", // Email is now optional and handled server-side
        review: formData,
      };

      const response = await api.post("/qp/submitReview", payload);

      if (response.data.success) {
        toast.success("Review submitted successfully");
        navigate(`/qpReview/facultyReview`)
      } else {
        toast.error(response.data.message || "Failed to submit review");
      }
    } catch (error) {
      console.error("Review submission error:", error);
      toast.error("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const openRemarksModal = (section: string) => {
    setCurrentSection(section);
    setRemarksModalOpen(true);
  };

  const handleRemarksSave = (remarks: string) => {
    setFormData((prev) => ({
      ...prev,
      [currentSection]: { ...prev[currentSection], remarks: remarks },
    }));
    setRemarksModalOpen(false);
  };

  // Filter tabs to only show those with valid document URLs
  const availableTabs = tabItems.filter(tab => files[tab.value]);
  
  // Get sections to display in the evaluation form
  const sectionsToShow = getAvailableSections();

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <main className="w-full bg-background">
      <div className="mx-4 mt-2">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold">Faculty Review</h1>
        </div>

        {/* Horizontal Layout Container */}
        <div className="flex gap-4 h-[85vh]">
          {/* Left Panel - Documents Section */}
          <div className="flex-1 overflow-hidden rounded-md border">
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="text-lg font-semibold">Review Documents</h2>
            </div>

            {availableTabs.length === 0 ? (
              <div className="flex h-full items-center justify-center bg-gray-100">
                <p className="text-gray-500">No documents available for review</p>
              </div>
            ) : (
              <div className="h-full">
                <Tabs defaultValue={availableTabs[0]?.value} className="w-full h-full flex flex-col">
                  <div className="border-b px-4 flex-shrink-0">
                    <TabsList className="h-12 bg-transparent">
                      {availableTabs.map((tab) => (
                        <TabsTrigger
                          key={tab.value}
                          value={tab.value}
                          className="data-[state=active]:bg-gray-300"
                        >
                          {tab.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  {availableTabs.map((tab) => (
                    <TabsContent key={tab.value} value={tab.value} className="m-0 flex-1">
                      <DocumentPreview documentUrl={files[tab.value]} />
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            )}
          </div>

          {/* Right Panel - Evaluation Form Section */}
          <div className="flex-1 overflow-hidden rounded-md border">
            <div className="border-b p-4 flex-shrink-0">
              <h2 className="text-xl font-semibold">
                {courseInfo.courseCode ? `${courseInfo.courseCode}` : "Course"} Evaluation Form
              </h2>
              {courseInfo.courseName && (
                <p className="text-sm text-gray-500 mt-1">
                  {courseInfo.courseName}
                </p>
              )}
              <p className="text-sm text-gray-600 mt-1">
                Showing evaluation for: {sectionsToShow.filter(s => s !== "Others").join(", ") || "General review"}
              </p>
              
              {/* Rating Instructions */}
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Rating Instructions:</p>
                    <ul className="space-y-1 text-sm">
                      <li>• Rate each criterion on a scale of <strong>0 to 10</strong></li>
                      <li>• <strong>10</strong> = Excellent/Best quality</li>
                      <li>• <strong>0</strong> = Poor/Worst quality</li>
                      <li>• Only <strong>whole numbers</strong> (integers) are allowed</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 h-full overflow-auto">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Vertical Table Layout - Criteria as rows, sections as columns */}
                <div className="overflow-x-auto rounded-md border">
                  <Table className="text-sm">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-1/2 font-medium text-sm">
                          Evaluation Criteria
                        </TableHead>
                        {sectionsToShow.map((section) => (
                          <TableHead
                            key={section}
                            className="text-center font-medium text-sm min-w-24"
                          >
                            {section}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Each field becomes a row */}
                      {FIELDS.map((field) => (
                        <TableRow key={field.key}>
                          <TableCell className="font-medium text-sm bg-gray-50 p-3">
                            {field.label}
                          </TableCell>
                          {sectionsToShow.map((section) => (
                            <TableCell key={section} className="p-2">
                              <Input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                className="text-center text-sm h-10 font-medium"
                                value={formData[section]?.[field.key] || ""}
                                onChange={(e) =>
                                  handleInputChange(
                                    section,
                                    field.key,
                                    e.target.value
                                  )
                                }
                                onKeyPress={handleKeyPress}
                                placeholder="0-10"
                                min="0"
                                max="10"
                                title="Enter a number between 0 and 10"
                                required
                              />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                      
                      {/* Remarks row */}
                      <TableRow>
                        <TableCell className="font-medium text-sm bg-gray-50 p-3">
                          Remarks
                        </TableCell>
                        {sectionsToShow.map((section) => (
                          <TableCell key={section} className="p-2">
                            <Input
                              type="text"
                              value={formData[section]?.remarks || ""}
                              readOnly
                              placeholder="Click to add"
                              className="cursor-pointer hover:bg-gray-100 text-sm h-10"
                              onClick={() => openRemarksModal(section)}
                              onKeyPress={handleKeyPress}
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3 justify-center pt-4">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={handleSave}
                    className="px-6 py-2 text-sm"
                    disabled={saving || submitting}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Saving..." : "Save Review"}
                  </Button>
                  
                  <Button 
                    type="submit" 
                    className="px-6 py-2 text-sm" 
                    disabled={submitting || saving}
                  >
                    {submitting ? "Submitting..." : "Submit Review"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <RemarksModal
        open={remarksModalOpen}
        onOpenChange={setRemarksModalOpen}
        initialValue={
          currentSection ? formData[currentSection]?.remarks || "" : ""
        }
        onSave={handleRemarksSave}
      />
    </main>
  );
}

function DocumentPreview({ documentUrl }: { documentUrl: string | null }) {
  if (!documentUrl) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-100">
        <p className="text-gray-500">No document available</p>
      </div>
    );
  }

  return (
    <div className="relative h-full bg-gray-100">
      {/* Download Button - Top Right Corner */}
      <div className="absolute top-4 right-4 z-10">
        <a href={documentUrl} download target="_blank" rel="noopener noreferrer">
          <Button size="sm" className="flex gap-2 shadow-lg">
            <Download className="h-4 w-4" />
            Download
          </Button>
        </a>
      </div>

      {/* PDF Preview */}
      <iframe
        src={documentUrl}
        className="w-full h-full border-0"
        title="Document Preview"
        loading="lazy"
      >
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Your browser doesn't support PDF preview
            </p>
            <a href={documentUrl} download target="_blank" rel="noopener noreferrer">
              <Button className="flex gap-2">
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            </a>
          </div>
        </div>
      </iframe>
    </div>
  );
}
