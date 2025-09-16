import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
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
import ProposalSemesterSelector from "@/components/phd/proposal/ProposalSemesterSelector";

interface ProposalSemester {
  id: number;
  semesterId: number;
  studentSubmissionDate: string;
  facultyReviewDate: string;
  drcReviewDate: string;
  dacReviewDate: string;
  semester: {
    year: string;
    semesterNumber: number;
  };
}

interface Proposal {
  id: number;
  title: string;
  status: string;
  updatedAt: string;
  student: {
    name: string;
    email: string;
  };
  proposalSemester: ProposalSemester | null;
}

const DeadlinesCard = ({
  deadlines,
  highlight,
}: {
  deadlines: ProposalSemester;
  highlight: keyof Omit<ProposalSemester, "id" | "semesterId" | "semester">;
}) => {
  const deadlineLabels: Record<
    keyof Omit<ProposalSemester, "id" | "semesterId" | "semester">,
    string
  > = {
    studentSubmissionDate: "Student Submission",
    facultyReviewDate: "Supervisor Review",
    drcReviewDate: "DRC Review",
    dacReviewDate: "DAC Review",
  };

  const deadlineToShow = { [highlight]: deadlineLabels[highlight] };

  return (
    <Card className="mb-6 bg-muted/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4" /> Upcoming Deadline
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 text-sm md:grid-cols-4">
        {Object.entries(deadlineToShow).map(([key, label]) => (
          <div
            key={key}
            className="rounded-lg border border-primary bg-primary/10 p-3 shadow-md transition-all"
          >
            <p className="font-semibold text-muted-foreground">{label}</p>
            <p className="mt-1 font-medium">
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

const DacProposalManagement: React.FC = () => {
  const navigate = useNavigate();
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | null>(
    null
  );

  const { data: semesters } = useQuery({
    queryKey: ["proposal-semesters"],
    queryFn: async () => {
      const response = await api.get<ProposalSemester[]>(
        "/phd/proposal/getProposalSemesters"
      );
      return response.data;
    },
  });

  // Effect to auto-select the latest semester on initial load
  useEffect(() => {
    if (semesters && semesters.length > 0 && !selectedSemesterId) {
      setSelectedSemesterId(semesters[0].id);
    }
  }, [semesters, selectedSemesterId]);

  const {
    data: proposals = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["dac-proposals", selectedSemesterId],
    queryFn: async () => {
      const response = await api.get<Proposal[]>(
        `/phd/proposal/dacMember/getProposals/${selectedSemesterId}`
      );
      return response.data;
    },
    enabled: !!selectedSemesterId, // Only fetch proposals when a semester is selected
  });

  const semesterDeadlines = proposals?.[0]?.proposalSemester;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">PhD Proposal Evaluation</h1>
        <p className="mt-2 text-gray-600">
          Review PhD proposals assigned to you as a DAC member.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Semester Selection</CardTitle>
          <CardDescription>
            The latest semester is selected by default. You can choose a
            different one to view past proposals.
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
          highlight="dacReviewDate"
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Awaiting Your Review</CardTitle>
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
                    {(error as { response: { data: string } }).response?.data ||
                      "Failed to load proposals"}
                  </TableCell>
                </TableRow>
              ) : isLoading || proposals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <div className="py-8 text-center">
                      <FileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                      <h3 className="mb-2 text-lg font-medium">
                        {selectedSemesterId
                          ? "No proposals are awaiting your review for this semester."
                          : "Please select a semester."}
                      </h3>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                proposals.map((proposal) => (
                  <TableRow
                    key={proposal.id}
                    className="cursor-pointer"
                    onClick={() =>
                      navigate(`/phd/dac/proposals/${proposal.id}`)
                    }
                  >
                    <TableCell>
                      {proposal.student.name ?? proposal.student.email}
                    </TableCell>
                    <TableCell>{proposal.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {proposal.status.replace("_", " ").toUpperCase()}
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

export default DacProposalManagement;
