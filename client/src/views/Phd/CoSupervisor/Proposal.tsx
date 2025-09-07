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
import { useNavigate } from "react-router-dom";
import { FileText, Eye } from "lucide-react";

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

const CoSupervisorProposal: React.FC = () => {
  const navigate = useNavigate();

  const {
    data: proposals,
    isLoading,
    error,
    isError,
  } = useQuery({
    queryKey: ["coSupervisor-proposals"],
    queryFn: async () => {
      const response = await api.get<Proposal[]>(
        "/phd/proposal/coSupervisor/getProposals"
      );
      return response.data;
    },
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner className="h-10 w-10" />
          <p className="ml-4 text-gray-500">Loading proposals...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen w-full bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardContent className="p-12">
              <div className="text-center">
                <div className="mb-4 text-red-500">
                  <svg
                    className="mx-auto h-12 w-12"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-medium text-gray-900">
                  Error Loading Proposals
                </h3>
                <p className="text-gray-500">
                  {(error as { response: { data: string } })?.response?.data ??
                    "Unknown error"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold">PhD Proposals</h1>
          <p className="mt-2 text-gray-600">
            Review PhD proposal submissions as co-supervisor
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              Pending Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            {proposals.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-medium text-gray-700">
                      Title
                    </TableHead>
                    <TableHead className="font-medium text-gray-700">
                      Status
                    </TableHead>
                    <TableHead className="font-medium text-gray-700">
                      Last Updated
                    </TableHead>
                    <TableHead className="font-medium text-gray-700">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proposals.map((proposal) => (
                    <TableRow key={proposal.id} className="hover:bg-gray-50">
                      <TableCell className="text-gray-900">
                        {proposal.title}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            proposal.status === "cosupervisor_review"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {proposal.status.replace("_", " ").toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-900">
                        {new Date(proposal.updatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            navigate(
                              `/phd/coSupervisor/proposal/${proposal.id}`
                            )
                          }
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-8 text-center">
                <FileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <h3 className="mb-2 text-lg font-medium text-gray-900">
                  No Pending Proposals
                </h3>
                <p className="text-gray-500">
                  There are no proposals awaiting your review as co-supervisor.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CoSupervisorProposal;
