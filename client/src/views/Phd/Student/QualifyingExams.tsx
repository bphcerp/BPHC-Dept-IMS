import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { LoadingSpinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import QualifyingExamApplication from "@/components/phd/StudentQualifyingExam/QualifyingExamApplication";
import { toast } from "sonner";
import { AlertCircle, Edit, Eye } from "lucide-react";
import { Label } from "@/components/ui/label";

interface QualifyingExam {
  id: number;
  examName: string;
  submissionDeadline: string;
  examStartDate: string;
  examEndDate: string;
  vivaDate?: string;
  semester: {
    year: string;
    semesterNumber: number;
  };
}

interface ApplicationStatus {
  id: number;
  examId: number;
  examName: string;
  status: "draft" | "applied" | "verified" | "resubmit";
  qualifyingArea1: string;
  qualifyingArea2: string;
  comments?: string;
  semester: {
    year: string;
    semesterNumber: number;
  };
  submissionDeadline: string;
  examStartDate: string;
  examEndDate: string;
  vivaDate?: string;
  createdAt: string;
  files: Record<string, string | null>;
}

const QualifyingExams = () => {
  const [selectedExam, setSelectedExam] = useState<QualifyingExam | null>(null);
  const [selectedApplication, setSelectedApplication] =
    useState<ApplicationStatus | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [supervisorConsent, setSupervisorConsent] = useState(false);

  const {
    data: examsData,
    isLoading: isLoadingExams,
    refetch: refetchExams,
  } = useQuery({
    queryKey: ["phd-student-qualifying-exams"],
    queryFn: async () => {
      const response = await api.get<{
        success: boolean;
        exams: QualifyingExam[];
      }>("/phd/student/getQualifyingExams?name=Regular Qualifying Exam");
      return response.data;
    },
  });

  const {
    data: applicationsData,
    isLoading: isLoadingApplications,
    refetch: refetchApplications,
  } = useQuery({
    queryKey: ["phd-student-application-status"],
    queryFn: async () => {
      const response = await api.get<{
        success: boolean;
        applications: ApplicationStatus[];
        message?: string;
      }>("/phd/student/getQualifyingExamStatus");
      return response.data;
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusBadge = (status: ApplicationStatus["status"]) => {
    switch (status) {
      case "draft":
        return (
          <Badge variant="outline" className="border-gray-400 text-gray-600">
            Draft
          </Badge>
        );
      case "applied":
        return <Badge className="bg-blue-100 text-blue-800">Applied</Badge>;
      case "verified":
        return <Badge className="bg-green-100 text-green-800">Verified</Badge>;
      case "resubmit":
        return <Badge variant="destructive">Resubmission Required</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const openEditDialog = (
    exam: QualifyingExam,
    application: ApplicationStatus | null
  ) => {
    if (new Date(exam.submissionDeadline) < new Date()) {
      toast.error("The deadline for editing has passed.");
      return;
    }
    setSelectedExam(exam);
    setSelectedApplication(application);
    setIsEditOpen(true);
  };

  const openPreviewDialog = (application: ApplicationStatus) => {
    setSelectedApplication(application);
    const examForPreview = examsData?.exams.find(
      (e) => e.id === application.examId
    );
    setSelectedExam(examForPreview || null);
    setSupervisorConsent(false);
    setIsPreviewOpen(true);
  };

  const handleApplyClick = (exam: QualifyingExam) => {
    const existingApplication = applicationsData?.applications?.find(
      (app) => app.examId === exam.id
    );
    if (existingApplication && existingApplication.status !== "draft") {
      toast.error("You have already submitted an application for this exam");
      return;
    }
    openEditDialog(exam, existingApplication || null);
  };

  const handleFinalSubmit = async () => {
    if (!selectedApplication?.id) {
      toast.error("Cannot submit, application ID is missing.");
      return;
    }
    if (new Date(selectedApplication.submissionDeadline) < new Date()) {
      toast.error("The submission deadline has passed.");
      return;
    }
    try {
      const response = await api.post<{ success: boolean; message: string }>(
        "/phd/student/finalSubmitQeApplication",
        { applicationId: selectedApplication.id }
      );
      if (response.data.success) {
        toast.success("Application submitted successfully!");
        setIsPreviewOpen(false);
        await refetchApplications();
      }
    } catch (error) {
      toast.error(
        (error as { response?: { data?: string } }).response?.data ||
          "Failed to submit application"
      );
    }
  };

  const handleApplicationSuccess = async () => {
    const isResubmission = selectedApplication?.status === "resubmit";
    setIsEditOpen(false);
    await refetchExams();
    await refetchApplications();
    toast.success(
      isResubmission
        ? "Application resubmitted successfully!"
        : "Changes saved successfully!"
    );
  };

  if (isLoadingExams || isLoadingApplications) {
    return (
      <div className="min-h-screen w-full bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">PhD Qualifying Exams</h1>
          <p className="mt-2 text-gray-600">
            Apply for qualifying exams and track your applications
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              Available Qualifying Exams
            </CardTitle>
          </CardHeader>
          <CardContent>
            {examsData?.exams?.length ? (
              <div className="space-y-4">
                {examsData.exams.map((exam) => {
                  const isDeadlinePassed =
                    new Date(exam.submissionDeadline) < new Date();
                  const existingApplication =
                    applicationsData?.applications?.find(
                      (app) => app.examId === exam.id
                    );
                  const hasApplied =
                    existingApplication &&
                    existingApplication.status !== "draft" &&
                    existingApplication.status !== "resubmit";

                  return (
                    <div
                      key={exam.id}
                      className="rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold">
                              {exam.examName}
                            </h3>
                            {hasApplied && (
                              <Badge className="bg-green-100 text-green-800">
                                Applied
                              </Badge>
                            )}
                            {isDeadlinePassed && (
                              <Badge className="bg-red-100 text-red-800">
                                Deadline Passed
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {exam.semester.year} - Semester{" "}
                            {exam.semester.semesterNumber}
                          </p>
                          <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                            <div>
                              <span className="font-medium text-gray-700">
                                Registration Deadline:
                              </span>{" "}
                              <span
                                className={
                                  isDeadlinePassed
                                    ? "text-red-600"
                                    : "text-gray-600"
                                }
                              >
                                {formatDate(exam.submissionDeadline)}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">
                                Exam Start:
                              </span>{" "}
                              <span className="text-gray-600">
                                {formatDate(exam.examStartDate)}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">
                                Exam End:
                              </span>{" "}
                              <span className="text-gray-600">
                                {formatDate(exam.examEndDate)}
                              </span>
                            </div>
                            {exam.vivaDate && (
                              <div>
                                <span className="font-medium text-gray-700">
                                  Viva Date:
                                </span>{" "}
                                <span className="text-gray-600">
                                  {formatDate(exam.vivaDate)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="ml-6">
                          <Button
                            onClick={() => handleApplyClick(exam)}
                            disabled={isDeadlinePassed || hasApplied}
                            className={
                              isDeadlinePassed || hasApplied
                                ? "cursor-not-allowed opacity-50"
                                : ""
                            }
                          >
                            {hasApplied ? "Already Applied" : "Apply"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center">
                <div className="mb-4 text-gray-500">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-medium text-gray-900">
                  No Exams Available
                </h3>
                <p className="text-gray-500">
                  No qualifying exams are available at this time.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              Your Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {applicationsData?.applications?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="px-4 py-3 text-left font-medium text-gray-700">
                        Exam
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">
                        Areas
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">
                        Applied On
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {applicationsData.applications.map((application) => {
                      const exam = examsData?.exams.find(
                        (e) => e.id === application.examId
                      );
                      return (
                        <tr
                          key={application.id}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="px-4 py-3">{application.examName}</td>
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              <div className="text-sm">
                                {application.qualifyingArea1}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {application.qualifyingArea2}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {getStatusBadge(application.status)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {formatDate(application.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            {(application.status === "resubmit" ||
                              application.status === "draft") && (
                              <div className="flex flex-col items-start gap-2">
                                {application.status === "resubmit" &&
                                  application.comments && (
                                    <div className="flex items-start rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-600">
                                      <AlertCircle className="mr-2 h-4 w-4 flex-shrink-0" />
                                      <p>
                                        <strong>DRC Comments:</strong>{" "}
                                        {application.comments}
                                      </p>
                                    </div>
                                  )}
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      openEditDialog(exam!, application)
                                    }
                                  >
                                    <Edit className="mr-2 h-4 w-4" />{" "}
                                    {application.status === "resubmit"
                                      ? "Edit & Resubmit"
                                      : "Edit"}
                                  </Button>
                                  {application.status === "draft" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        openPreviewDialog(application)
                                      }
                                    >
                                      <Eye className="mr-2 h-4 w-4" /> Preview
                                      & Submit
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p>No applications submitted yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedApplication ? "Edit Application" : "Apply for " + selectedExam?.examName}
            </DialogTitle>
          </DialogHeader>
          {selectedExam && (
            <QualifyingExamApplication
              exam={selectedExam}
              existingApplication={selectedApplication}
              onSuccess={() => void handleApplicationSuccess()}
              onCancel={() => setIsEditOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview Application</DialogTitle>
            <DialogDescription>
              Review your application details below. If everything is correct,
              you can submit it.
            </DialogDescription>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-4 py-4">
              <p>
                <strong>Qualifying Area 1:</strong>{" "}
                {selectedApplication.qualifyingArea1}
              </p>
              <p>
                <strong>Qualifying Area 2:</strong>{" "}
                {selectedApplication.qualifyingArea2}
              </p>
              <Card>
                <CardHeader>
                  <CardTitle>Uploaded Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {Object.entries(selectedApplication.files)
                      .filter(([, url]) => url)
                      .map(([key, url]) => (
                        <li key={key}>
                          <a
                            href={url!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </a>
                        </li>
                      ))}
                  </ul>
                </CardContent>
              </Card>
              <div className="flex items-start space-x-2 rounded-md border border-blue-200 bg-blue-50 p-4">
                <Checkbox
                  id="supervisor-consent"
                  checked={supervisorConsent}
                  onCheckedChange={(checked) =>
                    setSupervisorConsent(checked === true)
                  }
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="supervisor-consent"
                    className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I confirm that I have consulted with my supervisor
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    You must obtain your supervisor&apos;s consent before
                    submitting this application.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setIsPreviewOpen(false);
                    const exam = examsData?.exams.find(
                      (e) => e.id === selectedApplication.examId
                    );
                    if (exam) {
                      openEditDialog(exam, selectedApplication);
                    }
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  <Edit className="mr-2 h-4 w-4" /> Edit Application
                </Button>
                <Button
                  onClick={() => void handleFinalSubmit()}
                  disabled={!supervisorConsent}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Final Submit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QualifyingExams;
