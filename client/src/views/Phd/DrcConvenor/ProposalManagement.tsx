import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileText, Eye, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProposalSemesterSelector from "@/components/phd/proposal/ProposalSemesterSelector";
import { cn } from "@/lib/utils";

interface ProposalSemester {
  id: number;
  semesterId: number;
  studentSubmissionDate: string;
  facultyReviewDate: string;
  drcReviewDate: string;
  dacReviewDate: string;
}

interface ProposalListItem {
  id: number;
  title: string;
  status: string;
  updatedAt: string;
  student: {
    name: string | null;
    email: string;
  };
  proposalSemester: ProposalSemester | null;
}

const DeadlinesCard = ({
  deadlines,
  highlight,
}: {
  deadlines: ProposalSemester;
  highlight: keyof ProposalSemester;
}) => {
  const deadlineLabels: Record<
    keyof Omit<ProposalSemester, "id" | "semesterId">,
    string
  > = {
    studentSubmissionDate: "Student Submission",
    facultyReviewDate: "Supervisor Review",
    drcReviewDate: "DRC Review",
    dacReviewDate: "DAC Review",
  };

  return (
    <Card className="mb-6 bg-muted/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4" />
          Semester Deadlines
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
        {Object.entries(deadlineLabels).map(([key, label]) => (
          <div
            key={key}
            className={cn(
              "rounded-lg border p-3",
              highlight === key
                ? "border-primary bg-primary/10"
                : "bg-background"
            )}
          >
            <p className="font-semibold text-muted-foreground">{label}</p>
            <p className="mt-1">
              {new Date(
                deadlines[key as keyof ProposalSemester] as string
              ).toLocaleDateString()}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

const DrcProposalManagement: React.FC = () => {
  const navigate = useNavigate();
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | null>(
    null
  );
  const {
    data: proposals,
    isLoading,
    isError,
    error,
  } = useQuery<ProposalListItem[]>({
    queryKey: ["drc-proposals", selectedSemesterId],
    queryFn: async () => {
      const response = await api.get(
        `/phd/proposal/drcConvener/getProposals/${selectedSemesterId}`
      );
      return response.data;
    },
    enabled: !!selectedSemesterId,
  });

  const semesterDeadlines = proposals?.[0]?.proposalSemester;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">PhD Proposal Management</h1>
        <p className="mt-2 text-gray-600">
          Monitor and manage all PhD proposals for the selected semester.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Semester Selection</CardTitle>
          <CardDescription>
            Please select a semester to view its proposals.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProposalSemesterSelector
            selectedSemesterId={selectedSemesterId}
            onSemesterChange={setSelectedSemesterId}
          />
        </CardContent>
      </Card>

      {semesterDeadlines && (
        <DeadlinesCard
          deadlines={semesterDeadlines}
          highlight="drcReviewDate"
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Student Proposals</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isError ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-red-600"
                  >
                    Error:{" "}
                    {(error as any)?.response?.data?.message ||
                      "Failed to load proposals"}
                  </TableCell>
                </TableRow>
              ) : isLoading || !proposals || proposals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <div className="py-8 text-center">
                      <FileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                      <h3 className="mb-2 text-lg font-medium">
                        {selectedSemesterId
                          ? "No proposals found for this semester."
                          : "Please select a semester to view proposals."}
                      </h3>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                proposals.map((proposal) => (
                  <TableRow
                    key={proposal.id}
                    onClick={() =>
                      navigate(
                        `/phd/drc-convenor/proposal-management/${proposal.id}`
                      )
                    }
                    className="cursor-pointer"
                  >
                    <TableCell>
                      <div className="font-medium">{proposal.student.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {proposal.student.email}
                      </div>
                    </TableCell>
                    <TableCell>{proposal.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {proposal.status.replace(/_/g, " ").toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
export default DrcProposalManagement;
