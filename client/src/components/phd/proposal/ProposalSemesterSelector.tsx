// client/src/components/phd/proposal/ProposalSemesterSelector.tsx
import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

interface Semester {
  id: number;
  semesterId: number;
  studentSubmissionDate: string;
  semester: {
    year: string;
    semesterNumber: number;
  };
}

interface ProposalSemesterSelectorProps {
  selectedSemesterId: number | null;
  onSemesterChange: (id: number | null) => void;
  className?: string;
}

const ProposalSemesterSelector: React.FC<ProposalSemesterSelectorProps> = ({
  selectedSemesterId,
  onSemesterChange,
  className,
}) => {
  const { data: semesters, isLoading } = useQuery<Semester[]>({
    queryKey: ["proposal-semesters"],
    queryFn: async () => {
      const response = await api.get("/phd/proposal/getProposalSemesters");
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const getCycleLabel = (semester: Semester) => {
    const deadline = new Date(
      semester.studentSubmissionDate
    ).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${semester.semester.year} - Sem ${semester.semester.semesterNumber} (Deadline: ${deadline})`;
  };

  if (isLoading) {
    return (
      <div className={className}>
        <Label>Proposal Deadline Cycle</Label>
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className={className}>
      <Label htmlFor="proposal-semester-select">Proposal Deadline Cycle</Label>
      <Select
        value={selectedSemesterId?.toString() ?? ""}
        onValueChange={(value) =>
          onSemesterChange(value ? parseInt(value) : null)
        }
      >
        <SelectTrigger id="proposal-semester-select">
          <SelectValue placeholder="Select a cycle..." />
        </SelectTrigger>
        <SelectContent>
          {semesters && semesters.length > 0 ? (
            semesters.map((sem) => (
              <SelectItem key={sem.id} value={sem.id.toString()}>
                {getCycleLabel(sem)}
              </SelectItem>
            ))
          ) : (
            <SelectItem value="none" disabled>
              No proposal deadlines configured.
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ProposalSemesterSelector;
