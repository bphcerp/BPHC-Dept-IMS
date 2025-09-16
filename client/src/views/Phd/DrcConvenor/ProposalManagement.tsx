import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  FileText,
  Eye,
  Clock,
  Download,
  Send,
  BellRing,
  CheckCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProposalSemesterSelector from "@/components/phd/proposal/ProposalSemesterSelector";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import RequestSeminarDetailsDialog from "@/components/phd/proposal/RequestSeminarDetailsDialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
interface ProposalSemester {
  id: number;
  semesterId: number;
  studentSubmissionDate: string;
  facultyReviewDate: string;
  drcReviewDate: string;
  dacReviewDate: string;
  semester: { year: string; semesterNumber: number };
}
interface ProposalListItem {
  id: number;
  title: string;
  status: string;
  updatedAt: string;
  supervisorEmail: string;
  student: { name: string | null; email: string };
  proposalSemester: ProposalSemester | null;
}
const DeadlinesCard = ({
  deadlines,
  highlight,
}: {
  deadlines: ProposalSemester;
  highlight: keyof Omit<ProposalSemester, "id" | "semesterId" | "semester">;
}) => {
  const deadlineLabels: Record<
    keyof Omit<ProposalSemester, "id" | "semesterId" | "semester">,
    string
  > = {
    studentSubmissionDate: "Student Submission",
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
            <p className="mt-1">
              {new Date(
                deadlines[key as keyof ProposalSemester] as string
              ).toLocaleDateString()}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
const DrcProposalManagement: React.FC = () => {
  const navigate = useNavigate();
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | null>(
    null
  );
  const [selectedProposalIds, setSelectedProposalIds] = useState<number[]>([]);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  const [proposalsForDialog, setProposalsForDialog] = useState<
    ProposalListItem[]
  >([]);
  const { data: semesters } = useQuery({
    queryKey: ["proposal-semesters"],
    queryFn: async () => {
      const response = await api.get<ProposalSemester[]>(
        "/phd/proposal/getProposalSemesters"
      );
      return response.data;
    },
  });
  useEffect(() => {
    if (semesters && semesters.length > 0 && !selectedSemesterId) {
      setSelectedSemesterId(semesters[0].id);
    }
  }, [semesters, selectedSemesterId]);
  const {
    data: proposals,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["drc-proposals", selectedSemesterId],
    queryFn: async () => {
      const response = await api.get<ProposalListItem[]>(
        `/phd/proposal/drcConvener/getProposals/${selectedSemesterId}`
      );
      return response.data;
    },
    enabled: !!selectedSemesterId,
  });
  const downloadNoticeMutation = useMutation({
    mutationFn: (proposalIds: number[]) =>
      api.post(
        `/phd/proposal/drcConvener/downloadProposalNotice`,
        { proposalIds },
        { responseType: "blob" }
      ),
    onSuccess: (response) => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Seminar_Notice_${new Date().toISOString().split("T")[0]}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success("Seminar notice downloaded successfully.");
    },
    onError: () => toast.error("Failed to download notice."),
  });
  const downloadPackagesMutation = useMutation({
    mutationFn: (proposalIds: number[]) =>
      api.post(
        `/phd/proposal/drcConvener/downloadProposalPackage`,
        { proposalIds },
        { responseType: "blob" }
      ),
    onSuccess: (response) => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `ProposalPackages.zip`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success("Packages downloaded.");
      void refetch();
    },
    onError: () => toast.error("Failed to download packages."),
  });
  const finalizeProposalsMutation = useMutation({
    mutationFn: (proposalIds: number[]) =>
      api.post("/phd/proposal/drcConvener/finalizeProposals", { proposalIds }),
    onSuccess: () => {
      toast.success("Selected proposals have been marked as complete.");
      setSelectedProposalIds([]);
      void refetch();
    },
    onError: (err) =>
      toast.error(
        (err as { response: { data: { message: string } } }).response?.data
          ?.message || "Failed to finalize."
      ),
  });
  const handleSelectProposal = (id: number, checked: boolean) => {
    setSelectedProposalIds((prev) =>
      checked ? [...prev, id] : prev.filter((pId) => pId !== id)
    );
  };
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = proposals?.map((p) => p.id) ?? [];
      setSelectedProposalIds(allIds);
    } else {
      setSelectedProposalIds([]);
    }
  };
  const openRequestDialog = () => {
    const selected =
      proposals?.filter(
        (p) => selectedProposalIds.includes(p.id) && p.status === "dac_accepted"
      ) ?? [];
    if (selected.length > 0) {
      setProposalsForDialog(selected);
      setIsRequestDialogOpen(true);
    } else {
      toast.info(
        "Please select proposals with 'DAC Accepted' status to request details."
      );
    }
  };
  const openReminderDialog = (proposal: ProposalListItem) => {
    setProposalsForDialog([proposal]);
    setIsReminderDialogOpen(true);
  };
  const semesterDeadlines = proposals?.[0]?.proposalSemester;
  const getSelectedProposalsByStatus = (status: string) => {
    return (
      proposals?.filter(
        (p) => selectedProposalIds.includes(p.id) && p.status === status
      ) ?? []
    );
  };
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">PhD Proposal Management</h1>
        <p className="mt-2 text-gray-600">
          Monitor and manage all PhD proposals for the selected semester.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Semester Selection</CardTitle>
          <CardDescription>
            The latest semester is selected by default. You can choose a
            different one to view past proposals.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProposalSemesterSelector
            selectedSemesterId={selectedSemesterId}
            onSemesterChange={setSelectedSemesterId}
          />
        </CardContent>
      </Card>
      {semesterDeadlines && (
        <DeadlinesCard
          deadlines={semesterDeadlines}
          highlight="drcReviewDate"
        />
      )}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Action Required for DAC Accepted Proposals</AlertTitle>
        <AlertDescription>
          To proceed with proposals marked as &apos;DAC ACCEPTED&apos;, please
          select them from the table below and click the &apos;Request
          Details&apos; button. This will send a notification to the supervisor
          to provide seminar details.
        </AlertDescription>
      </Alert>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle>All Student Proposals</CardTitle>
              <CardDescription>
                Select proposals to perform bulk actions.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={openRequestDialog}
                disabled={
                  getSelectedProposalsByStatus("dac_accepted").length === 0
                }
              >
                <Send className="mr-2 h-4 w-4" /> Request Details (
                {getSelectedProposalsByStatus("dac_accepted").length})
              </Button>
              <Button
                onClick={() =>
                  downloadPackagesMutation.mutate(selectedProposalIds)
                }
                disabled={
                  getSelectedProposalsByStatus("finalising").length === 0 ||
                  downloadPackagesMutation.isLoading
                }
              >
                <Download className="mr-2 h-4 w-4" /> Download all forms (
                {getSelectedProposalsByStatus("finalising").length})
              </Button>
              <Button
                onClick={() =>
                  finalizeProposalsMutation.mutate(selectedProposalIds)
                }
                disabled={
                  getSelectedProposalsByStatus("formalising").length === 0 ||
                  finalizeProposalsMutation.isLoading
                }
              >
                <CheckCircle className="mr-2 h-4 w-4" /> Finalize (
                {getSelectedProposalsByStatus("formalising").length})
              </Button>
              <Button
                onClick={() =>
                  downloadNoticeMutation.mutate(selectedProposalIds)
                }
                disabled={
                  selectedProposalIds.length === 0 ||
                  downloadNoticeMutation.isLoading
                }
              >
                <Download className="mr-2 h-4 w-4" /> Sample Notice(
                {selectedProposalIds.length})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    onCheckedChange={handleSelectAll}
                    checked={
                      proposals?.length
                        ? selectedProposalIds.length === proposals.length
                        : false
                    }
                    disabled={!proposals || proposals.length === 0}
                  />
                </TableHead>
                <TableHead>Student</TableHead> <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isError ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-red-600"
                  >
                    Error:
                    {(error as { response: { data: string } })?.response
                      ?.data || "Failed to load proposals"}
                  </TableCell>
                </TableRow>
              ) : isLoading || !proposals || proposals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <div className="py-8 text-center">
                      <FileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                      <h3 className="mb-2 text-lg font-medium">
                        {selectedSemesterId
                          ? "No proposals found for this semester."
                          : "Please select a semester to view proposals."}
                      </h3>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                proposals.map((proposal) => (
                  <TableRow key={proposal.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedProposalIds.includes(proposal.id)}
                        onCheckedChange={(checked) =>
                          handleSelectProposal(proposal.id, checked as boolean)
                        }
                        disabled={
                          proposal.status !== "dac_accepted" &&
                          proposal.status !== "finalising" &&
                          proposal.status !== "formalising"
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{proposal.student.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {proposal.student.email}
                      </div>
                    </TableCell>
                    <TableCell>{proposal.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {proposal.status.replace(/_/g, " ").toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex justify-end gap-2 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          navigate(
                            `/phd/drc-convenor/proposal-management/${proposal.id}`
                          )
                        }
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {proposal.status === "dac_accepted" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openReminderDialog(proposal)}
                        >
                          <BellRing className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {isRequestDialogOpen && (
        <RequestSeminarDetailsDialog
          isOpen={isRequestDialogOpen}
          setIsOpen={setIsRequestDialogOpen}
          proposals={proposalsForDialog}
          type="request"
          onSuccess={() => {
            setSelectedProposalIds([]);
            void refetch();
          }}
        />
      )}
      {isReminderDialogOpen && (
        <RequestSeminarDetailsDialog
          isOpen={isReminderDialogOpen}
          setIsOpen={setIsReminderDialogOpen}
          proposals={proposalsForDialog}
          type="reminder"
          onSuccess={() => void refetch()}
        />
      )}
    </div>
  );
};
export default DrcProposalManagement;
