import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";
import api from "@/lib/axios-instance";
import { toast } from "sonner";
import { format } from "date-fns";
import { LoadingSpinner } from "../ui/spinner";

interface Application {
  applicationId: number;
  studentName: string;
  studentEmail: string;
  attemptNumber: number;
  status: string;
  appliedAt: string;
  qualifyingArea1: string;
  qualifyingArea2: string;
  applicationFormUrl: string | null;
}

interface ExamEvent {
  id: number;
  name: string;
  type: string;
  registrationDeadline: string;
  isActive: boolean;
}

interface Semester {
  id: number;
  academicYear: string;
  semesterNumber: number;
}

interface NewApplicationsPanelProps {
  selectedExamEventId: number | null;
  onSelectExamEvent: (eventId: number) => void;
}

export const NewApplicationsPanel: React.FC<NewApplicationsPanelProps> = ({
  selectedExamEventId,
  onSelectExamEvent,
}) => {
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | null>(
    null,
  );
  const [downloadingZip, setDownloadingZip] = useState(false);

  const { data: semesters } = useQuery<Semester[]>({
    queryKey: ["phd-semesters"],
    queryFn: async () => {
      const response = await api.get("/phd/staff/semesters");
      return response.data.semesters;
    },
  });

  const { data: examEvents } = useQuery<ExamEvent[]>({
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

  const { data: applications, isLoading } = useQuery<Application[]>({
    queryKey: ["phd-exam-applications", selectedExamEventId],
    queryFn: async () => {
      if (!selectedExamEventId) return [];
      const response = await api.get(
        `/phd/drcMember/exam-events/applications/${selectedExamEventId}`,
      );
      return response.data.applications;
    },
    enabled: !!selectedExamEventId,
  });

  const handleDownloadZip = async () => {
    if (!selectedExamEventId) return;
    setDownloadingZip(true);
    try {
      const response = await api.get(
        `/phd/drcMember/exam-events/applications/zip/${selectedExamEventId}`,
        { responseType: "blob" },
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      const examEvent = examEvents?.find((e) => e.id === selectedExamEventId);
      const fileName = examEvent
        ? `${examEvent.name.replace(/\s+/g, "_")}_applications.zip`
        : `exam_applications_${selectedExamEventId}.zip`;
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      toast.success("Applications downloaded successfully");
    } catch (error) {
      toast.error("Failed to download applications");
    } finally {
      setDownloadingZip(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Select Semester</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedSemesterId?.toString() || ""}
              onValueChange={(value) => setSelectedSemesterId(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select semester" />
              </SelectTrigger>
              <SelectContent>
                {semesters?.map((semester) => (
                  <SelectItem key={semester.id} value={semester.id.toString()}>
                    {semester.academicYear} - Semester {semester.semesterNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Select Exam Event</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedExamEventId?.toString() || ""}
              onValueChange={(value) => onSelectExamEvent(parseInt(value))}
              disabled={!selectedSemesterId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select exam event" />
              </SelectTrigger>
              <SelectContent>
                {examEvents?.map((event) => (
                  <SelectItem key={event.id} value={event.id.toString()}>
                    {event.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {selectedExamEventId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Applications</CardTitle>
              {applications && applications.length > 0 && (
                <Button onClick={handleDownloadZip} disabled={downloadingZip}>
                  <Download className="mr-2 h-4 w-4" />
                  {downloadingZip
                    ? "Downloading..."
                    : `Download All (${applications.length})`}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center">Loading applications...</div>
            ) : !applications || applications.length === 0 ? (
              <div className="py-8 text-center">No applications found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Attempt</TableHead>
                    <TableHead>Qualifying Areas</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied At</TableHead>
                    <TableHead>Form</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((application) => (
                    <TableRow key={application.applicationId}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {application.studentName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {application.studentEmail}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          Attempt {application.attemptNumber}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">
                            1. {application.qualifyingArea1}
                          </div>
                          <div className="text-sm">
                            2. {application.qualifyingArea2}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            application.status === "Applied"
                              ? "default"
                              : application.status === "Approved"
                                ? "default"
                                : "destructive"
                          }
                        >
                          {application.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(application.appliedAt), "PPP")}
                      </TableCell>
                      <TableCell>
                        {application.applicationFormUrl ? (
                          <Button variant="link" asChild>
                            <a
                              href={application.applicationFormUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View Form
                            </a>
                          </Button>
                        ) : (
                          "No form"
                        )}
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