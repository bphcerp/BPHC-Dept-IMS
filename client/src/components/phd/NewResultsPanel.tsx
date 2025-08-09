import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import api from "@/lib/axios-instance";
import { toast } from "sonner";

interface Application {
  applicationId: number;
  studentName: string;
  studentEmail: string;
  qualifyingArea1: string;
  qualifyingArea2: string;
  attemptNumber: number;
  results: { subArea: string; passed: boolean | null; comments: string }[];
}

interface ExamResult {
  applicationId: number;
  subAreaId: number;
  passed: boolean;
  comments?: string;
}

interface SubArea {
  id: number;
  subarea: string;
}

interface NewResultsPanelProps {
  selectedExamEventId: number | null;
}

export const NewResultsPanel: React.FC<NewResultsPanelProps> = ({
  selectedExamEventId,
}) => {
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const queryClient = useQueryClient();

  const { data: applications, isLoading: loadingApplications } = useQuery<
    Application[]
  >({
    queryKey: ["exam-event-applications", selectedExamEventId],
    queryFn: async () => {
      if (!selectedExamEventId) return [];
      const response = await api.get(
        `/phd/drcMember/exam-events/applications/${selectedExamEventId}`,
      );
      return response.data.applications;
    },
    enabled: !!selectedExamEventId,
  });

  const { data: subAreas } = useQuery<SubArea[]>({
    queryKey: ["phd-sub-areas"],
    queryFn: async () => {
      const response = await api.get("/phd/staff/sub-areas");
      return response.data.subAreas;
    },
  });

    const subAreaMap = useMemo(() => {
        const map = new Map<string, number>();
        subAreas?.forEach(area => map.set(area.subarea, area.id));
        return map;
    }, [subAreas]);

  const submitResultsMutation = useMutation({
    mutationFn: async (results: ExamResult[]) => {
      await api.post("/phd/drcMember/applications/results", { results });
    },
    onSuccess: () => {
      toast.success("Exam results submitted successfully");
      setExamResults([]);
      queryClient.invalidateQueries({
          queryKey: ["exam-event-applications", selectedExamEventId],
      });
    },
    onError: () => {
      toast.error("Failed to submit exam results");
    },
  });

  const handleResultChange = (
    applicationId: number,
    subAreaName: string,
    field: "passed" | "comments",
    value: boolean | string,
  ) => {
    const subAreaId = subAreaMap.get(subAreaName);
    if (!subAreaId) return;

    setExamResults((prev) => {
        const existingIndex = prev.findIndex(
            (result) => result.applicationId === applicationId && result.subAreaId === subAreaId
        );

        if (existingIndex >= 0) {
            const updated = [...prev];
            const newResult = { ...updated[existingIndex] };
            if (field === 'passed') {
                newResult.passed = value as boolean;
            } else {
                newResult.comments = value as string;
            }
            updated[existingIndex] = newResult;
            return updated;
        } else {
            const existingApplicationResult = applications
                ?.find(app => app.applicationId === applicationId)
                ?.results.find(res => res.subArea === subAreaName);

            const newResult: ExamResult = {
                applicationId,
                subAreaId,
                passed: field === 'passed' ? (value as boolean) : (existingApplicationResult?.passed ?? true),
                comments: field === 'comments' ? (value as string) : existingApplicationResult?.comments
            };
            return [...prev, newResult];
        }
    });
  };

  const getCurrentResult = (applicationId: number, subAreaName: string) => {
    const subAreaId = subAreaMap.get(subAreaName);
    if (!subAreaId) return { passed: null, comments: "" };
    
    // Check local state first
    const localResult = examResults.find(
      (r) => r.applicationId === applicationId && r.subAreaId === subAreaId
    );
    if (localResult) {
        return {
            passed: localResult.passed,
            comments: localResult.comments || "",
        };
    }

    // Fallback to initial data from query
    const initialResult = applications
        ?.find(app => app.applicationId === applicationId)
        ?.results.find(res => res.subArea === subAreaName);
    
    return {
      passed: initialResult?.passed ?? null,
      comments: initialResult?.comments || "",
    };
  };

  const handleSubmitResults = () => {
    if (examResults.length === 0) {
      toast.error("Please enter results for at least one student");
      return;
    }
    submitResultsMutation.mutate(examResults);
  };

  if (!selectedExamEventId) {
    return (
      <Alert>
        <AlertDescription>
          Please select an exam event from the Applications tab to manage results.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Exam Results</CardTitle>
            <Button
              onClick={handleSubmitResults}
              disabled={submitResultsMutation.isLoading || examResults.length === 0}
            >
              {submitResultsMutation.isLoading
                ? "Saving..."
                : "Save All Results"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingApplications ? (
            <div className="py-8 text-center">Loading applications...</div>
          ) : !applications || applications.length === 0 ? (
            <div className="py-8 text-center">
              <p>No applications found for this exam event.</p>
              <p className="text-sm text-muted-foreground">
                Students need to submit applications first.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Attempt</TableHead>
                  <TableHead>Area 1 Result</TableHead>
                  <TableHead>Area 1 Comments</TableHead>
                  <TableHead>Area 2 Result</TableHead>
                  <TableHead>Area 2 Comments</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((application) => {
                  const area1Result = getCurrentResult(application.applicationId, application.qualifyingArea1);
                  const area2Result = getCurrentResult(application.applicationId, application.qualifyingArea2);
                  
                  return (
                  <TableRow key={application.applicationId}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {application.studentName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {application.studentEmail}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        Attempt {application.attemptNumber}
                      </span>
                    </TableCell>
                    {/* Area 1 */}
                    <TableCell>
                      <Select
                        value={
                          area1Result.passed === null ? "" : String(area1Result.passed)
                        }
                        onValueChange={(value) =>
                          handleResultChange(
                            application.applicationId,
                            application.qualifyingArea1,
                            "passed",
                            value === "true",
                          )
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Result" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Pass</SelectItem>
                          <SelectItem value="false">Fail</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Textarea
                        placeholder="Comments for Area 1"
                        value={area1Result.comments}
                        onChange={(e) =>
                          handleResultChange(
                            application.applicationId,
                            application.qualifyingArea1,
                            "comments",
                            e.target.value,
                          )
                        }
                        className="min-h-[60px]"
                      />
                    </TableCell>
                    {/* Area 2 */}
                    <TableCell>
                      <Select
                         value={
                            area2Result.passed === null ? "" : String(area2Result.passed)
                          }
                        onValueChange={(value) =>
                          handleResultChange(
                            application.applicationId,
                            application.qualifyingArea2,
                            "passed",
                            value === "true",
                          )
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Result" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Pass</SelectItem>
                          <SelectItem value="false">Fail</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Textarea
                        placeholder="Comments for Area 2"
                        value={area2Result.comments}
                        onChange={(e) =>
                          handleResultChange(
                            application.applicationId,
                            application.qualifyingArea2,
                            "comments",
                            e.target.value,
                          )
                        }
                        className="min-h-[60px]"
                      />
                    </TableCell>
                  </TableRow>
                )})}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};