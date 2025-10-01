import React from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/spinner";
import { FolderArchive } from "lucide-react";

interface RequestItem {
  id: number;
  requestType: string;
  status: string;
  updatedAt: string;
  student: { name: string | null; email: string };
  supervisor: { name: string | null; email: string };
}

const PhdRequestsArchive: React.FC = () => {
  const navigate = useNavigate();
  const { data: requests = [], isLoading } = useQuery<RequestItem[]>({
    queryKey: ["staff-all-phd-requests"],
    queryFn: async () => {
      const res = await api.get("/phd-request/staff/getAllRequests");
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">PhD Requests Archive</h1>
        <p className="mt-2 text-gray-600">
          A read-only view of all past and current PhD requests.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Requests</CardTitle>
          <CardDescription>
            Click on any request to view its detailed history and all associated
            documents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Request Type</TableHead>
                <TableHead>Supervisor</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <LoadingSpinner />
                  </TableCell>
                </TableRow>
              ) : requests.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-32 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <FolderArchive className="h-8 w-8" />
                      <span>No requests found in the system.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((req) => (
                  <TableRow
                    key={req.id}
                    onClick={() => navigate(`/phd/requests/${req.id}`)}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell className="font-medium">
                      {req.student.name || req.student.email}
                    </TableCell>
                    <TableCell>
                      {req.requestType
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </TableCell>
                    <TableCell>
                      {req.supervisor.name || req.supervisor.email}
                    </TableCell>
                    <TableCell>
                      {new Date(req.updatedAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {req.status.replace(/_/g, " ").toUpperCase()}
                      </Badge>
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

export default PhdRequestsArchive;
