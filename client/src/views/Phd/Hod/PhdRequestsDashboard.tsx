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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoadingSpinner } from "@/components/ui/spinner";
import { ClipboardCheck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface RequestItem {
  id: number;
  requestType: string;
  status: string;
  updatedAt: string;
  student: {
    name: string | null;
    email: string;
  };
  supervisor: {
    name: string | null;
    email: string;
  };
}

const HodPhdRequestsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("pending");

  const { data: requests = [], isLoading } = useQuery<RequestItem[]>({
    queryKey: ["hod-requests", filter],
    queryFn: async () => {
      const res = await api.get(`/phd-request/hod/requests?filter=${filter}`);
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">PhD Request Final Approval</h1>
        <p className="mt-2 text-gray-600">
          Provide the final approval for PhD requests.
        </p>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">Awaiting Final Approval</TabsTrigger>
          <TabsTrigger value="all">All Requests</TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
          <RequestsTable
            requests={requests}
            isLoading={isLoading}
            navigate={navigate}
            description="These requests have been approved by the DRC and require your final sign-off."
          />
        </TabsContent>
        <TabsContent value="all">
          <RequestsTable
            requests={requests}
            isLoading={isLoading}
            navigate={navigate}
            description="A complete history of all requests you have reviewed."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface RequestsTableProps {
  requests: RequestItem[];
  isLoading: boolean;
  navigate: (path: string) => void;
  description: string;
}

const RequestsTable: React.FC<RequestsTableProps> = ({
  requests,
  isLoading,
  navigate,
  description,
}) => (
  <Card className="mt-4">
    <CardHeader>
      <CardTitle>PhD Requests</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Request Type</TableHead>
            <TableHead>Supervisor</TableHead>
            <TableHead>Submitted for Approval</TableHead>
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
                  <ClipboardCheck className="h-8 w-8" />
                  <span>No requests found for this filter.</span>
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
);

export default HodPhdRequestsDashboard;
