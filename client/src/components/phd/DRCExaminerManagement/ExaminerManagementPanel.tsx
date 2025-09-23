import React, { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, UserPlus, CalendarDays, FileDown } from "lucide-react";
import { phdSchemas } from "lib";
import { isAxiosError } from "axios";
import RequestSuggestionsDialog from "./RequestSuggestionsDialog";
import NotifyExaminerDialog from "./NotifyExaminerDialog";
import TimetableDialog from "./TimetableDialog";

interface ExaminerManagementPanelProps {
  selectedExamId: number;
  examinerCount: number;
  onBack?: () => void;
}
const ExaminerManagementPanel: React.FC<ExaminerManagementPanelProps> = ({
  selectedExamId,
  examinerCount,
  onBack,
}) => {
  const [selectedApplication, setSelectedApplication] =
    useState<phdSchemas.VerifiedApplication | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isUpdateExaminerCountDialogOpen, setIsUpdateExaminerCountDialogOpen] =
    useState(false);
  const [isRequestSuggestionsDialogOpen, setIsRequestSuggestionsDialogOpen] =
    useState(false);
  const [isNotifyExaminerDialogOpen, setIsNotifyExaminerDialogOpen] =
    useState(false);
  const [isTimetableDialogOpen, setIsTimetableDialogOpen] = useState(false);
  const [selectedAreaForNotification, setSelectedAreaForNotification] =
    useState<string>("");
  const queryClient = useQueryClient();
  const {
    data: applications = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["verified-applications", selectedExamId],
    queryFn: async () => {
      const response = await api.get<phdSchemas.VerifiedApplication[]>(
        `/phd/drcMember/getVerifiedApplications/${selectedExamId}`
      );
      return response.data;
    },
    enabled: !!selectedExamId,
  });
  const updateQpStatusMutation = useMutation({
    mutationFn: (data: {
      applicationId: number;
      qualifyingArea: string;
      qpSubmitted: boolean;
    }) => api.post("/phd/drcMember/updateQpSubmissionStatus", data),
    onSuccess: () => {
      toast.success("QP submission status updated successfully.");
      void refetch();
    },
    onError: () => {
      toast.error("Failed to update QP submission status.");
    },
  });
  const downloadPdfMutation = useMutation({
    mutationFn: () =>
      api.get(`/phd/drcMember/generateTimetablePdf/${selectedExamId}`, {
        responseType: "blob",
      }),
    onSuccess: (response) => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Timetable-Exam-${selectedExamId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success("Timetable PDF downloaded.");
    },
    onError: () => {
      toast.error("Failed to download PDF.");
    },
  });
  const handleRequestExaminerSuggestions = () => {
    setIsRequestSuggestionsDialogOpen(true);
  };
  const handleQpStatusChange = (
    applicationId: number,
    qualifyingArea: string,
    qpSubmitted: boolean
  ) => {
    updateQpStatusMutation.mutate({
      applicationId,
      qualifyingArea,
      qpSubmitted,
    });
  };
  const handleNotifyExaminer = (area: string) => {
    setSelectedAreaForNotification(area);
    setIsNotifyExaminerDialogOpen(true);
  };
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle>Manage Examiners</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => downloadPdfMutation.mutate()}
                disabled={downloadPdfMutation.isLoading}
              >
                <FileDown className="mr-2 h-4 w-4" />
                Generate Timetable
              </Button>
              <Button onClick={() => setIsTimetableDialogOpen(true)}>
                <CalendarDays className="mr-2 h-4 w-4" />
                View Timetable
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {}
          {applications.length > 0 && (
            <div className="mb-6 space-y-4">
              <div className="flex items-center justify-between rounded-lg border bg-muted/20 p-4">
                <div className="flex items-center space-x-4">
                  <div>
                    <div className="text-sm font-medium">
                      Examiner Suggestions Required per Area
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Number of examiner suggestions supervisors should provide
                      for each qualifying area
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">
                      Count:
                    </span>
                    <span className="font-medium">{examinerCount ?? 2}</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedApplication(applications[0]);
                    setIsUpdateExaminerCountDialogOpen(true);
                  }}
                >
                  Edit Count
                </Button>
              </div>
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead> <TableHead>Supervisor</TableHead>
                <TableHead>Area 1 Examiner</TableHead>
                <TableHead>Area 2 Examiner</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => {
                const areExaminersSuggested = !!Object.keys(
                  app.examinerSuggestions
                ).length;
                const supervisorTodosExists = app.supervisorTodoExists;
                const areExaminersAssigned = !!Object.keys(
                  app.examinerAssignments
                ).length;
                const hasRejected = Object.values(app.examinerAssignments).some(
                  (assignment) => assignment.hasAccepted === false
                );
                return (
                  <TableRow key={app.id}>
                    <TableCell>
                      <div className="font-medium">{app.student.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {app.student.email}
                      </div>
                    </TableCell>
                    <TableCell>{app.student.supervisor}</TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="text-sm font-medium">
                          {app.qualifyingArea1}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {areExaminersAssigned
                            ? app.examinerAssignments[app.qualifyingArea1]
                                ?.examinerEmail
                            : "Not Assigned"}
                        </div>
                        {areExaminersAssigned && (
                          <>
                            {app.examinerAssignments[app.qualifyingArea1]
                              ?.hasAccepted === true ? (
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  checked={
                                    app.examinerAssignments[app.qualifyingArea1]
                                      ?.qpSubmitted || false
                                  }
                                  onCheckedChange={(checked) =>
                                    handleQpStatusChange(
                                      app.id,
                                      app.qualifyingArea1,
                                      checked as boolean
                                    )
                                  }
                                />
                                <span className="text-xs">QP Submitted</span>
                              </div>
                            ) : app.examinerAssignments[app.qualifyingArea1]
                                ?.hasAccepted === false ? (
                              <div className="text-sm text-red-600">
                                Rejected
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground">
                                Yet to accept
                              </div>
                            )}
                            {app.examinerAssignments[app.qualifyingArea1]
                              ?.hasAccepted !== false && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedApplication(app);
                                  handleNotifyExaminer(app.qualifyingArea1);
                                }}
                              >
                                {app.examinerAssignments[app.qualifyingArea1]
                                  ?.notifiedAt
                                  ? "Send Reminder"
                                  : "Send Mail"}
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="text-sm font-medium">
                          {app.qualifyingArea2}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {areExaminersAssigned
                            ? app.examinerAssignments[app.qualifyingArea2]
                                ?.examinerEmail
                            : "Not Assigned"}
                        </div>
                        {areExaminersAssigned && (
                          <>
                            {app.examinerAssignments[app.qualifyingArea2]
                              ?.hasAccepted === true ? (
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  checked={
                                    app.examinerAssignments[app.qualifyingArea2]
                                      ?.qpSubmitted || false
                                  }
                                  onCheckedChange={(checked) =>
                                    handleQpStatusChange(
                                      app.id,
                                      app.qualifyingArea2,
                                      checked as boolean
                                    )
                                  }
                                />
                                <span className="text-xs">QP Submitted</span>
                              </div>
                            ) : app.examinerAssignments[app.qualifyingArea2]
                                ?.hasAccepted === false ? (
                              <div className="text-sm text-red-600">
                                Rejected
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground">
                                Yet to accept
                              </div>
                            )}
                            {app.examinerAssignments[app.qualifyingArea2]
                              ?.hasAccepted !== false && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedApplication(app);
                                  handleNotifyExaminer(app.qualifyingArea2);
                                }}
                              >
                                {app.examinerAssignments[app.qualifyingArea2]
                                  ?.notifiedAt
                                  ? "Send Reminder"
                                  : "Send Mail"}
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedApplication(app);
                          handleRequestExaminerSuggestions();
                        }}
                        type="button"
                        variant={
                          areExaminersSuggested
                            ? hasRejected
                              ? "destructive"
                              : "outline"
                            : "default"
                        }
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        {!areExaminersSuggested
                          ? supervisorTodosExists
                            ? "Send reminder"
                            : "Request suggestions"
                          : "Re-request"}
                      </Button>
                      {areExaminersSuggested && !areExaminersAssigned && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedApplication(app);
                            setIsAssignDialogOpen(true);
                          }}
                        >
                          <UserPlus className="mr-2 h-4 w-4" /> Assign
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <div className="flex justify-start">
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Forms
          </Button>
        )}
      </div>
      {isTimetableDialogOpen && (
        <TimetableDialog
          isOpen={isTimetableDialogOpen}
          onClose={() => setIsTimetableDialogOpen(false)}
          selectedExamId={selectedExamId}
        />
      )}
      {selectedApplication && (
        <AssignExaminerDialog
          application={selectedApplication}
          isOpen={isAssignDialogOpen}
          onClose={() => setIsAssignDialogOpen(false)}
          onSuccess={() => {
            setIsAssignDialogOpen(false);
            void refetch();
          }}
        />
      )}
      {selectedApplication && (
        <UpdateExaminerCountDialog
          examId={selectedExamId}
          examinerCount={examinerCount}
          isOpen={isUpdateExaminerCountDialogOpen}
          onClose={() => setIsUpdateExaminerCountDialogOpen(false)}
          onSuccess={() => {
            setIsUpdateExaminerCountDialogOpen(false);
            void queryClient.invalidateQueries({ queryKey: ["exams"] });
          }}
        />
      )}
      {selectedApplication && (
        <RequestSuggestionsDialog
          isOpen={isRequestSuggestionsDialogOpen}
          setIsOpen={setIsRequestSuggestionsDialogOpen}
          application={selectedApplication}
          toSuggest={examinerCount}
        />
      )}
      {selectedApplication && (
        <NotifyExaminerDialog
          application={selectedApplication}
          area={selectedAreaForNotification}
          isOpen={isNotifyExaminerDialogOpen}
          setIsOpen={setIsNotifyExaminerDialogOpen}
          onSuccess={() => {
            setIsNotifyExaminerDialogOpen(false);
            void refetch();
          }}
        />
      )}
    </div>
  );
};
interface AssignExaminerDialogProps {
  application: phdSchemas.VerifiedApplication;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}
const AssignExaminerDialog: React.FC<AssignExaminerDialogProps> = ({
  application,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedExaminer1, setSelectedExaminer1] = useState("");
  const [selectedExaminer2, setSelectedExaminer2] = useState("");
  const assignMutation = useMutation({
    mutationFn: (data: {
      applicationId: number;
      examinerArea1: string;
      examinerArea2: string;
    }) => api.post("/phd/drcMember/assignExaminers", data),
    onSuccess: () => {
      toast.success("Examiners assigned successfully.");
      onSuccess();
    },
    onError: () => {
      toast.error("Failed to assign examiners.");
    },
  });
  const handleSubmit = () => {
    if (!selectedExaminer1 || !selectedExaminer2) {
      toast.error("Please select an examiner for both areas.");
      return;
    }
    assignMutation.mutate({
      applicationId: application.id,
      examinerArea1: selectedExaminer1,
      examinerArea2: selectedExaminer2,
    });
  };
  const suggestionsForArea1 =
    application.examinerSuggestions[application.qualifyingArea1] || [];
  const suggestionsForArea2 =
    application.examinerSuggestions[application.qualifyingArea2] || [];
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            Assign Examiners for {application.student.name}
          </DialogTitle>
          <DialogDescription>
            Select one examiner for each qualifying area from the
            supervisor&apos;s suggestions.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="area1" className="col-span-1 text-right">
              {application.qualifyingArea1}
            </Label>
            <Select
              onValueChange={setSelectedExaminer1}
              value={selectedExaminer1}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select Examiner..." />
              </SelectTrigger>
              <SelectContent>
                {suggestionsForArea1.map((email) => (
                  <SelectItem key={email} value={email}>
                    {email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="area2" className="col-span-1 text-right">
              {application.qualifyingArea2}
            </Label>
            <Select
              onValueChange={setSelectedExaminer2}
              value={selectedExaminer2}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select Examiner..." />
              </SelectTrigger>
              <SelectContent>
                {suggestionsForArea2.map((email) => (
                  <SelectItem key={email} value={email}>
                    {email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={assignMutation.isLoading}>
            {assignMutation.isLoading ? <LoadingSpinner /> : "Assign Examiners"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
interface UpdateExaminerCountDialogProps {
  examinerCount: number;
  examId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}
const UpdateExaminerCountDialog: React.FC<UpdateExaminerCountDialogProps> = ({
  examinerCount,
  examId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [examinerCountState, setExaminerCount] = useState(examinerCount);
  const updateMutation = useMutation({
    mutationFn: (data: { examId: number; examinerCount: number }) =>
      api.post("/phd/drcMember/updateExaminerCount", data),
    onSuccess: () => {
      toast.success("Examiner count updated successfully.");
      onSuccess();
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        toast.error(
          `Failed to update examiner count:, ${error.response?.data}`
        );
      }
      toast.error("Failed to update examiner count.");
    },
  });
  const handleSubmit = () => {
    updateMutation.mutate({ examId, examinerCount: examinerCountState });
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Update Global Examiner Count</DialogTitle>
          <DialogDescription>
            Set the number of examiner suggestions required from supervisors for
            each qualifying area. This applies to all applications.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="examiner-count" className="col-span-1 text-right">
              Count
            </Label>
            <Select
              value={examinerCountState.toString()}
              onValueChange={(value) => setExaminerCount(parseInt(value))}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={updateMutation.isLoading}>
            {updateMutation.isLoading ? <LoadingSpinner /> : "Update Count"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
export default ExaminerManagementPanel;
