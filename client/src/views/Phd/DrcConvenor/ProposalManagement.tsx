import React, { useState, useEffect, useMemo } from "react";
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
  Calendar,
  Filter,
  ArrowUpDown,
  Users,
  X,
  Check,
  Trash2,
  RotateCcw,
  Info,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import ProposalSemesterSelector from "@/components/phd/proposal/ProposalSemesterSelector";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import RequestSeminarDetailsDialog from "@/components/phd/proposal/RequestSeminarDetailsDialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ProposalStatusTimeline from "@/components/phd/proposal/ProposalStatusTimeline";
import { phdSchemas } from "lib";
import { getProposalStatusVariant, formatStatus } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProposalSemester {
  id: number;
  semesterId: number;
  studentSubmissionDate: string;
  facultyReviewDate: string;
  drcReviewDate: string;
  dacReviewDate: string;
  semester: {
    year: string;
    semesterNumber: number;
  };
}
interface DacMemberInfo {
  dacMemberEmail: string;
  dacMemberName: string | null;
  dacMember: {
    name: string | null;
    email: string;
  } | null;
}
interface DacReviewInfo {
  dacMemberEmail: string;
  approved: boolean;
}
interface ProposalListItem {
  id: number;
  title: string;
  status: (typeof phdSchemas.phdProposalStatuses)[number];
  updatedAt: string;
  seminarDate: string | null;
  seminarTime: string | null;
  seminarVenue: string | null;
  supervisorEmail: string;
  student: {
    name: string | null;
    email: string;
  };
  supervisor: {
    name: string | null;
    email: string;
  } | null;
  dacMembers: DacMemberInfo[];
  dacReviews: DacReviewInfo[] | null;
  proposalSemester: ProposalSemester | null;
}
type SortField = "studentName" | "updatedAt";
type SortDirection = "asc" | "desc";
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
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>("updatedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [proposalToReject, setProposalToReject] =
    useState<ProposalListItem | null>(null);
  const [rejectComments, setRejectComments] = useState("");
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
    if (semesters && semesters.length > 0 && selectedSemesterId === null) {
      setSelectedSemesterId(semesters[0].id);
    }
  }, [semesters, selectedSemesterId]);
  const {
    data: proposals = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["drc-proposals", selectedSemesterId],
    queryFn: async () => {
      if (selectedSemesterId === null) return [];
      const response = await api.get<ProposalListItem[]>(
        `/phd/proposal/drcConvener/getProposals/${selectedSemesterId}`
      );
      return response.data;
    },
    enabled: selectedSemesterId !== null,
  });
  const rejectProposalMutation = useMutation({
    mutationFn: ({
      proposalId,
      comments,
    }: {
      proposalId: number;
      comments: string;
    }) =>
      api.post(`/phd/proposal/drcConvener/reviewProposal/${proposalId}`, {
        action: "reject",
        comments,
      }),
    onSuccess: (_, variables) => {
      toast.success(`Proposal ${variables.proposalId} rejected successfully.`);
      setProposalToReject(null);
      setRejectComments("");
      void refetch();
    },
    onError: (err) => {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to reject proposal."
      );
    },
  });
  const reenableProposalMutation = useMutation({
    mutationFn: (proposalId: number) =>
      api.post(`/phd/proposal/drcConvener/reenableProposal/${proposalId}`, {}),
    onSuccess: (_, proposalId) => {
      toast.success(`Proposal ${proposalId} re-enabled successfully.`);
      void refetch();
    },
    onError: (err, proposalId) => {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || `Failed to re-enable proposal ${proposalId}.`
      );
    },
  });
  const filteredAndSortedProposals = useMemo(() => {
    let filtered = proposals;
    if (statusFilter.length > 0) {
      filtered = filtered.filter((p) => statusFilter.includes(p.status));
    }
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.student.name?.toLowerCase().includes(lowerSearchTerm) ||
          p.student.email?.toLowerCase().includes(lowerSearchTerm) ||
          p.title.toLowerCase().includes(lowerSearchTerm) ||
          p.supervisor?.name?.toLowerCase().includes(lowerSearchTerm) ||
          p.supervisor?.email?.toLowerCase().includes(lowerSearchTerm)
      );
    }
    return [...filtered].sort((a, b) => {
      let compareA: string | number | Date;
      let compareB: string | number | Date;
      if (sortField === "studentName") {
        compareA = (a.student.name || a.student.email).toLowerCase();
        compareB = (b.student.name || b.student.email).toLowerCase();
      } else {
        compareA = new Date(a.updatedAt);
        compareB = new Date(b.updatedAt);
      }
      if (compareA < compareB) {
        return sortDirection === "asc" ? -1 : 1;
      }
      if (compareA > compareB) {
        return sortDirection === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [proposals, statusFilter, sortField, sortDirection, searchTerm]);
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
      window.URL.revokeObjectURL(url);
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
      window.URL.revokeObjectURL(url);
      toast.success("Packages downloaded.");
      // No need to refetch immediately for download usually
      // void refetch();
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
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to finalize."
      ),
  });
  const handleSelectProposal = (id: number, checked: boolean) => {
    setSelectedProposalIds((prev) =>
      checked ? [...prev, id] : prev.filter((pId) => pId !== id)
    );
  };
  const handleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      const visibleSelectableIds = filteredAndSortedProposals.map((p) => p.id);
      setSelectedProposalIds(visibleSelectableIds);
    } else {
      setSelectedProposalIds([]);
    }
  };
  const getSelectedProposalsByStatus = (statuses: string[]) => {
    return (
      proposals?.filter(
        (p) => selectedProposalIds.includes(p.id) && statuses.includes(p.status)
      ) ?? []
    );
  };
  const openRequestDialog = () => {
    const selected = getSelectedProposalsByStatus([
      "seminar_pending",
      "dac_accepted",
    ]);
    if (selected.length > 0) {
      setProposalsForDialog(selected);
      setIsRequestDialogOpen(true);
    } else {
      toast.info(
        "Please select proposals with 'Seminar Pending' or 'DAC Accepted' status to request details."
      );
    }
  };
  const openGeneralReminderDialog = () => {
    const selected =
      proposals?.filter((p) => selectedProposalIds.includes(p.id)) ?? [];
    if (selected.length === 0) {
      toast.info("Please select at least one proposal to send a reminder.");
      return;
    }
    setProposalsForDialog(selected);
    setIsReminderDialogOpen(true);
  };
  const openReminderDialog = (proposal: ProposalListItem) => {
    setProposalsForDialog([proposal]);
    setIsReminderDialogOpen(true);
  };
  const semesterDeadlines = proposals?.find(
    (p) => p.proposalSemester
  )?.proposalSemester;
  const selectedProposals = useMemo(
    () => proposals.filter((p) => selectedProposalIds.includes(p.id)),
    [proposals, selectedProposalIds]
  );
  const canRequestSeminar = selectedProposals.some((p) =>
    ["seminar_pending", "dac_accepted"].includes(p.status)
  );
  const canDownloadForms = selectedProposals.some((p) =>
    ["finalising_documents", "completed"].includes(p.status)
  );
  const canGenerateNotice = selectedProposals.some((p) =>
    ["finalising_documents", "completed"].includes(p.status)
  );
  const canMarkComplete = selectedProposals.some(
    (p) => p.status === "finalising_documents"
  );
  const canSendGeneralReminder = selectedProposalIds.length > 0;
  const numVisibleProposals = filteredAndSortedProposals.length;
  const numSelectedVisibleProposals = filteredAndSortedProposals.filter((p) =>
    selectedProposalIds.includes(p.id)
  ).length;
  const isAllVisibleSelectedState: boolean | "indeterminate" =
    numVisibleProposals === 0
      ? false
      : numSelectedVisibleProposals === numVisibleProposals
        ? true
        : numSelectedVisibleProposals > 0
          ? "indeterminate"
          : false;
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };
  const allStatuses = phdSchemas.phdProposalStatuses;
  const getDacMemberReviewStatus = (
    memberEmail: string,
    reviews: DacReviewInfo[] | null
  ): "approved" | "reverted" | "pending" => {
    if (!reviews) {
      return "pending";
    }
    const review = reviews.find((r) => r.dacMemberEmail === memberEmail);
    if (!review) {
      return "pending";
    }
    return review.approved ? "approved" : "reverted";
  };
  const startRejectProposal = (proposal: ProposalListItem) => {
    setProposalToReject(proposal);
    setRejectComments("");
  };
  const confirmRejectProposal = () => {
    if (!proposalToReject) return;
    if (!rejectComments.trim()) {
      toast.error("Rejection comments cannot be empty.");
      return;
    }
    rejectProposalMutation.mutate({
      proposalId: proposalToReject.id,
      comments: rejectComments,
    });
  };
  return (
    <div className="space-y-6">
      {/* Header and Timeline */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">PhD Proposal Management</h1>
          <p className="mt-2 text-gray-600">
            Monitor and manage all PhD proposals for the selected semester.
          </p>
        </div>
        <Button asChild>
          <Link to="/phd/drc-convenor/seminar-scheduling">
            <Calendar className="mr-2 h-4 w-4" /> Manage Seminar Schedule
          </Link>
        </Button>
      </div>

      <ProposalStatusTimeline role="drc" />

      {/* Semester Selector and Deadlines */}
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
            onSemesterChange={(id) => {
              setSelectedSemesterId(id);
              setSelectedProposalIds([]); // Reset selection on semester change
              setStatusFilter([]);
              setSearchTerm("");
            }}
          />
        </CardContent>
      </Card>
      {semesterDeadlines && (
        <DeadlinesCard
          deadlines={semesterDeadlines}
          highlight="drcReviewDate"
        />
      )}

      {/* Action Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Action Required for Proposals</AlertTitle>
        <AlertDescription>
          To proceed with proposals marked as DAC ACCEPTED or SEMINAR PENDING,
          please select them from the table below and click the Request Seminar
          Details button. This will send a notification to the supervisor to
          provide seminar details. Use the general reminder for other statuses.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          {/* Filtering and Search UI */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle>All Student Proposals</CardTitle>
              <CardDescription>
                Select proposals to perform bulk actions. Filter and sort as
                needed.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                placeholder="Search student, supervisor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 w-auto flex-grow md:w-[250px]"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-9">
                    <Filter className="mr-2 h-4 w-4" /> Status (
                    {statusFilter.length > 0 ? statusFilter.length : "All"})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-72 w-56 overflow-y-auto">
                  <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {allStatuses.map((status) => (
                    <DropdownMenuCheckboxItem
                      key={status}
                      checked={statusFilter.includes(status)}
                      onCheckedChange={(checked) => {
                        setStatusFilter((prev) =>
                          checked
                            ? [...prev, status]
                            : prev.filter((s) => s !== status)
                        );
                      }}
                      onSelect={(e) => e.preventDefault()}
                    >
                      {formatStatus(status)}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center"
                    onClick={() => setStatusFilter([])}
                    disabled={statusFilter.length === 0}
                  >
                    Clear Filters
                  </Button>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Bulk Action Buttons */}
          <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
            <Button
              onClick={openRequestDialog}
              disabled={!canRequestSeminar}
              size="sm"
              title={
                !canRequestSeminar
                  ? "Select proposals with 'DAC Accepted' or 'Seminar Pending' status"
                  : "Request seminar details from supervisors"
              }
            >
              <Send className="mr-2 h-4 w-4" /> Request Seminar Details (
              {
                getSelectedProposalsByStatus([
                  "seminar_pending",
                  "dac_accepted",
                ]).length
              }
              )
            </Button>
            <Button
              onClick={openGeneralReminderDialog}
              disabled={!canSendGeneralReminder}
              variant="outline"
              size="sm"
              title={
                !canSendGeneralReminder
                  ? "Select at least one proposal"
                  : "Send a general reminder"
              }
            >
              <BellRing className="mr-2 h-4 w-4" /> Send General Reminder (
              {selectedProposalIds.length})
            </Button>
            <Button
              onClick={() =>
                downloadPackagesMutation.mutate(selectedProposalIds)
              }
              disabled={!canDownloadForms || downloadPackagesMutation.isLoading}
              variant="outline"
              size="sm"
              title={
                !canDownloadForms
                  ? "Select proposals with 'Finalising Documents' or 'Completed' status"
                  : "Download forms"
              }
            >
              {downloadPackagesMutation.isLoading ? (
                <LoadingSpinner className="mr-2 h-4 w-4" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}{" "}
              Download Forms (
              {
                getSelectedProposalsByStatus([
                  "finalising_documents",
                  "completed",
                ]).length
              }
              )
            </Button>
            <Button
              onClick={() =>
                finalizeProposalsMutation.mutate(selectedProposalIds)
              }
              disabled={!canMarkComplete || finalizeProposalsMutation.isLoading}
              variant="outline"
              size="sm"
              title={
                !canMarkComplete
                  ? "Select proposals with 'Finalising Documents' status"
                  : "Mark as complete"
              }
            >
              {finalizeProposalsMutation.isLoading ? (
                <LoadingSpinner className="mr-2 h-4 w-4" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}{" "}
              Mark as Complete (
              {getSelectedProposalsByStatus(["finalising_documents"]).length})
            </Button>
            <Button
              onClick={() => downloadNoticeMutation.mutate(selectedProposalIds)}
              disabled={!canGenerateNotice || downloadNoticeMutation.isLoading}
              variant="outline"
              size="sm"
              title={
                !canGenerateNotice
                  ? "Select proposals with 'Finalising Documents' or 'Completed' status"
                  : "Generate seminar notice"
              }
            >
              {downloadNoticeMutation.isLoading ? (
                <LoadingSpinner className="mr-2 h-4 w-4" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}{" "}
              Generate Notice (
              {
                getSelectedProposalsByStatus([
                  "finalising_documents",
                  "completed",
                ]).length
              }
              )
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <TooltipProvider>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      onCheckedChange={handleSelectAll}
                      checked={isAllVisibleSelectedState} // Use calculated state
                      disabled={
                        !proposals || filteredAndSortedProposals.length === 0
                      }
                    />
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("studentName")}
                      className="px-1"
                    >
                      Student <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Supervisor</TableHead>
                  <TableHead>DAC Members</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("updatedAt")}
                      className="px-1"
                    >
                      Status / Updated <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isError ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-red-600"
                    >
                      Error:{" "}
                      {(error as { response: { data: string } })?.response
                        ?.data || "Failed to load proposals"}
                    </TableCell>
                  </TableRow>
                ) : isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <LoadingSpinner />
                    </TableCell>
                  </TableRow>
                ) : filteredAndSortedProposals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="py-8 text-center">
                        <FileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                        <h3 className="mb-2 text-lg font-medium">
                          {selectedSemesterId !== null
                            ? "No proposals match the current filters."
                            : "Please select a semester."}
                        </h3>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedProposals.map((proposal) => {
                    return (
                      <TableRow key={proposal.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedProposalIds.includes(proposal.id)}
                            onCheckedChange={(checked) =>
                              handleSelectProposal(
                                proposal.id,
                                checked as boolean
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {proposal.student.name ?? proposal.student.email}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {proposal.student.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {proposal.supervisor?.name ??
                              proposal.supervisorEmail}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {proposal.supervisor?.email ?? "N/A"}
                          </div>
                        </TableCell>
                        <TableCell>
                          {proposal.dacMembers.length > 0 ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="justify-start px-2 text-left"
                                >
                                  <Users className="mr-2 h-4 w-4 flex-shrink-0" />{" "}
                                  {proposal.dacMembers.length} Members
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <ul className="list-inside space-y-1 px-2 py-1 text-sm">
                                  {proposal.dacMembers.map((m) => {
                                    const reviewStatus =
                                      getDacMemberReviewStatus(
                                        m.dacMemberEmail,
                                        proposal.dacReviews
                                      );
                                    return (
                                      <li
                                        key={m.dacMemberEmail}
                                        className="flex items-center gap-2"
                                      >
                                        {reviewStatus === "approved" && (
                                          <Check className="h-4 w-4 text-green-500" />
                                        )}
                                        {reviewStatus === "reverted" && (
                                          <X className="h-4 w-4 text-red-500" />
                                        )}
                                        {reviewStatus === "pending" && (
                                          <Clock className="h-4 w-4 text-gray-400" />
                                        )}
                                        <span>
                                          {m.dacMember?.name ??
                                            m.dacMemberName ??
                                            m.dacMemberEmail}
                                        </span>
                                      </li>
                                    );
                                  })}
                                </ul>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              N/A
                            </span>
                          )}
                        </TableCell>

                        <TableCell>
                          {proposal.status === "finalising_documents" &&
                          proposal.seminarDate ? (
                            <>
                              <Badge
                                className={getProposalStatusVariant(
                                  proposal.status
                                )}
                              >
                                {formatStatus(proposal.status)}
                              </Badge>
                              <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                                <p>
                                  {new Date(
                                    proposal.seminarDate
                                  ).toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </p>
                                <p>{proposal.seminarTime}</p>
                                <p className="font-medium">
                                  {proposal.seminarVenue}
                                </p>
                              </div>
                            </>
                          ) : (
                            <>
                              <Badge
                                className={getProposalStatusVariant(
                                  proposal.status
                                )}
                              >
                                {formatStatus(proposal.status)}
                              </Badge>
                              <div className="mt-1 text-xs text-muted-foreground">
                                {new Date(
                                  proposal.updatedAt
                                ).toLocaleDateString()}
                              </div>
                            </>
                          )}
                        </TableCell>
                        <TableCell className="flex justify-end gap-1 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              navigate(
                                `/phd/drc-convenor/proposal-management/${proposal.id}`
                              )
                            }
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {(proposal.status === "seminar_pending" ||
                            proposal.status === "dac_accepted") && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openReminderDialog(proposal)}
                              title="Send Seminar Details Reminder"
                            >
                              <BellRing className="h-4 w-4" />
                            </Button>
                          )}
                          {/* Reject Button: Show if not already rejected, completed, or deleted */}
                          {!phdSchemas.inactivePhdProposalStatuses.includes(
                            proposal.status
                          ) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => startRejectProposal(proposal)}
                              title="Reject Proposal"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                          {/* Re-enable Button: Show only if rejected */}
                          {proposal.status === "rejected" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-green-600 hover:text-green-700"
                              onClick={() =>
                                reenableProposalMutation.mutate(proposal.id)
                              }
                              title="Re-enable Proposal"
                              disabled={reenableProposalMutation.isLoading}
                            >
                              {reenableProposalMutation.isLoading && (
                                <LoadingSpinner className="h-4 w-4" />
                              )}
                              {!reenableProposalMutation.isLoading && (
                                <RotateCcw className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TooltipProvider>
        </CardContent>
      </Card>

      {/* Dialogs */}
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
          onSuccess={() => {
            void refetch();
          }}
        />
      )}

      {/* Rejection Confirmation Dialog */}
      <AlertDialog
        open={!!proposalToReject}
        onOpenChange={(open) => {
          if (!open) {
            setProposalToReject(null);
            setRejectComments("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Reject Proposal: {proposalToReject?.title}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action will mark the proposal as rejected and notify the
              student and supervisor. Please provide clear comments for the
              rejection. This action can be reversed using the 'Re-enable'
              button later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="reject-comments">
              Rejection Comments (Required)
            </Label>
            <Input
              id="reject-comments"
              value={rejectComments}
              onChange={(e) => setRejectComments(e.target.value)}
              placeholder="Reason for rejection..."
              // Basic validation visualization
              className={
                !rejectComments.trim() && rejectProposalMutation.isError
                  ? "border-destructive"
                  : ""
              }
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setProposalToReject(null);
                setRejectComments("");
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRejectProposal}
              disabled={
                !rejectComments.trim() || rejectProposalMutation.isLoading
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {rejectProposalMutation.isLoading && (
                <LoadingSpinner className="mr-2 h-4 w-4" />
              )}
              Confirm Rejection
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DrcProposalManagement;
