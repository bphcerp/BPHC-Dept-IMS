import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/ui/spinner";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  FileText, 
  Download,
  ExternalLink,
  CheckCircle,
  XCircle
} from "lucide-react";
import { QualifyingExamApplication } from "./ApplicationsDataTable";

interface ApplicationDetailsDialogProps {
  application: QualifyingExamApplication | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (applicationId: number, status: "accepted" | "rejected", comments?: string) => void;
  isUpdating?: boolean;
}

export const ApplicationDetailsDialog: React.FC<ApplicationDetailsDialogProps> = ({
  application,
  isOpen,
  onClose,
  onStatusUpdate,
  isUpdating = false,
}) => {
  const [comments, setComments] = React.useState("");
  const [pendingAction, setPendingAction] = React.useState<"accepted" | "rejected" | null>(null);

  const handleStatusUpdate = (status: "accepted" | "rejected") => {
    if (!application) return;
    setPendingAction(status);
    onStatusUpdate(application.id, status, comments || undefined);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const statusBadgeVariant = {
    applied: "default",
    accepted: "default", 
    rejected: "destructive",
    withdrawn: "secondary",
  } as const;

  const fileLabels = {
    qualifyingArea1Syllabus: "Area 1 Syllabus",
    qualifyingArea2Syllabus: "Area 2 Syllabus", 
    tenthReport: "10th Grade Report",
    twelfthReport: "12th Grade Report",
    undergradReport: "Undergraduate Report",
    mastersReport: "Masters Report (Optional)",
  };

  React.useEffect(() => {
    if (!isUpdating && pendingAction) {
      setPendingAction(null);
      setComments("");
      onClose();
    }
  }, [isUpdating, pendingAction, onClose]);

  if (!application) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Qualifying Exam Application - {application.student.name}
          </DialogTitle>
          <DialogDescription>
            Review and manage the qualifying exam application
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Student Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-4 w-4" />
                Student Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Name:</span>
                    <span className="text-sm">{application.student.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Email:</span>
                    <span className="text-sm">{application.student.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">ERP ID:</span>
                    <span className="text-sm font-mono">{application.student.erpId}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {application.student.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Phone:</span>
                      <span className="text-sm">{application.student.phone}</span>
                    </div>
                  )}
                  {application.student.supervisor && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Supervisor:</span>
                      <span className="text-sm">{application.student.supervisor}</span>
                    </div>
                  )}
                  {application.student.coSupervisor1 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Co-Supervisor:</span>
                      <span className="text-sm">{application.student.coSupervisor1}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Application Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Application Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium">Status:</span>
                    <Badge variant={statusBadgeVariant[application.status]} className="ml-2">
                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Qualifying Area 1:</span>
                    <p className="text-sm text-gray-600 mt-1">{application.qualifyingArea1}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Qualifying Area 2:</span>
                    <p className="text-sm text-gray-600 mt-1">{application.qualifyingArea2}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Submitted:</span>
                    <span className="text-sm">{formatDate(application.createdAt)}</span>
                  </div>
                  {application.updatedAt !== application.createdAt && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Updated:</span>
                      <span className="text-sm">{formatDate(application.updatedAt)}</span>
                    </div>
                  )}
                  {application.comments && (
                    <div>
                      <span className="text-sm font-medium">Comments:</span>
                      <p className="text-sm text-gray-600 mt-1 p-2 bg-gray-50 rounded">
                        {application.comments}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Uploaded Files */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Download className="h-4 w-4" />
                Uploaded Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(application.files).map(([key, file]) => {
                  const fileKey = key as keyof typeof fileLabels;
                  return (
                    <div key={key} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{fileLabels[fileKey]}</p>
                        </div>
                        {file && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(file, "_blank")}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const link = document.createElement("a");
                                link.href = file;
                                link.download = `${application.student.erpId}-${fileLabels[fileKey]}.pdf`;
                                link.click();
                              }}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {application.status === "applied" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Review Application</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="comments">Comments (optional)</Label>
                  <Textarea
                    id="comments"
                    placeholder="Add any comments for the student..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows={3}
                    className="mt-2"
                  />
                </div>
                
                <Separator />
                
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleStatusUpdate("accepted")}
                    disabled={isUpdating}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {isUpdating && pendingAction === "accepted" ? (
                      <>
                        <LoadingSpinner className="mr-2 h-4 w-4" />
                        Accepting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Accept Application
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleStatusUpdate("rejected")}
                    disabled={isUpdating}
                    variant="destructive"
                    className="flex-1"
                  >
                    {isUpdating && pendingAction === "rejected" ? (
                      <>
                        <LoadingSpinner className="mr-2 h-4 w-4" />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject Application
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
