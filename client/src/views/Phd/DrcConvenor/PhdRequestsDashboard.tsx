// client/src/views/Phd/DrcConvenor/PhdRequestsDashboard.tsx

import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { FileSpreadsheet, Download } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface RequestItem {
  id: number;
  requestType: string;
  status: string;
  updatedAt: string;
  student: { name: string | null; email: string };
  supervisor: { name: string | null; email: string };
}

const DrcConvenerPhdRequestsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("pending");
  const { data: requests = [], isLoading } = useQuery<RequestItem[]>({
    queryKey: ["drc-convener-requests", filter],
    queryFn: async () => {
      const res = await api.get(
        `/phd-request/drc-convener/requests?filter=${filter}`
      );
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">PhD Requests Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Review and process incoming PhD requests.
        </p>
      </div>
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">Pending Reviews</TabsTrigger>
          <TabsTrigger value="all">All Requests</TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
          <RequestsTable
            requests={requests}
            isLoading={isLoading}
            navigate={navigate}
            description="Requests currently awaiting your action."
          />
        </TabsContent>
        <TabsContent value="all">
          <RequestsTable
            requests={requests}
            isLoading={isLoading}
            navigate={navigate}
            description="A complete history of all requests you have reviewed."
            showDownload
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
  showDownload?: boolean;
}

const RequestsTable: React.FC<RequestsTableProps> = ({
  requests,
  isLoading,
  navigate,
  description,
  showDownload = false,
}) => {
  const [selectedRequests, setSelectedRequests] = useState<number[]>([]);

  const downloadMutation = useMutation({
    mutationFn: async (requestIds: number[]) => {
      const response = await api.post(
        "/phd-request/download-packages",
        { requestIds },
        { responseType: "blob" }
      );
      return response.data as Blob;
    },
    onSuccess: (blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `phd-request-packages-${
        new Date().toISOString().split("T")[0]
      }.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Packages downloaded successfully.");
      setSelectedRequests([]);
    },
    onError: () => {
      toast.error("Failed to download packages.");
    },
  });

  const completedRequests = requests.filter(
    (req) => req.status === "completed"
  );

  const handleSelect = (id: number, checked: boolean) => {
    setSelectedRequests((prev) =>
      checked ? [...prev, id] : prev.filter((reqId) => reqId !== id)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRequests(completedRequests.map((req) => req.id));
    } else {
      setSelectedRequests([]);
    }
  };

  const selectedCompletedCount = selectedRequests.filter((id) =>
    completedRequests.some((r) => r.id === id)
  ).length;

  return (
    <Card className="mt-4">
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>PhD Requests</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {showDownload && (
          <Button
            onClick={() => downloadMutation.mutate(selectedRequests)}
            disabled={
              selectedCompletedCount === 0 || downloadMutation.isLoading
            }
          >
            {downloadMutation.isLoading ? (
              <LoadingSpinner className="mr-2 h-4 w-4" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Download Packages ({selectedCompletedCount})
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {showDownload && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      completedRequests.length > 0 &&
                      selectedRequests.length === completedRequests.length
                    }
                    onCheckedChange={(checked) =>
                      handleSelectAll(checked as boolean)
                    }
                    disabled={completedRequests.length === 0}
                  />
                </TableHead>
              )}
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
                    <FileSpreadsheet className="h-8 w-8" />
                    <span>No requests found for this filter.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              requests.map((req) => (
                <TableRow key={req.id} className="hover:bg-muted/50">
                  {showDownload && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedRequests.includes(req.id)}
                        onCheckedChange={(checked) =>
                          handleSelect(req.id, checked as boolean)
                        }
                        disabled={req.status !== "completed"}
                      />
                    </TableCell>
                  )}
                  <TableCell
                    className="cursor-pointer font-medium"
                    onClick={() => navigate(`/phd/requests/${req.id}`)}
                  >
                    {req.student.name || req.student.email}
                  </TableCell>
                  <TableCell
                    className="cursor-pointer"
                    onClick={() => navigate(`/phd/requests/${req.id}`)}
                  >
                    {req.requestType
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </TableCell>
                  <TableCell
                    className="cursor-pointer"
                    onClick={() => navigate(`/phd/requests/${req.id}`)}
                  >
                    {req.supervisor.name || req.supervisor.email}
                  </TableCell>
                  <TableCell
                    className="cursor-pointer"
                    onClick={() => navigate(`/phd/requests/${req.id}`)}
                  >
                    {new Date(req.updatedAt).toLocaleString()}
                  </TableCell>
                  <TableCell
                    className="cursor-pointer"
                    onClick={() => navigate(`/phd/requests/${req.id}`)}
                  >
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
};

export default DrcConvenerPhdRequestsDashboard;
