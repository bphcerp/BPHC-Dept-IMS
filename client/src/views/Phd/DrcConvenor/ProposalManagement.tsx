import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { FileText, Eye, Clock, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProposalSemesterSelector from "@/components/phd/proposal/ProposalSemesterSelector";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";

interface ProposalSemester {
  id: number;
  semesterId: number;
  studentSubmissionDate: string;
  facultyReviewDate: string;
  drcReviewDate: string;
  dacReviewDate: string;
}
interface ProposalListItem {
  id: number;
  title: string;
  status: string;
  updatedAt: string;
  student: { name: string | null; email: string };
  proposalSemester: ProposalSemester | null;
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
    studentSubmissionDate: "Student Submission",
    facultyReviewDate: "Supervisor Review",
    drcReviewDate: "DRC Review",
    dacReviewDate: "DAC Review",
  };
  return (
    <Card className="mb-6 bg-muted/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4" /> Semester Deadlines
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
        {Object.entries(deadlineLabels).map(([key, label]) => (
          <div
            key={key}
            className={cn(
              "rounded-lg border p-3",
              highlight === key
                ? "border-primary bg-primary/10"
                : "bg-background"
            )}
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
  const {
    data: proposals,
    isLoading,
    isError,
    error,
  } = useQuery<ProposalListItem[]>({
    queryKey: ["drc-proposals", selectedSemesterId],
    queryFn: async () => {
      const response = await api.get(
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
  const handleSelectProposal = (id: number, checked: boolean) => {
    setSelectedProposalIds((prev) =>
      checked ? [...prev, id] : prev.filter((pId) => pId !== id)
    );
  };
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const noticeReadyIds =
        proposals
          ?.filter((p) => ["finalising", "formalising"].includes(p.status))
          .map((p) => p.id) ?? [];
      setSelectedProposalIds(noticeReadyIds);
    } else {
      setSelectedProposalIds([]);
    }
  };
  const semesterDeadlines = proposals?.[0]?.proposalSemester;
  const proposalsReadyForNotice = proposals?.filter((p) =>
    ["finalising", "formalising"].includes(p.status)
  );
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
            Please select a semester to view its proposals.
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>All Student Proposals</CardTitle>
            <CardDescription>
              Select proposals with status &quot;FINALISING&quot; or
              &quot;FORMALISING&quot; to generate a notice.
            </CardDescription>
          </div>
          <Button
            onClick={() => downloadNoticeMutation.mutate(selectedProposalIds)}
            disabled={
              selectedProposalIds.length === 0 ||
              downloadNoticeMutation.isLoading
            }
          >
            <Download className="mr-2 h-4 w-4" /> Download Notice(
            {selectedProposalIds.length})
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    onCheckedChange={handleSelectAll}
                    checked={
                      proposalsReadyForNotice?.length
                        ? selectedProposalIds.length ===
                          proposalsReadyForNotice.length
                        : false
                    }
                    disabled={
                      !proposalsReadyForNotice ||
                      proposalsReadyForNotice.length === 0
                    }
                  />
                </TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Title</TableHead>
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
                    Error:{" "}
                    {(error as any)?.response?.data?.message ||
                      "Failed to load proposals"}
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
                          !["finalising", "formalising"].includes(
                            proposal.status
                          )
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
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          navigate(
                            `/phd/drc-convenor/proposal-management/${proposal.id}`
                          )
                        }
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
export default DrcProposalManagement;
