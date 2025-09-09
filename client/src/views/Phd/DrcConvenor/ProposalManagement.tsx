import React from "react";
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
import { useNavigate } from "react-router-dom";

interface ProposalListItem {
  id: number;
  title: string;
  status: string;
  updatedAt: string;
  student: {
    name: string | null;
    email: string;
  };
}

const DrcProposalManagement: React.FC = () => {
  const navigate = useNavigate();
  const { data: proposals, isLoading: listIsLoading } = useQuery({
    queryKey: ["drc-proposals"],
    queryFn: async () => {
      const response = await api.get<ProposalListItem[]>(
        "/phd/proposal/drcConvener/getProposals"
      );
      return response.data;
    },
    refetchOnWindowFocus: false,
  });

  return (
    <div className="min-h-screen w-full bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold">PhD Proposal Management</h1>
          <p className="mt-2 text-gray-600">
            Review proposals approved by co-supervisors and forward them to DAC
            members.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Awaiting Review</CardTitle>
          </CardHeader>
          <CardContent>
            {listIsLoading ? (
              <div className="flex justify-center items-center h-40">
                <LoadingSpinner />
              </div>
            ) : proposals && proposals.length > 0 ? (
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
                  {proposals.map((proposal) => (
                    <TableRow
                      key={proposal.id}
                      className="cursor-pointer"
                      onClick={() =>
                        navigate(
                          `/phd/drc-convenor/proposal-management/${proposal.id}`
                        )
                      }
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
                  No proposals are awaiting your review.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
export default DrcProposalManagement;