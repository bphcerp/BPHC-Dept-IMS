import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, UserPlus } from "lucide-react";
import { phdSchemas } from "lib";
import { isAxiosError } from "axios";
import RequestSuggestionsDialog from "./RequestSuggestionsDialog";

interface ExaminerManagementPanelProps {
  selectedExamId: number;
  onBack?: () => void;
}

const ExaminerManagementPanel: React.FC<ExaminerManagementPanelProps> = ({
  selectedExamId,
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
  const [selectedAreaForNotification, setSelectedAreaForNotification] =
    useState<string>("");

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
            <div className="flex gap-2"></div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Supervisor</TableHead>
                {applications.length > 0 &&
                Object.keys(applications[0].examinerAssignments).length > 0 ? (
                  <>
                    <TableHead>Area 1 Examiner</TableHead>
                    <TableHead>Area 2 Examiner</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead>Area 1</TableHead>
                    <TableHead>Area 2</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </>
                )}
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

                return (
                  <TableRow key={app.id}>
                    <TableCell>
                      <div className="font-medium">{app.student.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {app.student.email}
                      </div>
                    </TableCell>
                    <TableCell>{app.student.supervisor}</TableCell>

                    {areExaminersAssigned ? (
                      <>
                        {/* Area 1 Examiner Column */}
                        <TableCell>
                          <div className="space-y-2">
                            <div className="text-sm font-medium">
                              {app.qualifyingArea1}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {
                                app.examinerAssignments[app.qualifyingArea1]
                                  ?.examinerEmail
                              }
                            </div>
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
                            {!app.examinerAssignments[app.qualifyingArea1]
                              ?.qpSubmitted && (
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
                          </div>
                        </TableCell>

                        {/* Area 2 Examiner Column */}
                        <TableCell>
                          <div className="space-y-2">
                            <div className="text-sm font-medium">
                              {app.qualifyingArea2}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {
                                app.examinerAssignments[app.qualifyingArea2]
                                  ?.examinerEmail
                              }
                            </div>
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
                            {!app.examinerAssignments[app.qualifyingArea2]
                              ?.qpSubmitted && (
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
                          </div>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>{app.qualifyingArea1}</TableCell>
                        <TableCell>{app.qualifyingArea2}</TableCell>
                        <TableCell className="space-x-2 text-right">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedApplication(app);
                              handleRequestExaminerSuggestions();
                            }}
                            type="button"
                            variant={
                              areExaminersSuggested ? "outline" : "default"
                            }
                          >
                            <UserPlus className="mr-2 h-4 w-4" />
                            {!areExaminersSuggested
                              ? supervisorTodosExists
                                ? "Send reminder to Supervisor"
                                : "Request suggestions from Supervisor"
                              : "Re-request suggestions"}
                          </Button>
                          {areExaminersSuggested && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedApplication(app);
                                setIsAssignDialogOpen(true);
                              }}
                            >
                              <UserPlus className="mr-2 h-4 w-4" /> Assign
                              Examiners
                            </Button>
                          )}
                        </TableCell>
                      </>
                    )}
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
          application={selectedApplication}
          isOpen={isUpdateExaminerCountDialogOpen}
          onClose={() => setIsUpdateExaminerCountDialogOpen(false)}
          onSuccess={() => {
            setIsUpdateExaminerCountDialogOpen(false);
            void refetch();
          }}
        />
      )}
      {selectedApplication && (
        <RequestSuggestionsDialog
          isOpen={isRequestSuggestionsDialogOpen}
          setIsOpen={setIsRequestSuggestionsDialogOpen}
          application={selectedApplication}
        />
      )}
      {selectedApplication && (
        <NotifyExaminerDialog
          application={selectedApplication}
          area={selectedAreaForNotification}
          isOpen={isNotifyExaminerDialogOpen}
          onClose={() => setIsNotifyExaminerDialogOpen(false)}
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
  application: phdSchemas.VerifiedApplication;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const UpdateExaminerCountDialog: React.FC<UpdateExaminerCountDialogProps> = ({
  application,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [examinerCount, setExaminerCount] = useState(
    Number.isFinite(application.examinerCount) ? application.examinerCount : 2
  );

  const updateMutation = useMutation({
    mutationFn: (data: { applicationId: number; examinerCount: number }) =>
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
    updateMutation.mutate({
      applicationId: application.id,
      examinerCount,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            Update Examiner Count for {application.student.name}
          </DialogTitle>
          <DialogDescription>
            Set the number of examiners to be assigned for this application.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="examiner-count" className="col-span-1 text-right">
              Count
            </Label>
            <Select
              value={examinerCount.toString()}
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

interface NotifyExaminerDialogProps {
  application: phdSchemas.VerifiedApplication;
  area: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const NotifyExaminerDialog: React.FC<NotifyExaminerDialogProps> = ({
  application,
  area,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const examinerEmail = application.examinerAssignments[area]?.examinerEmail;
  const isReminder = !!application.examinerAssignments[area]?.notifiedAt;

  const notifyMutation = useMutation({
    mutationFn: (data: { subject: string; body: string; area: string }) =>
      api.post(`/phd/drcMember/notifyExaminer/${application.id}`, data),
    onSuccess: () => {
      toast.success(`Notification sent to ${examinerEmail}`);
      onSuccess();
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        toast.error(`Failed to send notification: ${error.response?.data}`);
      } else {
        toast.error("Failed to send notification.");
      }
    },
  });

  const handleSubmit = () => {
    if (!subject.trim() || !body.trim()) {
      toast.error("Please fill in both subject and body.");
      return;
    }

    notifyMutation.mutate({
      subject,
      body,
      area,
    });
  };

  // Set default values when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setSubject(
        isReminder
          ? `Reminder: Question Paper Submission for ${area}`
          : `Question Paper Submission Required for ${area}`
      );
      setBody(
        isReminder
          ? `This is a reminder that your question paper for the qualifying area "${area}" is still pending submission.\n\nPlease submit it at your earliest convenience.\n\nBest regards,\nDRC Committee`
          : `You have been assigned as an examiner for the qualifying area "${area}" for student ${application.student.name}.\n\nPlease prepare and submit your question paper.\n\nBest regards,\nDRC Committee`
      );
    }
  }, [isOpen, area, examinerEmail, application.student.name, isReminder]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isReminder ? "Send Reminder" : "Notify Examiner"}
          </DialogTitle>
          <DialogDescription>
            Send a {isReminder ? "reminder" : "notification"} to {examinerEmail}{" "}
            about question paper submission for {area}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Email body"
              className="min-h-[200px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={notifyMutation.isLoading}>
            {notifyMutation.isLoading ? (
              <LoadingSpinner />
            ) : (
              "Send Notification"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExaminerManagementPanel;
