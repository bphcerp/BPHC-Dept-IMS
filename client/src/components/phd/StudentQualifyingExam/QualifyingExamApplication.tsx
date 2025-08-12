import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/spinner";
import { FileUploader } from "@/components/ui/file-uploader";
import { XIcon } from "lucide-react";
import { toast } from "sonner";

interface QualifyingExam {
  id: number;
  examName: string;
  submissionDeadline: string;
  examStartDate: string;
  examEndDate: string;
  vivaDate?: string;
  semester: {
    year: string;
    semesterNumber: number;
  };
}

interface QualifyingExamApplicationProps {
  exam: QualifyingExam;
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

const QualifyingExamApplication: React.FC<QualifyingExamApplicationProps> = ({
  exam,
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

  const { data: subAreasData, isLoading: isLoadingSubAreas } = useQuery({
    queryKey: ["phd-sub-areas"],
    queryFn: async () => {
      const response = await api.get<{
        subAreas: string[];
      }>("/phd/getSubAreas");
      return response.data;
    },
  });

  const submitApplicationMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await api.post(
        "/phd/student/uploadQeApplicationForm",
        data,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data as { success: boolean; message: string };
    },
    onSuccess: () => {
      onSuccess();
    },
    onError: (error: unknown) => {
      interface ErrorWithResponse {
        response?: {
          data?: {
            message?: string;
          };
        };
      }
      const errorMessage =
        (error as ErrorWithResponse)?.response?.data?.message ||
        "Failed to submit application";
      toast.error(errorMessage);
    },
  });

  const handleFileChange = (fileType: keyof FileFields, file: File | null) => {
    setFiles((prev) => ({ ...prev, [fileType]: file }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!formData.qualifyingArea1 || !formData.qualifyingArea2) {
      toast.error("Please select both qualifying areas");
      return;
    }

    if (formData.qualifyingArea1 === formData.qualifyingArea2) {
      toast.error("Please select different areas for Area 1 and Area 2");
      return;
    }

    if (
      !files.qualifyingArea1Syllabus ||
      !files.qualifyingArea2Syllabus ||
      !files.tenthReport ||
      !files.twelfthReport ||
      !files.undergradReport
    ) {
      toast.error(
        "Please upload all required files. Only masters report is optional."
      );
      return;
    }

    // Validate file types (PDF only)
    const validateFile = (file: File) => {
      return file.type === "application/pdf";
    };

    const requiredFiles = [
      files.qualifyingArea1Syllabus,
      files.qualifyingArea2Syllabus,
      files.tenthReport,
      files.twelfthReport,
      files.undergradReport,
    ];

    if (!requiredFiles.every((file) => file && validateFile(file))) {
      toast.error("Please upload only PDF files for all required documents");
      return;
    }

    if (files.mastersReport && !validateFile(files.mastersReport)) {
      toast.error("Please upload only PDF files");
      return;
    }

    // Create form data
    const submitData = new FormData();
    submitData.append("examId", exam.id.toString());
    submitData.append("qualifyingArea1", formData.qualifyingArea1);
    submitData.append("qualifyingArea2", formData.qualifyingArea2);

    // Add all files
    submitData.append("qualifyingArea1Syllabus", files.qualifyingArea1Syllabus);
    submitData.append("qualifyingArea2Syllabus", files.qualifyingArea2Syllabus);
    submitData.append("tenthReport", files.tenthReport);
    submitData.append("twelfthReport", files.twelfthReport);
    submitData.append("undergradReport", files.undergradReport);
    if (files.mastersReport) {
      submitData.append("mastersReport", files.mastersReport);
    }

    submitApplicationMutation.mutate(submitData);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (isLoadingSubAreas) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  const subAreas = subAreasData?.subAreas || [];

  return (
    <div className="space-y-6">
      {/* Exam Details */}
      <Card>
        <CardHeader>
          <CardTitle>Exam Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium">Exam Name:</p>
              <p className="text-sm text-gray-600">{exam.examName}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Semester:</p>
              <p className="text-sm text-gray-600">
                {exam.semester.year} - Semester {exam.semester.semesterNumber}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Registration Deadline:</p>
              <p className="text-sm text-gray-600">
                {formatDate(exam.submissionDeadline)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Exam Period:</p>
              <p className="text-sm text-gray-600">
                {formatDate(exam.examStartDate)} -{" "}
                {formatDate(exam.examEndDate)}
              </p>
            </div>
            {exam.vivaDate && (
              <div>
                <p className="text-sm font-medium">Viva Date:</p>
                <p className="text-sm text-gray-600">
                  {formatDate(exam.vivaDate)}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Application Form */}
      <Card>
        <CardHeader>
          <CardTitle>Application Form</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Qualifying Areas */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="qualifyingArea1">Qualifying Area 1 *</Label>
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
                  <option value="">Select Area 1</option>
                  {subAreas.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="qualifyingArea2">Qualifying Area 2 *</Label>
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
                </select>
              </div>
            </div>

            {/* File Uploads */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium">
                Required Documents (PDF only)
              </h4>

              {[
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
                {
                  key: "tenthReport",
                  label: "10th Grade Report Card",
                  required: true,
                },
                {
                  key: "twelfthReport",
                  label: "12th Grade Report Card",
                  required: true,
                },
                {
                  key: "undergradReport",
                  label: "Undergraduate Report Card",
                  required: true,
                },
                {
                  key: "mastersReport",
                  label: "Masters Report Card",
                  required: false,
                },
              ].map((fileField) => (
                <div key={fileField.key}>
                  <Label htmlFor={fileField.key}>
                    {fileField.label} {fileField.required && "*"}
                  </Label>
                  {files[fileField.key as keyof FileFields] ? (
                    <div className="mt-1 space-y-2">
                      <div className="flex items-center justify-between gap-2 rounded-md border bg-gray-50 p-3">
                        <span className="text-sm text-gray-700">
                          {
                            (files[fileField.key as keyof FileFields] as File)
                              .name
                          }
                        </span>
                        <Button
                          variant="outline"
                          type="button"
                          onClick={() =>
                            handleFileChange(
                              fileField.key as keyof FileFields,
                              null
                            )
                          }
                          className="aspect-square rounded-full p-1"
                          aria-label="Remove file"
                        >
                          <XIcon className="h-4 w-4" />
                        </Button>
                      </div>
                      {files[fileField.key as keyof FileFields] && (
                        <div className="relative mt-2 w-full">
                          <iframe
                            src={URL.createObjectURL(
                              files[fileField.key as keyof FileFields] as File
                            )}
                            className="h-64 w-full rounded border"
                            title="File Preview"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <FileUploader
                      value={[]}
                      onValueChange={(val) =>
                        handleFileChange(
                          fileField.key as keyof FileFields,
                          val[0] || null
                        )
                      }
                      disabled={submitApplicationMutation.isLoading}
                      accept={{ "application/pdf": [] }}
                      className="mt-1"
                    />
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {fileField.required ? "Required" : "Optional"} - Upload in
                    PDF format only
                  </p>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <Button
                type="submit"
                disabled={submitApplicationMutation.isLoading}
                className="flex-1"
              >
                {submitApplicationMutation.isLoading ? (
                  <>
                    <LoadingSpinner className="mr-2 h-4 w-4" />
                    Submitting...
                  </>
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
