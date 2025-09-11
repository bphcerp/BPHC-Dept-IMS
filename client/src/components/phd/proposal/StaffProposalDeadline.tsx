import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { LoadingSpinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Edit } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Semester {
  id: number;
  year: string;
  semesterNumber: number;
}

interface ProposalDeadline {
  id: number;
  studentSubmissionDate: string;
  facultyReviewDate: string;
  drcReviewDate: string;
  dacReviewDate: string;
}

const DeadlineForm = ({
  currentSemesterId,
  onSuccess,
  deadlineToEdit,
}: {
  currentSemesterId: number;
  onSuccess: () => void;
  deadlineToEdit?: ProposalDeadline | null;
}) => {
  const queryClient = useQueryClient();
  const [deadlines, setDeadlines] = useState({
    studentSubmissionDate: "",
    facultyReviewDate: "",
    drcReviewDate: "",
    dacReviewDate: "",
  });

  useEffect(() => {
    if (deadlineToEdit) {
      const format = (dateStr: string) =>
        dateStr ? new Date(dateStr).toISOString().slice(0, 16) : "";
      setDeadlines({
        studentSubmissionDate: format(deadlineToEdit.studentSubmissionDate),
        facultyReviewDate: format(deadlineToEdit.facultyReviewDate),
        drcReviewDate: format(deadlineToEdit.drcReviewDate),
        dacReviewDate: format(deadlineToEdit.dacReviewDate),
      });
    } else {
      setDeadlines({
        studentSubmissionDate: "",
        facultyReviewDate: "",
        drcReviewDate: "",
        dacReviewDate: "",
      });
    }
  }, [deadlineToEdit]);

  const mutation = useMutation({
    mutationFn: (
      newDeadlines: { id?: number; semesterId: number } & typeof deadlines
    ) => api.post("/phd/staff/updateProposalDeadline", newDeadlines),
    onSuccess: () => {
      toast.success(
        `Deadlines ${deadlineToEdit ? "updated" : "created"} successfully!`
      );
      void queryClient.invalidateQueries({
        queryKey: ["proposal-deadlines", currentSemesterId],
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to update deadlines."
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.values(deadlines).some((date) => !date)) {
      toast.error("Please fill in all deadline dates.");
      return;
    }
    mutation.mutate({
      id: deadlineToEdit?.id,
      semesterId: currentSemesterId,
      ...deadlines,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDeadlines((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="studentSubmissionDate">
            Student Submission Deadline
          </Label>
          <Input
            id="studentSubmissionDate"
            type="datetime-local"
            value={deadlines.studentSubmissionDate}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="facultyReviewDate">Faculty Review Deadline</Label>
          <Input
            id="facultyReviewDate"
            type="datetime-local"
            value={deadlines.facultyReviewDate}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="drcReviewDate">DRC Review Deadline</Label>
          <Input
            id="drcReviewDate"
            type="datetime-local"
            value={deadlines.drcReviewDate}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dacReviewDate">DAC Review Deadline</Label>
          <Input
            id="dacReviewDate"
            type="datetime-local"
            value={deadlines.dacReviewDate}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>
      <Button type="submit" disabled={mutation.isLoading}>
        {mutation.isLoading ? (
          <LoadingSpinner />
        ) : deadlineToEdit ? (
          "Update Deadlines"
        ) : (
          "Save Deadlines"
        )}
      </Button>
    </form>
  );
};

const StaffProposalDeadline: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDeadline, setEditingDeadline] =
    useState<ProposalDeadline | null>(null);

  const { data: currentSemesterData, isLoading: isLoadingCurrentSemester } =
    useQuery({
      queryKey: ["current-phd-semester"],
      queryFn: async () => {
        const response = await api.get<{ semester: Semester }>(
          "/phd/staff/getLatestSem"
        );
        return response.data;
      },
    });
  const currentSemesterId = currentSemesterData?.semester?.id;

  const { data: deadlinesData } = useQuery<{ deadlines: ProposalDeadline[] }>({
    queryKey: ["proposal-deadlines", currentSemesterId],
    queryFn: async () => {
      if (!currentSemesterId) return { deadlines: [] };
      const response = await api.get(
        `/phd/staff/proposalDeadlines/${currentSemesterId}`
      );
      return response.data;
    },
    enabled: !!currentSemesterId,
  });

  const handleEdit = (deadline: ProposalDeadline) => {
    setEditingDeadline(deadline);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingDeadline(null);
    setIsDialogOpen(true);
  };

  if (isLoadingCurrentSemester) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (!currentSemesterData?.semester) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <h3 className="text-lg font-medium text-destructive">
            No Semester Found
          </h3>
          <p className="text-muted-foreground">
            Please configure the current academic semester first.
          </p>
        </CardContent>
      </Card>
    );
  }

  const semester = currentSemesterData.semester;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current Academic Semester</CardTitle>
          <CardDescription>
            Deadlines will be set for: {semester.year} - Semester{" "}
            {semester.semesterNumber}
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Proposal Deadline Cycles</CardTitle>
            <CardDescription>
              Manage deadlines for the current semester.
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAdd}>
                <Plus className="mr-2 h-4 w-4" /> Add New Cycle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingDeadline ? "Edit" : "Create"} Deadline Cycle
                </DialogTitle>
              </DialogHeader>
              <DeadlineForm
                currentSemesterId={semester.id}
                onSuccess={() => setIsDialogOpen(false)}
                deadlineToEdit={editingDeadline}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Deadline</TableHead>
                <TableHead>Supervisor Deadline</TableHead>
                <TableHead>DRC Deadline</TableHead>
                <TableHead>DAC Deadline</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deadlinesData?.deadlines &&
              deadlinesData.deadlines.length > 0 ? (
                deadlinesData.deadlines.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      {new Date(d.studentSubmissionDate).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {new Date(d.facultyReviewDate).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {new Date(d.drcReviewDate).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {new Date(d.dacReviewDate).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {new Date(d.studentSubmissionDate) > new Date() ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Expired</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(d)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No deadline cycles found for this semester.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffProposalDeadline;
