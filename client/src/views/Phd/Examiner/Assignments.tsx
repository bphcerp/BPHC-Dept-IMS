import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, FileText } from "lucide-react";
import { isAxiosError } from "axios";
import { phdSchemas } from "lib";

type ExaminerAssignment = phdSchemas.ExaminerAssignmentsResponse[number];

const ExaminerAssignments: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["examiner-assignments"],
    queryFn: async () => {
      const response = await api.get<ExaminerAssignment[]>(
        "/phd/examiner/assignments"
      );
      return response.data;
    },
  });

  const acceptMutation = useMutation({
    mutationFn: (id: number) =>
      api.post(`/phd/examiner/acceptAssignment/${id}`),
    onSuccess: () => {
      toast.success("Assignment accepted successfully.");
      void queryClient.invalidateQueries({
        queryKey: ["examiner-assignments"],
      });
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        toast.error(`Failed to accept assignment: ${error.response?.data}`);
      } else {
        toast.error("Failed to accept assignment.");
      }
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) =>
      api.post(`/phd/examiner/rejectAssignment/${id}`),
    onSuccess: () => {
      toast.success("Assignment rejected successfully.");
      void queryClient.invalidateQueries({
        queryKey: ["examiner-assignments"],
      });
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        toast.error(`Failed to reject assignment: ${error.response?.data}`);
      } else {
        toast.error("Failed to reject assignment.");
      }
    },
  });

  const handleAccept = (id: number) => {
    acceptMutation.mutate(id);
  };

  const handleReject = (id: number) => {
    rejectMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Examiner Assignments</h1>
          <p className="mt-2 text-gray-600">
            Review and respond to your qualifying exam assignments.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Your Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Qualifying Area</TableHead>
                  <TableHead>Syllabus</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.length > 0 ? (
                  assignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <div className="font-medium">
                          {assignment.student.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {assignment.student.email}
                        </div>
                        {assignment.student.idNumber && (
                          <div className="text-sm text-muted-foreground">
                            ID: {assignment.student.idNumber}
                          </div>
                        )}
                        {assignment.student.phone && (
                          <div className="text-sm text-muted-foreground">
                            Phone: {assignment.student.phone}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{assignment.qualifyingArea}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={assignment.syllabusFile}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            View Syllabus
                          </a>
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            assignment.hasAccepted === null
                              ? "secondary"
                              : assignment.hasAccepted
                                ? "default"
                                : "destructive"
                          }
                          className={
                            assignment.hasAccepted === null
                              ? "bg-yellow-100 text-yellow-800"
                              : assignment.hasAccepted
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                          }
                        >
                          {assignment.hasAccepted === null
                            ? "Pending"
                            : assignment.hasAccepted
                              ? "Accepted"
                              : "Rejected"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {assignment.hasAccepted === null && (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleAccept(assignment.id)}
                              disabled={
                                acceptMutation.isLoading ||
                                rejectMutation.isLoading
                              }
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(assignment.id)}
                              disabled={
                                acceptMutation.isLoading ||
                                rejectMutation.isLoading
                              }
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No assignments found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExaminerAssignments;
