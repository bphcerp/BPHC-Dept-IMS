import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { UserPlus, MessageCircleWarning, Edit } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StudentStatus {
  email: string;
  name: string | null;
  idNumber: string | null;
  currentStatus: string;
  canInitiateRequest: boolean;
  canResubmitRequest: boolean;
  reversionComments: string | null;
  requestId: number | null;
}

const postProposalRequestOrder: (typeof phdRequestSchemas.phdRequestTypes)[number][] =
  [
    "pre_submission",
    "draft_notice",
    "thesis_submission",
    "final_thesis_submission",
  ];

const MyStudents: React.FC = () => {
  const navigate = useNavigate();
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentStatus | null>(
    null
  );
  const [selectedRequestType, setSelectedRequestType] = useState<string>("");

  const { data: students = [], isLoading } = useQuery<StudentStatus[]>({
    queryKey: ["supervisor-my-students"],
    queryFn: async () => {
      const res = await api.get("/phd-request/supervisor/my-students");
      return res.data;
    },
  });

  const availableRequests = useMemo(() => {
    if (!selectedStudent) return [];
    const status = selectedStudent.currentStatus.toLowerCase();

    // Requests that can be initiated anytime after proposal completion
    const anytimeRequests = phdRequestSchemas.phdRequestTypes.filter(
      (type) => !postProposalRequestOrder.includes(type)
    );

    let availablePostProposal: (typeof phdRequestSchemas.phdRequestTypes)[number][] =
      [];

    if (status.includes("proposal: completed")) {
      availablePostProposal.push("pre_submission");
    } else if (status.includes("request: pre submission - completed")) {
      availablePostProposal.push("draft_notice");
    } else if (status.includes("request: draft notice - completed")) {
      availablePostProposal.push("change_of_title", "thesis_submission");
    } else if (status.includes("request: thesis submission - completed")) {
      availablePostProposal.push("final_thesis_submission");
    }

    return [...availablePostProposal, ...anytimeRequests];
  }, [selectedStudent]);

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
            A summary of your students' progress and available actions. Click on
            a student to view their full request history.
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
                  <TableRow
                    key={student.email}
                    onClick={() =>
                      navigate(
                        `/phd/supervisor/student-history/${student.email}`
                      )
                    }
                    className="cursor-pointer"
                  >
                    <TableCell className="font-medium">
                      {student.name || student.email}
                    </TableCell>
                    <TableCell>{student.idNumber || "N/A"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{student.currentStatus}</span>
                        {student.reversionComments && (
                          <Tooltip>
                            <TooltipTrigger>
                              <MessageCircleWarning className="h-4 w-4 text-destructive" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">
                                {student.reversionComments}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div
                        className="flex justify-end gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {student.currentStatus.toLowerCase().includes("qe") && (
                          <Button variant="outline" size="sm" asChild>
                            <Link to="/phd/supervisor/examiner-suggestions">
                              Suggest Examiners
                            </Link>
                          </Button>
                        )}
                        {student.currentStatus
                          .toLowerCase()
                          .includes("proposal") && (
                          <Button variant="outline" size="sm" asChild>
                            <Link to="/phd/supervisor/proposals">
                              View Proposal
                            </Link>
                          </Button>
                        )}
                        {student.canResubmitRequest && student.requestId && (
                          <Button variant="destructive" size="sm" asChild>
                            <Link to={`/phd/requests/${student.requestId}`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Resubmit Request
                            </Link>
                          </Button>
                        )}
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleOpenDialog(student)}
                          disabled={!student.canInitiateRequest}
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          Initiate Request
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Initiate New Request for {selectedStudent?.name}
            </DialogTitle>
            <DialogDescription>
              Select the type of request you want to start. Available options
              are based on the student's current progress.
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
                {availableRequests.map((type) => (
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
