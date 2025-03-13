"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const evaluationData: Record<string, { [key: string]: number | string }> = {
  midSem: {
    language: 8,
    length: 7,
    mixOfQuestions: 9,
    coverLearning: 6,
    solution: 10,
    remarks: "Needs improvement in question clarity.",
  },
  compre: {
    language: 9,
    length: 8,
    mixOfQuestions: 7,
    coverLearning: 9,
    solution: 8,
    remarks: "Good mix of conceptual and numerical problems.",
  },
  midSemSols: {
    language: 8,
    length: 7,
    mixOfQuestions: 9,
    coverLearning: 6,
    solution: 10,
    remarks: "Needs improvement in question clarity.",
  },
  compreSols: {
    language: 9,
    length: 8,
    mixOfQuestions: 7,
    coverLearning: 9,
    solution: 8,
    remarks: "Good mix of conceptual and numerical problems.",
  },
};

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

function formatSectionName(section: string): string {
  return section
    .replace(/([A-Z])/g, " $1")
    .trim()
    .replace(/\b[a-z]/g, (char) => char.toUpperCase())
    .replace("Sols", " Solutions")
    .replace("Mid Sem", "Midsem")
    .replace("Compre", "Compre");
}

export default function EvaluationTable() {
  const [remarksModalOpen, setRemarksModalOpen] = useState(false);
  const [currentRemark, setCurrentRemark] = useState("");

  const openRemarksModal = (remark: string) => {
    setCurrentRemark(remark);
    setRemarksModalOpen(true);
  };

  return (
    <>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px] font-medium">
                Evaluation Component
              </TableHead>
              {FIELDS.map((field) => (
                <TableHead key={field.key} className="text-center font-medium">
                  {field.label}
                </TableHead>
              ))}
              <TableHead className="text-center font-medium">Remarks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(evaluationData).map(([section, data]) => (
              <TableRow key={section}>
                <TableCell className="font-medium">
                  {section === "others"
                    ? "Others (if any)"
                    : formatSectionName(section)}
                </TableCell>
                {FIELDS.map((field) => (
                  <TableCell key={field.key} className="text-center">
                    {typeof data[field.key] === "number"
                      ? data[field.key]
                      : "-"}
                  </TableCell>
                ))}
                <TableCell className="text-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openRemarksModal(data.remarks as string)}
                  >
                    Open
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Dialog open={remarksModalOpen} onOpenChange={setRemarksModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Remarks</DialogTitle>
            </DialogHeader>
            <p className="text-gray-700">
              {currentRemark || "No remarks available."}
            </p>
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setRemarksModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
