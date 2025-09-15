import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/spinner";
import { FileUploader } from "@/components/ui/file-uploader";
import { ExternalLink, File, Replace, XIcon } from "lucide-react";
import { toast } from "sonner";
import { phdSchemas } from "lib";

interface QualifyingExam {
  id: number;
  examName: string;
  submissionDeadline: string;
  examStartDate: string;
  examEndDate: string;
  vivaDate?: string;
  semester: { year: string; semesterNumber: number };
}

interface ApplicationStatus {
  id: number;
  qualifyingArea1: string;
  qualifyingArea2: string;
  files: Record<string, string | null>;
}

interface QualifyingExamApplicationProps {
  exam: QualifyingExam;
  existingApplication?: ApplicationStatus | null;
  onSuccess: () => void;
  onCancel: () => void;
}

interface ApplicationFormData {
  qualifyingArea1: string;
  qualifyingArea2: string;
}

const QualifyingExamApplication: React.FC<QualifyingExamApplicationProps> = ({
  exam,
  existingApplication,
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState<ApplicationFormData>({
    qualifyingArea1: "",
    qualifyingArea2: "",
  });

  // Dynamically build FileFields type from phdSchemas.fileFieldNames
  type FileFieldKey = (typeof phdSchemas.fileFieldNames)[number];
  type FileFields = Record<FileFieldKey, File | null>;

  const initialFiles: FileFields = phdSchemas.fileFieldNames.reduce(
    (acc, key) => {
      acc[key] = null;
      return acc;
    },
    {} as FileFields
  );
  const [files, setFiles] = useState<FileFields>(initialFiles);

  const [customAreas, setCustomAreas] = useState<{
    area1: string;
    area2: string;
  }>({ area1: "", area2: "" });

  useEffect(() => {
    if (existingApplication) {
      setFormData({
        qualifyingArea1: existingApplication.qualifyingArea1,
        qualifyingArea2: existingApplication.qualifyingArea2,
      });
    }
  }, [existingApplication]);

  const { data: subAreasData } = useQuery({
    queryKey: ["phd-sub-areas"],
    queryFn: async () => {
      const response = await api.get<{ subAreas: string[] }>(
        "/phd/getSubAreas"
      );
      return response.data;
    },
  });

  const submitApplicationMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await api.post(
        "/phd/student/uploadQeApplicationForm",
        data,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return response.data as { success: boolean; message: string };
    },
    onSuccess,
    onError: (e) => {
      toast.error(
        (e as { response?: { data: string } }).response?.data ||
          "Failed to submit application"
      );
    },
  });

  const handleFileChange = (fileType: FileFieldKey, file: File | null) => {
    setFiles((prev) => ({ ...prev, [fileType]: file }));
  };

  const handleAreaChange = (
    areaKey: "qualifyingArea1" | "qualifyingArea2",
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [areaKey]: value }));
    if (value !== "__not_listed__") {
      setCustomAreas((prev) => ({
        ...prev,
        [areaKey === "qualifyingArea1" ? "area1" : "area2"]: "",
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const area1 =
      formData.qualifyingArea1 === "__not_listed__"
        ? customAreas.area1.trim()
        : formData.qualifyingArea1;
    const area2 =
      formData.qualifyingArea2 === "__not_listed__"
        ? customAreas.area2.trim()
        : formData.qualifyingArea2;
    if (!area1 || !area2) {
      toast.error("Please select or enter both qualifying areas");
      return;
    }
    if (area1 === area2) {
      toast.error("Please select different areas");
      return;
    }

    const isNewApplication = !existingApplication;
    // Required fields except mastersReport
    const requiredFiles = phdSchemas.fileFieldNames.filter(
      (key) => key !== "mastersReport"
    );

    for (const field of requiredFiles) {
      if (isNewApplication && !files[field]) {
        toast.error("Please upload all required documents.");
        return;
      }
    }

    const submitData = new FormData();
    submitData.append("examId", exam.id.toString());
    submitData.append("qualifyingArea1", area1);
    submitData.append("qualifyingArea2", area2);

    if (existingApplication) {
      submitData.append("applicationId", existingApplication.id.toString());
    }

    for (const key of phdSchemas.fileFieldNames) {
      if (files[key]) {
        submitData.append(key, files[key]);
      }
    }

    submitApplicationMutation.mutate(submitData);
  };

  const subAreas = subAreasData?.subAreas || [];

  return (
    <div className="space-y-6">
      {/* Exam Details Card remains the same */}
      <Card>
        <CardHeader>
          <CardTitle>Application Form</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* Area selection dropdowns */}
              <div>
                <Label htmlFor="qualifyingArea1">Qualifying Area 1</Label>
                <select
                  id="qualifyingArea1"
                  value={formData.qualifyingArea1}
                  onChange={(e) =>
                    handleAreaChange("qualifyingArea1", e.target.value)
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select Area 1</option>
                  {subAreas.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                  <option value="__not_listed__">Not listed...</option>
                </select>
                {formData.qualifyingArea1 === "__not_listed__" && (
                  <input
                    type="text"
                    className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Enter custom area 1"
                    value={customAreas.area1}
                    onChange={(e) =>
                      setCustomAreas((prev) => ({
                        ...prev,
                        area1: e.target.value,
                      }))
                    }
                    required
                  />
                )}
              </div>
              <div>
                <Label htmlFor="qualifyingArea2">Qualifying Area 2</Label>
                <select
                  id="qualifyingArea2"
                  value={formData.qualifyingArea2}
                  onChange={(e) =>
                    handleAreaChange("qualifyingArea2", e.target.value)
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select Area 2</option>
                  {subAreas.map((area) => (
                    <option
                      key={area}
                      value={area}
                      disabled={area === formData.qualifyingArea1}
                    >
                      {area}
                    </option>
                  ))}
                  <option value="__not_listed__">Not listed...</option>
                </select>
                {formData.qualifyingArea2 === "__not_listed__" && (
                  <input
                    type="text"
                    className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Enter custom area 2"
                    value={customAreas.area2}
                    onChange={(e) =>
                      setCustomAreas((prev) => ({
                        ...prev,
                        area2: e.target.value,
                      }))
                    }
                    required
                  />
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-medium">
                Required Documents (PDF only)
              </h4>
              {phdSchemas.fileFieldNames.map((key) => {
                const label = phdSchemas.fileFieldLabels[key];
                const required = key !== "mastersReport";
                const existingFileUrl = existingApplication?.files[key];
                const newFile = files[key];
                return (
                  <div key={key}>
                    <Label htmlFor={key}>
                      {label}
                      {required && " *"}
                    </Label>
                    {key === "mastersReport" && (
                      <span className="ml-2 text-xs text-gray-500">
                        (Required only if you have completed a master&apos;s
                        degree)
                      </span>
                    )}
                    {newFile ? (
                      <div className="mt-1 flex items-center justify-between gap-2 rounded-md border bg-gray-50 p-3">
                        <span className="text-sm text-gray-700">
                          {newFile.name}
                        </span>
                        <Button
                          variant="ghost"
                          type="button"
                          onClick={() => handleFileChange(key, null)}
                          className="h-6 w-6 p-1"
                        >
                          <XIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : existingFileUrl ? (
                      <div className="mt-1 flex items-center justify-between gap-2 rounded-md border bg-blue-50 p-3">
                        <a
                          href={existingFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                        >
                          <File className="h-4 w-4" /> View Current File{" "}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          onClick={() =>
                            document.getElementById(`uploader-${key}`)?.click()
                          }
                        >
                          <Replace className="mr-2 h-4 w-4" /> Replace
                        </Button>
                        {/* Hidden file uploader to be triggered by the button */}
                        <div className="hidden">
                          <FileUploader
                            id={`uploader-${key}`}
                            value={[]}
                            onValueChange={(val) =>
                              handleFileChange(key, val[0] || null)
                            }
                            accept={{ "application/pdf": [] }}
                          />
                        </div>
                      </div>
                    ) : (
                      <FileUploader
                        value={[]}
                        onValueChange={(val) =>
                          handleFileChange(key, val[0] || null)
                        }
                        disabled={submitApplicationMutation.isLoading}
                        accept={{ "application/pdf": [] }}
                        className="mt-1"
                      />
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      {required ? "Required" : "Optional"} - PDF format only
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="flex space-x-4">
              <Button
                type="submit"
                disabled={submitApplicationMutation.isLoading}
                className="flex-1"
              >
                {submitApplicationMutation.isLoading ? (
                  <>
                    <LoadingSpinner className="mr-2 h-4 w-4" /> Submitting...
                  </>
                ) : existingApplication ? (
                  "Resubmit Application"
                ) : (
                  "Submit Application"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={submitApplicationMutation.isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default QualifyingExamApplication;
