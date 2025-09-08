import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { LoadingSpinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { FileText, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import DacProposalDetailView from "@/components/phd/DacMember/DacProposalDetailView";

interface Proposal {
  id: number;
  title: string;
  status: string;
  updatedAt: string;
  student: { name: string; email: string };
}

const DacProposalManagement: React.FC = () => {
  const [selectedProposalId, setSelectedProposalId] = useState<number | null>(
    null
  );

  const { data: proposals = [], isLoading } = useQuery({
    queryKey: ["dac-proposals"],
    queryFn: async () => {
      const response = await api.get<Proposal[]>(
        "/phd/proposal/dacMember/getProposals"
      );
      return response.data;
    },
    refetchOnWindowFocus: false,
  });

  return (
    <div className="min-h-screen w-full bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold">PhD Proposal Evaluation</h1>
          <p className="mt-2 text-gray-600">
            Review PhD proposals assigned to you as a DAC member.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Awaiting Your Review</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex h-40 items-center justify-center">
                  <LoadingSpinner />
                </div>
              ) : proposals.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {proposals.map((proposal) => (
                      <TableRow
                        key={proposal.id}
                        className={cn(
                          "cursor-pointer",
                          selectedProposalId === proposal.id && "bg-muted/50"
                        )}
                        onClick={() => setSelectedProposalId(proposal.id)}
                      >
                        <TableCell>
                          <div className="font-medium">
                            {proposal.student.name ?? proposal.student.email}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {proposal.title}
                          </div>
                        </TableCell>
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
          <div className="lg:col-span-2">
            {selectedProposalId ? (
              <DacProposalDetailView
                proposalId={selectedProposalId}
                clearSelection={() => setSelectedProposalId(null)}
              />
            ) : (
              <Card className="flex h-full items-center justify-center">
                <div className="p-8 text-center">
                  <FileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <h3 className="mb-2 text-lg font-medium">
                    Select a Proposal
                  </h3>
                  <p className="text-gray-500">
                    Choose a proposal from the list to view its details and take
                    action.
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DacProposalManagement;
