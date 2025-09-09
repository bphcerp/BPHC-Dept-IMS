import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { LoadingSpinner } from "@/components/ui/spinner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import { useNavigate } from "react-router-dom";
import { FileText, Eye } from "lucide-react";

interface Proposal {
  id: number;
  title: string;
  status: string;
  updatedAt: string;
  student: { name: string; email: string };
}

const DacProposalManagement: React.FC = () => {
  const navigate = useNavigate();
  const { data: proposals, isLoading, error } = useQuery<Proposal[]>({
    queryKey: ["dac-proposals"],
    queryFn: async () => {
      const response = await api.get("/phd/proposal/dacMember/getProposals");
      return response.data;
    },
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500">Error loading proposals for review.</div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">PhD Proposal Evaluation</h1>
        <p className="mt-2 text-gray-600">
          Review PhD proposals assigned to you as a DAC member.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Proposals Awaiting Your Review
          </CardTitle>
        </CardHeader>
        <CardContent>
          {proposals && proposals.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proposals.map((proposal) => (
                  <TableRow
                    key={proposal.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/phd/dac/proposals/${proposal.id}`)}
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
                    <TableCell>
                      {new Date(proposal.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm">
                        <Eye className="mr-2 h-4 w-4" /> Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8 text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <h3 className="mb-2 text-lg font-medium">
                No Pending Proposals
              </h3>
              <p className="text-gray-500">
                There are no proposals awaiting your review.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DacProposalManagement;