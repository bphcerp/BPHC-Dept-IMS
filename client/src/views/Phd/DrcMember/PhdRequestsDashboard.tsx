// client/src/views/Phd/DrcMember/PhdRequestsDashboard.tsx
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
import { LoadingSpinner } from "@/components/ui/spinner";
import { FileCheck2 } from "lucide-react";

// Assuming a similar interface to the DRC Convener dashboard
interface RequestItem {
  id: number;
  requestType: string;
  updatedAt: string;
  student: { name: string | null; email: string };
  supervisor: { name: string | null; email: string };
}

const DrcMemberPhdRequestsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data: requests = [], isLoading } = useQuery<RequestItem[]>({
    queryKey: ["drc-member-requests"],
    queryFn: async () => {
      const res = await api.get("/phd/request/drc-member/requests");
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Assigned PhD Requests</h1>
        <p className="mt-2 text-gray-600">
          Review requests assigned to you by the DRC Convener.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Your Assigned Reviews</CardTitle>
          <CardDescription>
            These requests are awaiting your approval or comments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Request Type</TableHead>
                <TableHead>Supervisor</TableHead>
                <TableHead>Assigned On</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <LoadingSpinner />
                  </TableCell>
                </TableRow>
              ) : requests.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-32 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <FileCheck2 className="h-8 w-8" />
                      <span>You have no assigned requests at this time.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((req) => (
                  <TableRow
                    key={req.id}
                    onClick={() =>
                      navigate(`/phd/drc-member/requests/${req.id}`)
                    }
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

export default DrcMemberPhdRequestsDashboard;
