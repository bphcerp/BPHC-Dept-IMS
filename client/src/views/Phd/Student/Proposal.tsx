import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { LoadingSpinner } from "@/components/ui/spinner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/dialog";
import {
  FileText,
  Plus,
  AlertTriangle,
  CalendarCheck,
  Info,
  Clock,
  Download,
  Eye,
  Edit,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StudentProposalForm } from "@/components/phd/proposal/StudentProposalForm";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import ProposalStatusTimeline from "@/components/phd/proposal/ProposalStatusTimeline.tsx";
import { phdSchemas } from "lib";
import ProposalPreview from "@/components/phd/proposal/ProposalPreview";
import { getProposalStatusVariant, formatStatus } from "@/lib/utils";

interface ProposalSemester {
  id: number;
  studentSubmissionDate: string;
  facultyReviewDate: string;
  drcReviewDate: string;
  dacReviewDate: string;
}

interface DacFeedback {
  approved: boolean;
  comments: string;
  feedbackFileUrl: string | null;
}

interface DacSummary {
  label: string;
  status: "Approved" | "Reverted";
}

interface Proposal {
  id: number;
  title: string;
  status: (typeof phdSchemas.phdProposalStatuses)[number];
  updatedAt: string;
  active: boolean;
  comments?: string | null;
  seminarDate?: string | null;
  seminarTime?: string | null;
  seminarVenue?: string | null;
  proposalSemesterId: number;
  dacFeedback?: DacFeedback[];
  dacSummary?: DacSummary[];
}

const DeadlinesCard = ({
  deadlines,
  highlight,
}: {
  deadlines: ProposalSemester;
  highlight: keyof Omit<ProposalSemester, "id" | "semesterId">;
}) => {
  const deadlineLabels: Record<
    keyof Omit<ProposalSemester, "id" | "semesterId">,
    string
  > = {
    studentSubmissionDate: "Your Submission",
    facultyReviewDate: "Supervisor Review",
    drcReviewDate: "DRC Review",
    dacReviewDate: "DAC Review",
  };
  const deadlineToShow = { [highlight]: deadlineLabels[highlight] };
  return (
    <Card className="mb-6 bg-muted/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4" /> Upcoming Deadline
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 text-sm md:grid-cols-4">
        {Object.entries(deadlineToShow).map(([key, label]) => (
          <div
            key={key}
            className="rounded-lg border border-primary bg-primary/10 p-3 shadow-md transition-all"
          >
            <p className="font-semibold text-muted-foreground">{label}</p>
            <p className="mt-1 font-medium">
              {new Date(
                deadlines[key as keyof ProposalSemester] as string
              ).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

const StudentProposal: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [proposalForForm, setProposalForForm] = useState<any | null>(null);
  const [proposalForPreview, setProposalForPreview] = useState<any | null>(
    null
  );
  const [selectedCycleId, setSelectedCycleId] = useState<string>("");
  const queryClient = useQueryClient();

  const { data: eligibility, isLoading: isLoadingEligibility } = useQuery({
    queryKey: ["proposal-eligibility"],
    queryFn: async () => {
      const res = await api.get<{
        isEligible: boolean;
        qualificationDate: string | null;
      }>("/phd/student/getProposalEligibility");
      return res.data;
    },
  });

  const { data: proposalData, refetch } = useQuery({
    queryKey: ["student-proposals"],
    queryFn: async () => {
      const response = await api.get<{
        proposals: Proposal[];
        canApply: boolean;
      }>("/phd/proposal/student/getProposals");
      return response.data;
    },
    enabled: !!eligibility?.isEligible,
  });

  const { data: deadlineData } = useQuery({
    queryKey: ["active-proposal-deadlines"],
    queryFn: async () => {
      const res = await api.get<{ deadlines: ProposalSemester[] }>(
        "/phd/student/getProposalDeadlines"
      );
      return res.data;
    },
    enabled: !!eligibility?.isEligible,
  });

  const fetchProposalDetailsMutation = useMutation({
    mutationFn: (proposalId: number) =>
      api.get(`/phd/proposal/student/view/${proposalId}`),
    onError: () => {
      toast.error("Failed to fetch proposal details.");
    },
  });

  const finalSubmitMutation = useMutation({
    mutationFn: (formData: FormData) => {
      if (!proposalForPreview?.id) {
        throw new Error("Proposal ID is missing for submission.");
      }
      return api.post(
        `/phd/proposal/student/resubmit/${proposalForPreview.id}`,
        formData
      );
    },
    onSuccess: () => {
      toast.success("Proposal submitted successfully for review!");
      setIsPreviewOpen(false);
      void refetch();
      void queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "An error occurred during submission."
      );
    },
  });

  const openDialog = async (proposal: Proposal, mode: "edit" | "preview") => {
    try {
      const response = await fetchProposalDetailsMutation.mutateAsync(
        proposal.id
      );
      if (response.data) {
        if (mode === "edit") {
          setProposalForForm({
            ...response.data,
            proposalCycleId: proposal.proposalSemesterId,
          });
          setIsFormOpen(true);
        } else {
          setProposalForPreview(response.data);
          setIsPreviewOpen(true);
        }
      }
    } catch (e) {
      // Error handled by mutation onError
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setProposalForForm(null);
    void refetch();
  };

  const handleOpenNewProposalDialog = () => {
    if (!deadlineData?.deadlines || deadlineData.deadlines.length === 0) {
      toast.error("There are no active proposal submission cycles available.");
      return;
    }

    let currentCycleId = "";
    if (deadlineData.deadlines.length === 1) {
      currentCycleId = deadlineData.deadlines[0].id.toString();
    }
    setSelectedCycleId(currentCycleId);
    setProposalForForm({
      proposalCycleId: Number(currentCycleId) || undefined,
    });
    setIsFormOpen(true);
  };

  const handleFinalSubmit = () => {
    if (!proposalForPreview) return;
    const formData = new FormData();
    formData.append("title", proposalForPreview.title);
    formData.append(
      "hasOutsideCoSupervisor",
      String(proposalForPreview.hasOutsideCoSupervisor)
    );
    formData.append("declaration", "true");
    formData.append("submissionType", "final");

    // **FIX**: Filter arrays before stringifying
    const internalEmails =
      proposalForPreview.coSupervisors
        ?.filter((s: any) => !s.coSupervisorName && s.coSupervisorEmail)
        .map((s: any) => s.coSupervisorEmail) || [];

    const externalObjects =
      proposalForPreview.coSupervisors
        ?.filter(
          (s: any) =>
            s.coSupervisorName &&
            s.coSupervisorName.trim() !== "" &&
            s.coSupervisorEmail
        )
        .map((s: any) => ({
          name: s.coSupervisorName,
          email: s.coSupervisorEmail,
        })) || [];

    formData.append("internalCoSupervisors", JSON.stringify(internalEmails));
    formData.append("externalCoSupervisors", JSON.stringify(externalObjects));

    finalSubmitMutation.mutate(formData);
  };

  if (isLoadingEligibility) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <LoadingSpinner />
        <p className="ml-4 text-gray-500">Checking eligibility...</p>
      </div>
    );
  }

  const currentDeadlines = deadlineData?.deadlines[0];
  const isDeadlinePassed = currentDeadlines
    ? new Date(currentDeadlines.studentSubmissionDate) < new Date()
    : true;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">PhD Proposal</h1>
          <p className="mt-2 text-gray-600">
            Manage your PhD proposal submission.
          </p>
        </div>
        {eligibility?.isEligible &&
          proposalData?.canApply &&
          eligibility.qualificationDate && (
            <Button
              onClick={handleOpenNewProposalDialog}
              disabled={isDeadlinePassed}
              title={
                isDeadlinePassed ? "The application deadline has passed." : ""
              }
            >
              <Plus className="mr-2 h-4 w-4" /> Apply for Proposal
            </Button>
          )}
      </div>

      {!eligibility?.isEligible ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Not Eligible for Proposal Submission</AlertTitle>
          <AlertDescription>
            You must pass your qualifying exam before submitting a proposal.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {eligibility.qualificationDate ? (
            <Alert variant="default" className="border-green-200 bg-green-50">
              <CalendarCheck className="h-4 w-4 text-green-700" />
              <AlertTitle className="text-green-800">QE Passed!</AlertTitle>
              <AlertDescription className="text-green-700">
                Congratulations! You passed your qualifying exam on:{" "}
                <strong>
                  {new Date(eligibility.qualificationDate).toLocaleDateString()}
                </strong>
                .
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>
                Action Required: Qualification Date Missing
              </AlertTitle>
              <AlertDescription>
                Your qualification date has not been set by the DRC Convenor
                yet. Proposal submission is disabled until the date is set.
                Please follow up with the DRC Convenor.
              </AlertDescription>
            </Alert>
          )}
        </>
      )}

      {eligibility?.isEligible && <ProposalStatusTimeline role="student" />}

      {eligibility?.isEligible && currentDeadlines && (
        <DeadlinesCard
          deadlines={currentDeadlines}
          highlight="studentSubmissionDate"
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Your Submissions</CardTitle>
          <CardDescription>
            A list of your past and current proposal submissions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!proposalData?.proposals ||
              proposalData.proposals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <div className="py-8 text-center">
                      <FileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-lg font-medium">
                        No Proposals Submitted
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {proposalData?.canApply &&
                        eligibility?.isEligible &&
                        eligibility.qualificationDate
                          ? "Click the button above to start your application."
                          : "You cannot start a new proposal at this time."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                proposalData.proposals.map((p) => (
                  <React.Fragment key={p.id}>
                    <TableRow>
                      <TableCell>{p.title}</TableCell>
                      <TableCell>
                        <Badge className={getProposalStatusVariant(p.status)}>
                          {formatStatus(p.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(p.updatedAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="flex gap-2">
                        {[
                          "draft",
                          "supervisor_revert",
                          "drc_revert",
                          "dac_revert",
                        ].includes(p.status) && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openDialog(p, "edit")}
                              title="Edit Draft"
                              disabled={fetchProposalDetailsMutation.isLoading}
                            >
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => openDialog(p, "preview")}
                              title="Preview and Final Submit"
                              disabled={fetchProposalDetailsMutation.isLoading}
                            >
                              <Eye className="mr-2 h-4 w-4" /> Preview and submit
                            </Button>
                          </>
                        )}
                        {![
                          "draft",
                          "supervisor_revert",
                          "drc_revert",
                          "dac_revert",
                          "draft_expired", // Also block view if expired
                        ].includes(p.status) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDialog(p, "preview")}
                            title="View Details"
                            disabled={fetchProposalDetailsMutation.isLoading}
                          >
                            <Eye className="mr-2 h-4 w-4" /> View
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                    {(p.comments ||
                      (p.dacFeedback && p.dacFeedback.length > 0)) &&
                      [
                        "supervisor_revert",
                        "drc_revert",
                        "dac_revert",
                      ].includes(p.status) && (
                        <TableRow>
                          <TableCell colSpan={4}>
                            <Alert variant="destructive">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertTitle>Feedback & Comments</AlertTitle>
                              <AlertDescription>
                                <div className="space-y-2">
                                  {p.comments && <p>{p.comments}</p>}
                                  {p.dacFeedback?.map((feedback, index) => (
                                    <div
                                      key={index}
                                      className="mt-2 border-t pt-2"
                                    >
                                      <p className="font-semibold">
                                        Feedback from Committee Member:
                                      </p>
                                      <p className="whitespace-pre-wrap">
                                        {feedback.comments}
                                      </p>
                                      {feedback.feedbackFileUrl && (
                                        <Button
                                          asChild
                                          variant="link"
                                          className="h-auto p-0"
                                        >
                                          <a
                                            href={feedback.feedbackFileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                          >
                                            <Download className="mr-2 h-4 w-4" />
                                            Download Feedback Document
                                          </a>
                                        </Button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </AlertDescription>
                            </Alert>
                          </TableCell>
                        </TableRow>
                      )}
                    {p.seminarDate && (
                      <TableRow>
                        <TableCell colSpan={4}>
                          <Alert>
                            <Info className="h-4 w-4" />
                            <AlertTitle>Seminar Details</AlertTitle>
                            <AlertDescription>
                              Your seminar is scheduled for{" "}
                              <strong>
                                {new Date(p.seminarDate).toLocaleDateString(
                                  "en-GB",
                                  {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  }
                                )}
                              </strong>{" "}
                              at <strong>{p.seminarTime}</strong> in{" "}
                              <strong>{p.seminarVenue}</strong>.
                            </AlertDescription>
                          </Alert>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {proposalForForm?.id
                ? "Edit Proposal"
                : "New Proposal Application"}
            </DialogTitle>
            {!proposalForForm?.id &&
              deadlineData &&
              deadlineData.deadlines.length > 1 && (
                <DialogDescription>
                  Select the deadline cycle for this application.
                </DialogDescription>
              )}
          </DialogHeader>
          {!proposalForForm?.id &&
            deadlineData &&
            deadlineData.deadlines.length > 1 && (
              <div className="my-4 space-y-2">
                <Label htmlFor="proposal-cycle">Select Submission Cycle</Label>
                <Select
                  value={selectedCycleId}
                  onValueChange={(value) => {
                    setSelectedCycleId(value);
                    setProposalForForm((prev: any) => ({
                      ...prev,
                      proposalCycleId: Number(value) || undefined,
                    }));
                  }}
                >
                  <SelectTrigger id="proposal-cycle">
                    <SelectValue placeholder="Select a deadline cycle..." />
                  </SelectTrigger>
                  <SelectContent>
                    {deadlineData.deadlines.map((cycle) => (
                      <SelectItem key={cycle.id} value={cycle.id.toString()}>
                        Deadline:{" "}
                        {new Date(
                          cycle.studentSubmissionDate
                        ).toLocaleDateString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!selectedCycleId && (
                  <p className="text-xs text-destructive">
                    Please select a cycle.
                  </p>
                )}
              </div>
            )}
          <StudentProposalForm
            proposalData={proposalForForm}
            onSuccess={handleFormSuccess}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Proposal Preview</DialogTitle>
            <CardDescription>
              {[
                "draft",
                "supervisor_revert",
                "drc_revert",
                "dac_revert",
              ].includes(proposalForPreview?.status ?? "")
                ? 'Review your draft before final submission. To make changes, close this preview and click "Edit".'
                : "Viewing proposal details."}
            </CardDescription>
          </DialogHeader>
          {proposalForPreview && (
            <ProposalPreview
              proposal={proposalForPreview}
              onSubmit={
                [
                  "draft",
                  "supervisor_revert",
                  "drc_revert",
                  "dac_revert",
                ].includes(proposalForPreview?.status)
                  ? handleFinalSubmit
                  : undefined
              }
              isSubmitting={finalSubmitMutation.isLoading}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentProposal;
