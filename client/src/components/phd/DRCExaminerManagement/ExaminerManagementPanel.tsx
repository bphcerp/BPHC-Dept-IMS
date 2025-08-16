import React, { useState, useMemo } from "react";
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
import { ArrowLeft, Send, UserPlus, CheckCircle, Clock } from "lucide-react";
import NotificationDialog from "./NotificationDialog";

type VerifiedApplication = {
  id: number;
  student: { name: string | null; email: string; supervisor: string | null };
  qualifyingArea1: string;
  qualifyingArea2: string;
  examinerSuggestionCount: number;
  examinerAssignmentCount: number;
  examinerAssignments: { examinerEmail: string; qualifyingArea: string }[];
};

interface ExaminerManagementPanelProps {
  selectedExamId: number;
  onBack?: () => void;
}

const ExaminerManagementPanel: React.FC<ExaminerManagementPanelProps> = ({
  selectedExamId,
  onBack,
}) => {
  const queryClient = useQueryClient();
  const [selectedApplication, setSelectedApplication] =
    useState<VerifiedApplication | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isNotifyDialogOpen, setIsNotifyDialogOpen] = useState(false);
  const [notificationData, setNotificationData] = useState<{
    recipients: string[];
    subject: string;
    body: string;
    link?: string;
  }>({
    recipients: [],
    subject: "",
    body: "",
  });

  const {
    data: applications = [],
    isLoading,
    refetch,
  } = useQuery<VerifiedApplication[]>({
    queryKey: ["verified-applications-examiners", selectedExamId],
    queryFn: async () => {
      const response = await api.get(
        `/phd/drcMember/getVerifiedApplications/${selectedExamId}`
      );
      return response.data;
    },
    enabled: !!selectedExamId,
  });

  const uniqueSupervisors = useMemo(() => {
    const supervisorEmails = new Set(
      applications.map((app) => app.student.supervisor).filter(Boolean)
    );
    return Array.from(supervisorEmails) as string[];
  }, [applications]);

  const handleNotifySupervisors = () => {
    if (uniqueSupervisors.length === 0) {
      toast.info("No supervisors to notify for this exam.");
      return;
    }
    setNotificationData({
      recipients: uniqueSupervisors,
      subject: "Reminder: PhD Qualifying Exam Examiner Suggestions",
      body: `Dear Supervisors,\n\nThis is a reminder to please submit your examiner suggestions for the upcoming PhD Qualifying Examination for your students.\n\nPlease log in to the IMS portal to submit your suggestions at your earliest convenience.\n\nThank you,\nDoctoral Research Committee`,
    });
    setIsNotifyDialogOpen(true);
  };

  const handleNotifyExaminers = async () => {
    const assignedExaminers = applications.flatMap((app) =>
      app.examinerAssignments
        ? app.examinerAssignments.map((a) => a.examinerEmail)
        : []
    );

    if (assignedExaminers.length === 0) {
      toast.info("No examiners have been assigned yet to notify.");
      return;
    }

    const recipients = [...new Set(assignedExaminers)];
    setNotificationData({
      recipients,
      subject: `Invitation to be an Examiner for PhD Qualifying Exam`,
      body: `Dear Examiners,\n\nThis is to inform you that you have been assigned as an examiner for the upcoming PhD Qualifying Examination. You will receive separate detailed notifications for each student you are assigned to examine.\n\nFurther details will be communicated to you shortly.\n\nBest regards,\nPhD Department`,
    });
    setIsNotifyDialogOpen(true);
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
              <Button onClick={handleNotifySupervisors} variant="outline">
                <Send className="mr-2 h-4 w-4" /> Notify All Supervisors
              </Button>
              <Button onClick={handleNotifyExaminers}>
                <Send className="mr-2 h-4 w-4" /> Notify All Assigned Examiners
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Supervisor</TableHead>
                <TableHead>Area 1</TableHead>
                <TableHead>Area 2</TableHead>
                <TableHead>Suggestion Status</TableHead>
                <TableHead>Assignment Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>
                    <div className="font-medium">{app.student.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {app.student.email}
                    </div>
                  </TableCell>
                  <TableCell>{app.student.supervisor}</TableCell>
                  <TableCell>{app.qualifyingArea1}</TableCell>
                  <TableCell>{app.qualifyingArea2}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        app.examinerSuggestionCount > 0
                          ? "default"
                          : "secondary"
                      }
                      className={
                        app.examinerSuggestionCount > 0
                          ? "bg-green-100 text-green-800"
                          : ""
                      }
                    >
                      {app.examinerSuggestionCount > 0 ? (
                        <>
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Received
                        </>
                      ) : (
                        <>
                          <Clock className="mr-1 h-3 w-3" />
                          Pending
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        app.examinerAssignmentCount > 0
                          ? "default"
                          : "secondary"
                      }
                      className={
                        app.examinerAssignmentCount > 0
                          ? "bg-blue-100 text-blue-800"
                          : ""
                      }
                    >
                      {app.examinerAssignmentCount >= 2 ? (
                        <>
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Assigned
                        </>
                      ) : (
                        <>
                          <Clock className="mr-1 h-3 w-3" />
                          Pending
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedApplication(app);
                        setIsAssignDialogOpen(true);
                      }}
                      disabled={app.examinerSuggestionCount === 0}
                    >
                      <UserPlus className="mr-2 h-4 w-4" /> Assign
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
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
      <NotificationDialog
        isOpen={isNotifyDialogOpen}
        onClose={() => setIsNotifyDialogOpen(false)}
        initialData={notificationData}
      />
    </div>
  );
};

interface AssignExaminerDialogProps {
  application: VerifiedApplication;
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
  const { data: suggestions, isLoading: isLoadingSuggestions } = useQuery<
    Record<string, string[]>
  >({
    queryKey: ["examiner-suggestions", application.id],
    queryFn: async () => {
      const response = await api.get(
        `/phd/drcMember/getExaminerSuggestions/${application.id}`
      );
      return response.data;
    },
    enabled: isOpen,
  });

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
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to assign examiners."
      );
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

  const suggestionsForArea1 = suggestions?.[application.qualifyingArea1] || [];
  const suggestionsForArea2 = suggestions?.[application.qualifyingArea2] || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            Assign Examiners for{application.student.name}
          </DialogTitle>
          <DialogDescription>
            Select one examiner for each qualifying area from the supervisor's
            suggestions.
          </DialogDescription>
        </DialogHeader>
        {isLoadingSuggestions ? (
          <LoadingSpinner />
        ) : (
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
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={assignMutation.isLoading || isLoadingSuggestions}
          >
            {assignMutation.isLoading ? <LoadingSpinner /> : "Assign Examiners"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExaminerManagementPanel;
