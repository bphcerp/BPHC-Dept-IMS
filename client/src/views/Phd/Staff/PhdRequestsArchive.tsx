// client/src/views/Phd/Staff/PhdRequestsArchive.tsx

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
import { Download, FolderArchive } from "lucide-react";
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

const PhdRequestsArchive: React.FC = () => {
  const navigate = useNavigate();
  const [selectedRequests, setSelectedRequests] = useState<number[]>([]);
  const { data: requests = [], isLoading } = useQuery<RequestItem[]>({
    queryKey: ["staff-all-phd-requests"],
    queryFn: async () => {
      const res = await api.get("/phd-request/staff/getAllRequests");
      return res.data;
    },
  });

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
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">PhD Requests Archive</h1>
        <p className="mt-2 text-gray-600">
          A read-only view of all past and current PhD requests.
        </p>
      </div>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>All Requests</CardTitle>
            <CardDescription>
              Click on any request to view its detailed history and all
              associated documents.
            </CardDescription>
          </div>
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
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
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
                  <TableCell colSpan={6} className="h-24 text-center">
                    <LoadingSpinner />
                  </TableCell>
                </TableRow>
              ) : requests.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
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
                  <TableRow key={req.id} className="hover:bg-muted/50">
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedRequests.includes(req.id)}
                        onCheckedChange={(checked) =>
                          handleSelect(req.id, checked as boolean)
                        }
                        disabled={req.status !== "completed"}
                      />
                    </TableCell>
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
    </div>
  );
};

export default PhdRequestsArchive;
