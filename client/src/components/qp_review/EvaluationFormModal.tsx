"use client";

import type React from "react";
import { useState } from "react";
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

export default function EvaluationFormModal({
  open,
  courseCode,
  onOpenChange,
}: {
  open: boolean;
  courseCode: string | undefined;
  onOpenChange: (open: boolean) => void;
}) {
  const [formData, setFormData] = useState<{
    [section: string]: {
      [field: string]: string;
      remarks: string;
    };
  }>(
    SECTIONS.reduce(
      (acc, section) => ({
        ...acc,
        [section]: FIELDS.reduce(
          (subAcc, field) => ({ ...subAcc, [field.key]: "" }),
          { remarks: "" }
        ),
      }),
      {}
    )
  );

  const [remarksModalOpen, setRemarksModalOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState<string>("");

  const handleInputChange = (section: string, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    onOpenChange(false);
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
                      <TableCell className="font-medium">
                        {section === "others"
                          ? "Others (if any)"
                          : section.replace(/([A-Z])/g, " $1")}
                      </TableCell>
                      {FIELDS.map((field) => (
                        <TableCell key={field.key}>
                          <Input
                            type="text"
                            className="text-center"
                            value={formData[section][field.key]}
                            onChange={(e) =>
                              handleInputChange(
                                section,
                                field.key,
                                e.target.value
                              )
                            }
                          />
                        </TableCell>
                      ))}
                      <TableCell>
                        <div className="flex items-center gap-2 px-2 text-center">
                          <Input
                            type="text"
                            value={formData[section].remarks}
                            readOnly
                            placeholder="Open"
                            className="cursor-pointer px-5 hover:bg-black hover:text-white hover:placeholder:text-white"
                            onClick={() => openRemarksModal(section)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-6 flex justify-center">
              <Button type="submit" className="px-8">
                Submit
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <RemarksModal
        open={remarksModalOpen}
        onOpenChange={setRemarksModalOpen}
        initialValue={currentSection ? formData[currentSection].remarks : ""}
        onSave={handleRemarksSave}
      />
    </>
  );
}
