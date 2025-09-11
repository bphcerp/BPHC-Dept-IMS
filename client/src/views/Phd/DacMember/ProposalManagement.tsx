import React, { useState } from "react";
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
import { FileText, Eye, AlertTriangle } from "lucide-react";
import ProposalSemesterSelector from "@/components/phd/proposal/ProposalSemesterSelector";

interface Proposal {
  id: number;
  title: string;
  status: string;
  updatedAt: string;
  student: {
    name: string;
    email: string;
  };
}

const DacProposalManagement: React.FC = () => {
  const navigate = useNavigate();
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | null>(
    null
  );

  const {
    data: proposals = [],
    isLoading,
    isError,
    error,
  } = useQuery<Proposal[]>({
    queryKey: ["dac-proposals", selectedSemesterId],
    queryFn: async () => {
      const response = await api.get(
        `/phd/proposal/dacMember/getProposals/${selectedSemesterId}`
      );
      return response.data;
    },
    enabled: !!selectedSemesterId,
  });

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
            Please select a semester to view proposals awaiting your review.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProposalSemesterSelector
            selectedSemesterId={selectedSemesterId}
            onSemesterChange={setSelectedSemesterId}
          />
        </CardContent>
      </Card>

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
                    {(error as any)?.response?.data?.message ||
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
