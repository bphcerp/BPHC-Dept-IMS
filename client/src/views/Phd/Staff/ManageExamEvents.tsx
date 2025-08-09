import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreateExamEventDialog } from "@/components/phd/CreateExamEventDialog";
import api from "@/lib/axios-instance";
import { toast } from "sonner";
import { format } from "date-fns";
import { LoadingSpinner } from "@/components/ui/spinner";

interface Semester {
  id: number;
  academicYear: string;
  semesterNumber: number;
}

interface ExamEvent {
  id: number;
  type: "QualifyingExam" | "ThesisProposal";
  name: string;
  registrationDeadline: string;
  examStartDate?: string;
  examEndDate?: string;
  vivaDate?: string;
  isActive: boolean;
}

const ManageExamEvents: React.FC = () => {
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | null>(
    null,
  );
  const queryClient = useQueryClient();

  const { data: semestersData, isLoading: isLoadingSemesters } = useQuery({
    queryKey: ["phd-semesters"],
    queryFn: async () => {
      const response = await api.get<{
        success: boolean;
        semesters: Semester[];
      }>("/phd/staff/semesters");
      return response.data;
    },
  });

  const { data: examEvents, isLoading: isLoadingEvents } = useQuery<ExamEvent[]>({
    queryKey: ["phd-exam-events", selectedSemesterId],
    queryFn: async () => {
      if (!selectedSemesterId) return [];
      const response = await api.get(
        `/phd/staff/exam-events/semester/${selectedSemesterId}`,
      );
      return response.data.examEvents;
    },
    enabled: !!selectedSemesterId,
  });

  const deactivateMutation = useMutation({
    mutationFn: async (eventId: number) => {
      await api.delete(`/phd/staff/exam-events/${eventId}`);
    },
    onSuccess: () => {
      toast.success("Exam event deactivated successfully");
      queryClient.invalidateQueries({
        queryKey: ["phd-exam-events", selectedSemesterId],
      });
    },
    onError: () => {
      toast.error("Failed to deactivate exam event");
    },
  });

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "Not set";
    return format(new Date(dateString), "PPP 'at' pp");
  };

  const semesters = semestersData?.semesters;

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Manage Exam Events</h1>
        <CreateExamEventDialog
          selectedSemesterId={selectedSemesterId}
          onSuccess={() =>
            queryClient.invalidateQueries({
              queryKey: ["phd-exam-events", selectedSemesterId],
            })
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Semester</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingSemesters ? (
            <LoadingSpinner />
          ) : (
            <Select
              value={selectedSemesterId?.toString() || ""}
              onValueChange={(value) => setSelectedSemesterId(parseInt(value))}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select a semester" />
              </SelectTrigger>
              <SelectContent>
                {semesters?.map((semester) => (
                  <SelectItem key={semester.id} value={semester.id.toString()}>
                    {semester.academicYear} - Semester {semester.semesterNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {selectedSemesterId && (
        <Card>
          <CardHeader>
            <CardTitle>Exam Events</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingEvents ? (
              <div className="py-8 text-center">
                <LoadingSpinner />
              </div>
            ) : examEvents?.length === 0 ? (
              <div className="py-8 text-center">
                No exam events found for this semester
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Registration Deadline</TableHead>
                    <TableHead>Exam Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {examEvents?.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">{event.name}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            event.type === "QualifyingExam"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {event.type === "QualifyingExam"
                            ? "Qualifying Exam"
                            : "Thesis Proposal"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDateTime(event.registrationDeadline)}
                      </TableCell>
                      <TableCell>
                        {formatDateTime(event.examStartDate)} to{" "}
                        {formatDateTime(event.examEndDate)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={event.isActive ? "default" : "destructive"}
                        >
                          {event.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {event.isActive && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deactivateMutation.mutate(event.id)}
                              disabled={deactivateMutation.isLoading}
                            >
                              Deactivate
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ManageExamEvents;