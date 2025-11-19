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
  const [selectedAreaForAssignment, setSelectedAreaForAssignment] =
    useState<string>("");
  const [isUpdateExaminerCountDialogOpen, setIsUpdateExaminerCountDialogOpen] =
    useState(false);
  const [isRequestSuggestionsDialogOpen, setIsRequestSuggestionsDialogOpen] =
    useState(false);
  const [isNotifyExaminerDialogOpen, setIsNotifyExaminerDialogOpen] =
    useState(false);
  const [isTimetableDialogOpen, setIsTimetableDialogOpen] = useState(false);
  const [selectedAreaForNotification, setSelectedAreaForNotification] =
    useState<string>("");
  const [selectedAreasForRequest, setSelectedAreasForRequest] = useState<
    string[]
  >([]);
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
                <TableHead>Student</TableHead>
                <TableHead>Supervisor</TableHead>
                <TableHead>Area 1 Examiner & Actions</TableHead>
                <TableHead>Area 2 Examiner & Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => {
                const hasSuggestionsArea1 = !!app.examinerSuggestions[
                  app.qualifyingArea1
                ];
                const hasSuggestionsArea2 = !!app.examinerSuggestions[
                  app.qualifyingArea2
                ];
                const hasAssignmentArea1 = !!app.examinerAssignments[
                  app.qualifyingArea1
                ];
                const hasAssignmentArea2 = !!app.examinerAssignments[
                  app.qualifyingArea2
                ];
                const hasRejectedArea1 =
                  app.examinerAssignments[app.qualifyingArea1]?.hasAccepted ===
                  false;
                const hasRejectedArea2 =
                  app.examinerAssignments[app.qualifyingArea2]?.hasAccepted ===
                  false;
                const hasSupervisor = !!app.student.supervisor;
                return (
                  <TableRow key={app.id}>
                    <TableCell>
                      <div className="font-medium">{app.student.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {app.student.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      {hasSupervisor ? (
                        app.student.supervisor
                      ) : (
                        <span className="text-sm text-red-600">No Supervisor</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-3">
                        {/* Area Name */}
                        <div className="text-sm font-semibold text-foreground">
                          {app.qualifyingArea1}
                        </div>
                        
                        {/* Examiner Email */}
                        <div className="text-sm text-muted-foreground">
                          {hasAssignmentArea1
                            ? app.examinerAssignments[app.qualifyingArea1]
                                ?.examinerEmail
                            : "Not Assigned"}
                        </div>
                        
                        {/* Assignment Status */}
                        {hasAssignmentArea1 && (
                          <div className="flex items-center gap-2">
                            {app.examinerAssignments[app.qualifyingArea1]
                              ?.hasAccepted === true ? (
                              <div className="flex items-center gap-2">
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
                                <span className={`text-xs font-medium ${
                                  app.examinerAssignments[app.qualifyingArea1]
                                    ?.qpSubmitted
                                    ? "text-green-700"
                                    : "text-muted-foreground"
                                }`}>
                                  QP Submitted
                                </span>
                              </div>
                            ) : app.examinerAssignments[app.qualifyingArea1]
                                ?.hasAccepted === false ? (
                              <span className="text-xs font-medium text-red-600">
                                Rejected
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                Pending Acceptance
                              </span>
                            )}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2">
                          {/* Remind Button - only show if accepted and QP not submitted */}
                          {hasAssignmentArea1 && 
                           app.examinerAssignments[app.qualifyingArea1]?.hasAccepted === true &&
                           !app.examinerAssignments[app.qualifyingArea1]?.qpSubmitted && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedApplication(app);
                                handleNotifyExaminer(app.qualifyingArea1);
                              }}
                            >
                              Remind
                            </Button>
                          )}
                          
                          {/* Notify Button - only show if not yet accepted */}
                          {hasAssignmentArea1 && 
                           app.examinerAssignments[app.qualifyingArea1]?.hasAccepted === null && (
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
                                ? "Remind"
                                : "Notify"}
                            </Button>
                          )}
                          
                          {hasSupervisor && (
                            <>
                              {/* Request/Remind/Re-request button */}
                              {(!hasAssignmentArea1 || 
                                app.examinerAssignments[app.qualifyingArea1]?.hasAccepted === null) && 
                               !hasRejectedArea1 && (
                                <Button
                                  size="sm"
                                  variant={
                                    hasSuggestionsArea1
                                      ? "secondary"
                                      : app.supervisorTodoExistsArea1
                                      ? "outline"
                                      : "default"
                                  }
                                  onClick={() => {
                                    setSelectedApplication(app);
                                    setSelectedAreasForRequest([app.qualifyingArea1]);
                                    setIsRequestSuggestionsDialogOpen(true);
                                  }}
                                >
                                  <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                                  {hasSuggestionsArea1
                                    ? "Re-request"
                                    : app.supervisorTodoExistsArea1
                                    ? "Remind"
                                    : "Request"}
                                </Button>
                              )}
                              
                              {/* Assign/Overwrite button */}
                              {hasSuggestionsArea1 && 
                               (!hasAssignmentArea1 || 
                                app.examinerAssignments[app.qualifyingArea1]?.hasAccepted === null) && (
                                <Button
                                  size="sm"
                                  variant={hasAssignmentArea1 ? "secondary" : "default"}
                                  onClick={() => {
                                    setSelectedApplication(app);
                                    setSelectedAreaForAssignment(app.qualifyingArea1);
                                    setIsAssignDialogOpen(true);
                                  }}
                                >
                                  <UserPlus className="mr-1.5 h-3.5 w-3.5" /> 
                                  {hasAssignmentArea1 ? "Overwrite" : "Assign"}
                                </Button>
                              )}

                              {/* Re-assign / Re-request when rejected */}
                              {hasRejectedArea1 && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => {
                                      setSelectedApplication(app);
                                      setSelectedAreaForAssignment(app.qualifyingArea1);
                                      setIsAssignDialogOpen(true);
                                    }}
                                  >
                                    <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Re-assign
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                      setSelectedApplication(app);
                                      setSelectedAreasForRequest([app.qualifyingArea1]);
                                      setIsRequestSuggestionsDialogOpen(true);
                                    }}
                                  >
                                    <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Re-request
                                  </Button>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-3">
                        {/* Area Name */}
                        <div className="text-sm font-semibold text-foreground">
                          {app.qualifyingArea2}
                        </div>
                        
                        {/* Examiner Email */}
                        <div className="text-sm text-muted-foreground">
                          {hasAssignmentArea2
                            ? app.examinerAssignments[app.qualifyingArea2]
                                ?.examinerEmail
                            : "Not Assigned"}
                        </div>
                        
                        {/* Assignment Status */}
                        {hasAssignmentArea2 && (
                          <div className="flex items-center gap-2">
                            {app.examinerAssignments[app.qualifyingArea2]
                              ?.hasAccepted === true ? (
                              <div className="flex items-center gap-2">
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
                                <span className={`text-xs font-medium ${
                                  app.examinerAssignments[app.qualifyingArea2]
                                    ?.qpSubmitted
                                    ? "text-green-700"
                                    : "text-muted-foreground"
                                }`}>
                                  QP Submitted
                                </span>
                              </div>
                            ) : app.examinerAssignments[app.qualifyingArea2]
                                ?.hasAccepted === false ? (
                              <span className="text-xs font-medium text-red-600">
                                Rejected
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                Pending Acceptance
                              </span>
                            )}
                          </div>
                        )}

                        {/* Action Buttons */}
                        {hasSupervisor ? (
                          <div className="flex flex-wrap gap-2">
                            {/* Remind Button - only show if accepted and QP not submitted */}
                            {hasAssignmentArea2 && 
                             app.examinerAssignments[app.qualifyingArea2]?.hasAccepted === true &&
                             !app.examinerAssignments[app.qualifyingArea2]?.qpSubmitted && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedApplication(app);
                                  handleNotifyExaminer(app.qualifyingArea2);
                                }}
                              >
                                Remind
                              </Button>
                            )}
                            
                            {/* Notify Button - only show if not yet accepted */}
                            {hasAssignmentArea2 && 
                             app.examinerAssignments[app.qualifyingArea2]?.hasAccepted === null && (
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
                                  ? "Remind"
                                  : "Notify"}
                              </Button>
                            )}
                            
                            {/* Request/Remind/Re-request button */}
                            {(!hasAssignmentArea2 || 
                              app.examinerAssignments[app.qualifyingArea2]?.hasAccepted === null) && 
                             !hasRejectedArea2 && (
                              <Button
                                size="sm"
                                variant={
                                  hasSuggestionsArea2
                                    ? "secondary"
                                    : app.supervisorTodoExistsArea2
                                    ? "outline"
                                    : "default"
                                }
                                onClick={() => {
                                  setSelectedApplication(app);
                                  setSelectedAreasForRequest([app.qualifyingArea2]);
                                  setIsRequestSuggestionsDialogOpen(true);
                                }}
                              >
                                <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                                {hasSuggestionsArea2
                                  ? "Re-request"
                                  : app.supervisorTodoExistsArea2
                                  ? "Remind"
                                  : "Request"}
                              </Button>
                            )}
                            
                            {/* Assign/Overwrite button */}
                            {hasSuggestionsArea2 && 
                             (!hasAssignmentArea2 || 
                              app.examinerAssignments[app.qualifyingArea2]?.hasAccepted === null) && (
                              <Button
                                size="sm"
                                variant={hasAssignmentArea2 ? "secondary" : "default"}
                                onClick={() => {
                                  setSelectedApplication(app);
                                  setSelectedAreaForAssignment(app.qualifyingArea2);
                                  setIsAssignDialogOpen(true);
                                }}
                              >
                                <UserPlus className="mr-1.5 h-3.5 w-3.5" /> 
                                {hasAssignmentArea2 ? "Overwrite" : "Assign"}
                              </Button>
                            )}

                            {/* Re-assign / Re-request when rejected */}
                            {hasRejectedArea2 && (
                              <>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => {
                                    setSelectedApplication(app);
                                    setSelectedAreaForAssignment(app.qualifyingArea2);
                                    setIsAssignDialogOpen(true);
                                  }}
                                >
                                  <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Re-assign
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setSelectedApplication(app);
                                    setSelectedAreasForRequest([app.qualifyingArea2]);
                                    setIsRequestSuggestionsDialogOpen(true);
                                  }}
                                >
                                  <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Re-request
                                </Button>
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-red-600">
                            Please assign supervisor
                          </div>
                        )}
                      </div>
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
      {selectedApplication && selectedAreaForAssignment && (
        <AssignExaminerDialog
          application={selectedApplication}
          area={selectedAreaForAssignment}
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
          preselectedAreas={selectedAreasForRequest}
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
  area: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}
const AssignExaminerDialog: React.FC<AssignExaminerDialogProps> = ({
  application,
  area,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const isArea1 = area === application.qualifyingArea1;
  const qualifyingArea = isArea1
    ? application.qualifyingArea1
    : application.qualifyingArea2;
  const hasAssignment = isArea1
    ? !!application.examinerAssignments[application.qualifyingArea1]
    : !!application.examinerAssignments[application.qualifyingArea2];
  const hasSuggestions = isArea1
    ? !!application.examinerSuggestions[application.qualifyingArea1]
    : !!application.examinerSuggestions[application.qualifyingArea2];

  const [selectedExaminer, setSelectedExaminer] = useState(
    hasAssignment && isArea1
      ? application.examinerAssignments[application.qualifyingArea1]
          ?.examinerEmail || ""
      : hasAssignment && !isArea1
      ? application.examinerAssignments[application.qualifyingArea2]
          ?.examinerEmail || ""
      : ""
  );

  const assignMutation = useMutation({
    mutationFn: (data: {
      applicationId: number;
      examinerArea1?: string;
      examinerArea2?: string;
    }) => api.post("/phd/drcMember/assignExaminers", data),
    onSuccess: () => {
      toast.success("Examiner assigned successfully.");
      onSuccess();
    },
    onError: (error) => {
      toast.error(
        (error as { response: { data: string } })?.response?.data ||
          "Failed to assign examiner."
      );
    },
  });

  const handleSubmit = () => {
    if (!selectedExaminer) {
      toast.error("Please select an examiner.");
      return;
    }

    // Check if trying to overwrite with the same examiner
    if (hasAssignment) {
      const currentExaminer = isArea1
        ? application.examinerAssignments[application.qualifyingArea1]
            ?.examinerEmail
        : application.examinerAssignments[application.qualifyingArea2]
            ?.examinerEmail;
      
      if (currentExaminer === selectedExaminer) {
        toast.error("Please select a different examiner to overwrite.");
        return;
      }
    }

    const payload: {
      applicationId: number;
      examinerArea1?: string;
      examinerArea2?: string;
    } = {
      applicationId: application.id,
    };

    if (isArea1) {
      payload.examinerArea1 = selectedExaminer;
    } else {
      payload.examinerArea2 = selectedExaminer;
    }

    assignMutation.mutate(payload);
  };

  const suggestions = isArea1
    ? application.examinerSuggestions[application.qualifyingArea1] || []
    : application.examinerSuggestions[application.qualifyingArea2] || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            Assign Examiner for {application.student.name}
          </DialogTitle>
          <DialogDescription>
            Select one examiner for <strong>{qualifyingArea}</strong> from the
            supervisor&apos;s suggestions.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {hasSuggestions ? (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="examiner" className="col-span-1 text-right">
                  Examiner
                </Label>
                <Select
                  onValueChange={setSelectedExaminer}
                  value={selectedExaminer}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select Examiner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {suggestions.map((email) => (
                      <SelectItem key={email} value={email}>
                        {email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {hasAssignment && (
                <div className="text-center text-sm text-muted-foreground">
                  Note: Overwriting will reset the examiner&apos;s acceptance status
                </div>
              )}
            </>
          ) : (
            <div className="rounded-lg border border-muted bg-muted/20 p-4">
              <div className="text-sm text-muted-foreground">
                No suggestions available for <strong>{qualifyingArea}</strong>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={assignMutation.isLoading || !hasSuggestions}
          >
            {assignMutation.isLoading ? (
              <LoadingSpinner />
            ) : hasAssignment ? (
              "Overwrite Examiner"
            ) : (
              "Assign Examiner"
            )}
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
