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

interface Semester {
  id: number;
  year: string;
  semesterNumber: number;
  startDate: string;
  endDate: string;
}

interface ProposalDeadline {
  studentSubmissionDate: string;
  facultyReviewDate: string;
  drcReviewDate: string;
  dacReviewDate: string;
}

const StaffProposalDeadline: React.FC = () => {
  const queryClient = useQueryClient();
  const [deadlines, setDeadlines] = useState<ProposalDeadline>({
    studentSubmissionDate: "",
    facultyReviewDate: "",
    drcReviewDate: "",
    dacReviewDate: "",
  });

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

  const { data: existingDeadlines } = useQuery<{
    deadlines: ProposalDeadline | null;
  }>({
    queryKey: ["proposal-deadlines", currentSemesterId],
    queryFn: async () => {
      if (!currentSemesterId) return { deadlines: null };
      const response = await api.get(
        `/phd/staff/proposalDeadlines/${currentSemesterId}`
      );
      return response.data;
    },
    enabled: !!currentSemesterId,
  });

  useEffect(() => {
    if (existingDeadlines?.deadlines) {
      const formatDateTimeLocal = (dateString: string) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toISOString().slice(0, 16);
      };
      setDeadlines({
        studentSubmissionDate: formatDateTimeLocal(
          existingDeadlines.deadlines.studentSubmissionDate
        ),
        facultyReviewDate: formatDateTimeLocal(
          existingDeadlines.deadlines.facultyReviewDate
        ),
        drcReviewDate: formatDateTimeLocal(
          existingDeadlines.deadlines.drcReviewDate
        ),
        dacReviewDate: formatDateTimeLocal(
          existingDeadlines.deadlines.dacReviewDate
        ),
      });
    } else {
      setDeadlines({
        studentSubmissionDate: "",
        facultyReviewDate: "",
        drcReviewDate: "",
        dacReviewDate: "",
      });
    }
  }, [existingDeadlines]);

  const mutation = useMutation({
    mutationFn: (newDeadlines: { semesterId: number } & ProposalDeadline) =>
      api.post("/phd/staff/updateProposalDeadline", newDeadlines),
    onSuccess: () => {
      toast.success("Proposal deadlines updated successfully!");
      void queryClient.invalidateQueries({
        queryKey: ["proposal-deadlines", currentSemesterId],
      });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to update deadlines."
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSemesterId) {
      toast.error("No active semester found.");
      return;
    }
    const dates = Object.values(deadlines);
    if (dates.some((date) => !date)) {
      toast.error("Please fill in all deadline dates.");
      return;
    }
    mutation.mutate({ semesterId: currentSemesterId, ...deadlines });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setDeadlines((prev) => ({ ...prev, [id]: value }));
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
            Deadlines will be set for the following semester:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">
              {semester.year} - Semester {semester.semesterNumber}
            </h3>
            <Badge>Latest</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Set Proposal Deadlines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
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
              <div>
                <Label htmlFor="facultyReviewDate">
                  Faculty Review Deadline
                </Label>
                <Input
                  id="facultyReviewDate"
                  type="datetime-local"
                  value={deadlines.facultyReviewDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="drcReviewDate">DRC Review Deadline</Label>
                <Input
                  id="drcReviewDate"
                  type="datetime-local"
                  value={deadlines.drcReviewDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
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
              {mutation.isLoading ? <LoadingSpinner /> : "Save Deadlines"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffProposalDeadline;
