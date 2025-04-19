"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import RemarksModal from "./RemarksModal";
import api from "@/lib/axios-instance";
import { toast } from "sonner";

const SECTIONS = ["MidSem", "Compre", "Others"];
const FIELDS = [
  { key: "language", label: "Language is simple and clear" },
  {
    key: "length",
    label: "Length of the paper is appropriate to the time allocated",
  },
  {
    key: "mixOfQuestions",
    label:
      "Has good mix of questions representing different order of thinking skills",
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

export default function EvaluationFormModal({
  open,
  courseCode,
  requestId,
  email,
  onOpenChange,
}: {
  open: boolean;
  courseCode?: string;
  requestId?: string;
  email?: string;
  onOpenChange: (open: boolean) => void;
}) {
  const [formData, setFormData] = useState<FormData>({});
  const [remarksModalOpen, setRemarksModalOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Initialize form data structure
  const initializeFormData = () => {
    const initialData: FormData = {};
    SECTIONS.forEach((section) => {
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

  // Fetch existing review data
  const fetchReview = async () => {
    if (!requestId || !email) return;

    setLoading(true);
    try {
      const response = await api.get(`/qp/getReviews/${email}/${requestId}`);
      if (response.data.success && response.data.data) {
        // Merge fetched data with initialized form structure
        const initializedData = initializeFormData();
        SECTIONS.forEach((section) => {
          if (response.data.data[section]) {
            initializedData[section] = {
              ...initializedData[section],
              ...response.data.data[section],
            };
          }
        });
        setFormData(initializedData);
      } else {
        // Initialize fresh form if no data exists
        setFormData(initializeFormData());
      }
    } catch (error) {
      console.error("Error fetching review:", error);
      setFormData(initializeFormData());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchReview();
    }
  }, [open, requestId, email]);

  const handleInputChange = (section: string, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        requestId: Number(requestId),
        email,
        review: formData,
      };

      const response = await api.post("/qp/submitReview", payload);

      if (response.data.success) {
        toast.success("Review submitted successfully");
        onOpenChange(false);
      } else {
        toast.error(response.data.message || "Failed to submit review");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
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
    handleInputChange(currentSection, "remarks", remarks);
    setRemarksModalOpen(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{courseCode} Evaluation Form</DialogTitle>
          </DialogHeader>
          {loading ? (
            <p className="text-center">Loading...</p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-4">
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px] font-medium">
                        Evaluation Component
                      </TableHead>
                      {FIELDS.map((field) => (
                        <TableHead
                          key={field.key}
                          className="text-center font-medium"
                        >
                          {field.label}
                        </TableHead>
                      ))}
                      <TableHead className="text-center font-medium">
                        Remarks (if any)
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {SECTIONS.map((section) => (
                      <TableRow key={section}>
                        <TableCell className="font-medium">{section}</TableCell>
                        {FIELDS.map((field) => (
                          <TableCell key={field.key}>
                            <Input
                              type="text"
                              className="text-center"
                              value={formData[section]?.[field.key] || ""}
                              onChange={(e) =>
                                handleInputChange(
                                  section,
                                  field.key,
                                  e.target.value
                                )
                              }
                              required
                            />
                          </TableCell>
                        ))}
                        <TableCell>
                          <Input
                            type="text"
                            value={formData[section]?.remarks || ""}
                            readOnly
                            placeholder="Click to add remarks"
                            className="cursor-pointer hover:bg-gray-100"
                            onClick={() => openRemarksModal(section)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-6 flex justify-center">
                <Button type="submit" className="px-8" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <RemarksModal
        open={remarksModalOpen}
        onOpenChange={setRemarksModalOpen}
        initialValue={
          currentSection ? formData[currentSection]?.remarks || "" : ""
        }
        onSave={handleRemarksSave}
      />
    </>
  );
}
