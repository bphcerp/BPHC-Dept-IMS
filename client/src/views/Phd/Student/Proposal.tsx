import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
} from "@/components/ui/dialog";
import {
  FileText,
  Plus,
  AlertTriangle,
  CalendarCheck,
  Info,
  Clock,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StudentProposalForm } from "@/components/phd/proposal/StudentProposalForm";
import { cn } from "@/lib/utils";

interface ProposalSemester {
  id: number;
  semesterId: number;
  studentSubmissionDate: string;
  facultyReviewDate: string;
  drcReviewDate: string;
  dacReviewDate: string;
}

interface Proposal {
  id: number;
  title: string;
  status: string;
  updatedAt: string;
  active: boolean;
  comments?: string | null;
  seminarDate?: string | null;
  seminarTime?: string | null;
  seminarVenue?: string | null;
}

const DeadlinesCard = ({
  deadlines,
  highlight,
}: {
  deadlines: ProposalSemester;
  highlight: keyof ProposalSemester;
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

  return (
    <Card className="bg-muted/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4" />
          Current Proposal Deadlines
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
        {Object.entries(deadlineLabels).map(([key, label]) => (
          <div
            key={key}
            className={cn(
              "rounded-lg border p-3 transition-all",
              highlight === key
                ? "border-primary bg-primary/10 shadow-md"
                : "bg-background"
            )}
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
  const [proposalToResubmit, setProposalToResubmit] = useState<Proposal | null>(
    null
  );

  const { data: eligibility, isLoading: isLoadingEligibility } = useQuery<{
    isEligible: boolean;
    qualificationDate: string | null;
  }>({
    queryKey: ["proposal-eligibility"],
    queryFn: async () => {
      const res = await api.get("/phd/student/getProposalEligibility");
      return res.data;
    },
  });

  const { data: proposalData, refetch } = useQuery<{
    proposals: Proposal[];
    canApply: boolean;
  }>({
    queryKey: ["student-proposals"],
    queryFn: async () => {
      const response = await api.get("/phd/proposal/student/getProposals");
      return response.data;
    },
    enabled: !!eligibility?.isEligible,
  });

  const { data: deadlineData } = useQuery<{ deadlines: ProposalSemester[] }>({
    queryKey: ["active-proposal-deadlines"],
    queryFn: async () => {
      const res = await api.get("/phd/student/getProposalDeadlines");
      return res.data;
    },
    enabled: !!eligibility?.isEligible,
  });

  const openResubmitDialog = (proposal: Proposal) => {
    setProposalToResubmit(proposal);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setProposalToResubmit(null);
    void refetch();
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">PhD Proposal</h1>
          <p className="mt-2 text-gray-600">
            Manage your PhD proposal submission.
          </p>
        </div>
        {eligibility?.isEligible && proposalData?.canApply && (
          <Button
            onClick={() => {
              setProposalToResubmit(null);
              setIsFormOpen(true);
            }}
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
            Since you haven't passed your qualifying exam yet, you are not
            allowed to fill the form.
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
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Qualification Date Missing</AlertTitle>
              <AlertDescription>
                Your qualification date has not been set. Please contact the DRC
                Convenor to get it updated.
              </AlertDescription>
            </Alert>
          )}
        </>
      )}

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
                        {proposalData?.canApply
                          ? "Click the button above to start your application."
                          : "You currently have an active proposal in progress."}
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
                        <Badge>
                          {p.status.replace(/_/g, " ").toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(p.updatedAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {[
                          "supervisor_revert",
                          "drc_revert",
                          "dac_revert",
                        ].includes(p.status) && (
                          <Button
                            size="sm"
                            onClick={() => openResubmitDialog(p)}
                          >
                            Resubmit
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                    {p.comments && (
                      <TableRow>
                        <TableCell colSpan={4}>
                          <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Feedback/Comments</AlertTitle>
                            <AlertDescription>{p.comments}</AlertDescription>
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
                              Your seminar is tentatively scheduled for{" "}
                              <strong>
                                {new Date(p.seminarDate).toLocaleDateString()}
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
              {proposalToResubmit
                ? "Resubmit Proposal"
                : "New Proposal Application"}
            </DialogTitle>
          </DialogHeader>
          <StudentProposalForm
            proposalId={proposalToResubmit?.id}
            onSuccess={handleFormSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default StudentProposal;
