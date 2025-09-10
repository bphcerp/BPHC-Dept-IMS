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

interface FileFields {
  qualifyingArea1Syllabus: File | null;
  qualifyingArea2Syllabus: File | null;
  tenthReport: File | null;
  twelfthReport: File | null;
  undergradReport: File | null;
  mastersReport: File | null;
}

const fileMetadata = [
  {
    key: "qualifyingArea1Syllabus",
    label: "Qualifying Area 1 Syllabus",
    required: true,
  },
  {
    key: "qualifyingArea2Syllabus",
    label: "Qualifying Area 2 Syllabus",
    required: true,
  },
  { key: "tenthReport", label: "10th Grade Report Card", required: true },
  { key: "twelfthReport", label: "12th Grade Report Card", required: true },
  {
    key: "undergradReport",
    label: "Undergraduate Report Card",
    required: true,
  },
  { key: "mastersReport", label: "Masters Report Card", required: false },
] as const;

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

  const [files, setFiles] = useState<FileFields>({
    qualifyingArea1Syllabus: null,
    qualifyingArea2Syllabus: null,
    tenthReport: null,
    twelfthReport: null,
    undergradReport: null,
    mastersReport: null,
  });

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
    onError: () => {
      toast.error("Failed to submit application");
    },
  });

  const handleFileChange = (fileType: keyof FileFields, file: File | null) => {
    setFiles((prev) => ({ ...prev, [fileType]: file }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.qualifyingArea1 || !formData.qualifyingArea2) {
      toast.error("Please select both qualifying areas");
      return;
    }
    if (formData.qualifyingArea1 === formData.qualifyingArea2) {
      toast.error("Please select different areas");
      return;
    }

    const isNewApplication = !existingApplication;
    const requiredFiles: (keyof FileFields)[] = [
      "qualifyingArea1Syllabus",
      "qualifyingArea2Syllabus",
      "tenthReport",
      "twelfthReport",
      "undergradReport",
    ];

    for (const field of requiredFiles) {
      if (isNewApplication && !files[field]) {
        toast.error(
          "Please upload all required documents. Only the Master's report is optional."
        );
        return;
      }
    }

    const submitData = new FormData();
    submitData.append("examId", exam.id.toString());
    submitData.append("qualifyingArea1", formData.qualifyingArea1);
    submitData.append("qualifyingArea2", formData.qualifyingArea2);

    if (existingApplication) {
      submitData.append("applicationId", existingApplication.id.toString());
    }

    for (const key in files) {
      const fileKey = key as keyof FileFields;
      if (files[fileKey]) {
        submitData.append(fileKey, files[fileKey]);
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
                {" "}
                <Label htmlFor="qualifyingArea1">
                  Qualifying Area 1 *
                </Label>{" "}
                <select
                  id="qualifyingArea1"
                  value={formData.qualifyingArea1}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      qualifyingArea1: e.target.value,
                    }))
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                >
                  {" "}
                  <option value="">Select Area 1</option>
                  {subAreas.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>{" "}
              </div>{" "}
              <div>
                {" "}
                <Label htmlFor="qualifyingArea2">
                  Qualifying Area 2 *
                </Label>{" "}
                <select
                  id="qualifyingArea2"
                  value={formData.qualifyingArea2}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      qualifyingArea2: e.target.value,
                    }))
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                >
                  {" "}
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
                </select>{" "}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-medium">
                Required Documents (PDF only)
              </h4>
              {fileMetadata.map(({ key, label, required }) => {
                const existingFileUrl = existingApplication?.files[key];
                const newFile = files[key];

                return (
                  <div key={key}>
                    <Label htmlFor={key}>
                      {label}
                      {required && " *"}
                    </Label>
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
