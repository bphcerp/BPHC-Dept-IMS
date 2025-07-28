import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChangeEvent } from "react";

export interface WilpProject {
  id: number;
  studentId: string;
  discipline: string;
  studentName: string;
  organization: string;
  degreeProgram: string;
  researchArea: string;
  dissertationTitle: string;
  reminder: string | Date;
  deadline: string | Date;
}

interface WilpTableProps {
  projects: WilpProject[];
  loading: boolean;
  error: string | null;
  selected?: number[];
  onSelect?: (id: number, checked: boolean) => void;
  onRowClick?: (project: WilpProject) => void;
}

export default function WilpTable({ projects, loading, error, selected = [], onSelect, onRowClick }: WilpTableProps) {
  if (loading) return <div className="flex-1 flex items-center justify-center">Loading...</div>;
  if (error) return <div className="flex-1 flex items-center justify-center text-red-500">{error}</div>;

  const handleCheckbox = (id: number) => (e: ChangeEvent<HTMLInputElement>) => {
    if (onSelect) onSelect(id, e.target.checked);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>S. No.</TableHead>
          <TableHead>Student ID</TableHead>
          <TableHead>Student Name</TableHead>
          <TableHead>Organization</TableHead>
          <TableHead>Dissertation Title</TableHead>
          <TableHead>Select</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center">No projects found.</TableCell>
          </TableRow>
        ) : (
          projects.map((project, idx) => (
            <TableRow key={project.id}>
              <TableCell
                onClick={onRowClick ? () => onRowClick(project) : undefined}
                className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
              >{idx + 1}</TableCell>
              <TableCell
                onClick={onRowClick ? () => onRowClick(project) : undefined}
                className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
              >{project.studentId}</TableCell>
              <TableCell
                onClick={onRowClick ? () => onRowClick(project) : undefined}
                className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
              >{project.studentName}</TableCell>
              <TableCell
                onClick={onRowClick ? () => onRowClick(project) : undefined}
                className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
              >{project.organization}</TableCell>
              <TableCell
                onClick={onRowClick ? () => onRowClick(project) : undefined}
                className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
              >{project.dissertationTitle}</TableCell>
              <TableCell>
                <input
                  type="checkbox"
                  checked={selected.includes(project.id)}
                  onChange={handleCheckbox(project.id)}
                  onClick={e => e.stopPropagation()}
                />
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
} 