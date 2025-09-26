// client/src/views/Phd/Supervisor/MyStudents.tsx
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { phdRequestSchemas } from "lib";
import { SupervisorRequestForm } from "@/components/phd/phd-request/SupervisorRequestForm";
import { UserPlus } from "lucide-react";

// This interface would be defined based on a new or modified backend endpoint
interface StudentStatus {
  email: string;
  name: string | null;
  idNumber: string | null;
  currentStatus: string; // e.g., "Proposal - DAC Review", "Request - Pre-submission Approved"
  canInitiateRequest: boolean;
}

const MyStudents: React.FC = () => {
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentStatus | null>(
    null
  );
  const [selectedRequestType, setSelectedRequestType] = useState<string>("");

  const { data: students = [], isLoading } = useQuery<StudentStatus[]>({
    queryKey: ["supervisor-my-students"],
    queryFn: async () => {
      // NOTE: This endpoint would need to be created on the backend to aggregate student statuses
      // For now, we'll assume it exists and returns the StudentStatus[] payload.
      const res = await api.get("/phd/request/supervisor/my-students-status");
      return res.data;
    },
  });

  const handleOpenDialog = (student: StudentStatus) => {
    if (student.canInitiateRequest) {
      setSelectedStudent(student);
      setIsRequestDialogOpen(true);
    } else {
      toast.info(
        "This student already has an active request or is not eligible for a new one."
      );
    }
  };

  const handleCloseDialog = () => {
    setIsRequestDialogOpen(false);
    setSelectedStudent(null);
    setSelectedRequestType("");
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">My Students</h1>
        <p className="mt-2 text-gray-600">
          View the status of your PhD students and initiate new requests.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Student Dashboard</CardTitle>
          <CardDescription>
            A summary of your students' progress.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>ID Number</TableHead>
                <TableHead>Current Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <LoadingSpinner />
                  </TableCell>
                </TableRow>
              ) : students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No students found.
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student) => (
                  <TableRow key={student.email}>
                    <TableCell className="font-medium">
                      {student.name || student.email}
                    </TableCell>
                    <TableCell>{student.idNumber || "N/A"}</TableCell>
                    <TableCell>{student.currentStatus}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog(student)}
                        disabled={!student.canInitiateRequest}
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Initiate Request
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Initiate New Request for {selectedStudent?.name}
            </DialogTitle>
            <DialogDescription>
              Select the type of request you want to start.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="request-type">Request Type</Label>
            <Select
              onValueChange={setSelectedRequestType}
              value={selectedRequestType}
            >
              <SelectTrigger id="request-type">
                <SelectValue placeholder="Select a request type..." />
              </SelectTrigger>
              <SelectContent>
                {phdRequestSchemas.phdRequestTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedRequestType && selectedStudent && (
            <SupervisorRequestForm
              studentEmail={selectedStudent.email}
              requestType={
                selectedRequestType as (typeof phdRequestSchemas.phdRequestTypes)[number]
              }
              onSuccess={handleCloseDialog}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyStudents;
