import React, { useState, useMemo, useEffect } from "react";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import api from "@/lib/axios-instance";
import { toast } from "sonner";
import { LoadingSpinner } from "../ui/spinner";

interface SuggestionStatus {
  suggestionRequestId: number;
  studentName: string;
  supervisorName: string;
  supervisorEmail: string;
  status: "Pending" | "Submitted";
  submittedAt?: string;
}

interface SubmittedSuggestion {
  applicationId: number;
  studentName: string;
  qualifyingArea1: string;
  suggestedExaminers1: string[];
  qualifyingArea2: string;
  suggestedExaminers2: string[];
}

interface ExamInTimetable {
    studentName: string;
    studentEmail: string;
    subArea: string;
    examinerName: string;
    examinerEmail: string;
}

interface SubArea {
    id: number;
    subarea: string;
}


interface NewExaminerManagementPanelProps {
  selectedExamEventId: number | null;
}

export const NewExaminerManagementPanel: React.FC<
  NewExaminerManagementPanelProps
> = ({ selectedExamEventId }) => {
  const [timetableDialogOpen, setTimetableDialogOpen] = useState(false);
  const [finalExaminers, setFinalExaminers] = useState<
    Record<string, Record<string, string>>
  >({});
  const queryClient = useQueryClient();

    const { data: subAreas } = useQuery<SubArea[]>({
        queryKey: ["phd-sub-areas-list"],
        queryFn: async () => {
            const response = await api.get("/phd/staff/sub-areas");
            return response.data.subAreas;
        },
    });

    const subAreaMap = useMemo(() => {
        const map = new Map<string, number>();
        if (subAreas) {
            subAreas.forEach(area => map.set(area.subarea, area.id));
        }
        return map;
    }, [subAreas]);


  const { data: suggestionStatuses, isLoading: loadingStatuses } = useQuery<
    SuggestionStatus[]
  >({
    queryKey: ["exam-suggestion-status", selectedExamEventId],
    queryFn: async () => {
      if (!selectedExamEventId) return [];
      const response = await api.get(
        `/phd/drcMember/exam-events/suggestions/${selectedExamEventId}/suggestion-status`,
      );
      return response.data.suggestionStatuses;
    },
    enabled: !!selectedExamEventId,
  });

  const { data: submittedSuggestions, isLoading: loadingSuggestions } = useQuery<
    SubmittedSuggestion[]
  >({
    queryKey: ["exam-submitted-suggestions", selectedExamEventId],
    queryFn: async () => {
      if (!selectedExamEventId) return [];
      const response = await api.get(
        `/phd/drcMember/exam-events/suggestions/${selectedExamEventId}`,
      );
      return response.data.submittedSuggestions;
    },
    enabled: !!selectedExamEventId,
  });

  const {
    data: timetableData,
    isLoading: loadingTimetable,
    refetch: refetchTimetable,
  } = useQuery<{
    schedule: { session1: ExamInTimetable[]; session2: ExamInTimetable[] };
    conflicts?: string[];
  }>({
    queryKey: ["exam-timetable", selectedExamEventId],
    queryFn: async () => {
      if (!selectedExamEventId)
        return { schedule: { session1: [], session2: [] } };
      const response = await api.get(
        `/phd/drcMember/exam-events/schedule/${selectedExamEventId}`,
      );
      return response.data;
    },
    enabled: false, // Only fetch when explicitly told
  });

  const requestSuggestionsMutation = useMutation({
    mutationFn: async () => {
      await api.post(
        `/phd/drcMember/exam-events/suggestions/${selectedExamEventId}/request-suggestions`,
      );
    },
    onSuccess: () => {
      toast.success("Examiner suggestion requests sent to supervisors");
      queryClient.invalidateQueries({queryKey: ["exam-suggestion-status", selectedExamEventId]});
    },
    onError: () => {
      toast.error("Failed to send suggestion requests");
    },
  });

  const sendReminderMutation = useMutation({
    mutationFn: async (suggestionRequestId: number) => {
      await api.post(
        `/phd/drcMember/suggestions/suggestion-requests/${suggestionRequestId}/remind`,
      );
    },
    onSuccess: () => {
      toast.success("Reminder sent successfully");
      queryClient.invalidateQueries({queryKey: ["exam-suggestion-status", selectedExamEventId]});
    },
    onError: () => {
      toast.error("Failed to send reminder");
    },
  });

  const generateTimetableMutation = useMutation({
    mutationFn: async () => {
        if (!selectedExamEventId) throw new Error("Exam Event not selected");
        await api.post(`/phd/drcMember/exam-events/schedule/${selectedExamEventId}`, {
            finalExaminers,
        });
    },
    onSuccess: () => {
        toast.success("Timetable generated successfully");
        queryClient.invalidateQueries({queryKey: ["exam-timetable", selectedExamEventId]});
        handleViewTimetable(); // Open dialog on success
    },
    onError: () => {
        toast.error("Failed to generate timetable");
    },
  });

  const handleExaminerSelection = (
    applicationId: string,
    subAreaId: string,
    examinerEmail: string,
  ) => {
    setFinalExaminers((prev) => ({
      ...prev,
      [applicationId]: {
        ...prev[applicationId],
        [subAreaId]: examinerEmail,
      },
    }));
  };

  const handleViewTimetable = () => {
    refetchTimetable().then(() => {
      setTimetableDialogOpen(true);
    });
  };

  if (!selectedExamEventId) {
    return (
      <Alert>
        <AlertDescription>
          Please select an exam event from the Applications tab to manage
          examiners.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Examiner Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="suggestions" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="suggestions">
                1. Monitor Supervisor Suggestions
              </TabsTrigger>
              <TabsTrigger value="assignment">
                2. Assign Examiners & Generate Timetable
              </TabsTrigger>
            </TabsList>

            <TabsContent value="suggestions" className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">
                  Supervisor Suggestion Progress
                </h3>
                <Button
                  onClick={() => requestSuggestionsMutation.mutate()}
                  disabled={requestSuggestionsMutation.isLoading}
                >
                  {requestSuggestionsMutation.isLoading
                    ? "Sending..."
                    : "Notify All Supervisors"}
                </Button>
              </div>
              {loadingStatuses ? (
                <div className="py-8 text-center">Loading suggestion status...</div>
              ) : !suggestionStatuses || suggestionStatuses.length === 0 ? (
                <div className="py-8 text-center">
                  <p>No supervisor suggestions initiated yet.</p>
                  <p className="text-sm text-muted-foreground">
                    Click "Notify All Supervisors" to begin.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Supervisor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted At</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suggestionStatuses.map((suggestion) => (
                      <TableRow key={suggestion.suggestionRequestId}>
                        <TableCell className="font-medium">
                          {suggestion.studentName}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div>{suggestion.supervisorName}</div>
                            <div className="text-sm text-muted-foreground">
                              {suggestion.supervisorEmail}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              suggestion.status === "Submitted"
                                ? "default"
                                : "destructive"
                            }
                          >
                            {suggestion.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {suggestion.submittedAt
                            ? new Date(suggestion.submittedAt).toLocaleDateString()
                            : "Not submitted"}
                        </TableCell>
                        <TableCell>
                          {suggestion.status === "Pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                sendReminderMutation.mutate(
                                  suggestion.suggestionRequestId,
                                )
                              }
                              disabled={sendReminderMutation.isLoading}
                            >
                              {sendReminderMutation.isLoading ? "Sending..." : "Remind"}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="assignment" className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Assign Final Examiners</h3>
                <div className="space-x-2">
                  <Button onClick={handleViewTimetable} variant="outline">
                    View Timetable
                  </Button>
                  <Button
                    onClick={() => generateTimetableMutation.mutate()}
                    disabled={generateTimetableMutation.isLoading || Object.keys(finalExaminers).length === 0}
                  >
                    {generateTimetableMutation.isLoading
                      ? "Generating..."
                      : "Generate Timetable"}
                  </Button>
                </div>
              </div>
              {loadingSuggestions ? (
                <div className="py-8 text-center">
                  Loading submitted suggestions...
                </div>
              ) : !submittedSuggestions || submittedSuggestions.length === 0 ? (
                <div className="py-8 text-center">
                  <p>No examiner suggestions submitted yet.</p>
                  <p className="text-sm text-muted-foreground">
                    Wait for supervisors to submit their suggestions.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Area 1 & Suggestions</TableHead>
                      <TableHead>Final Examiner 1</TableHead>
                      <TableHead>Area 2 & Suggestions</TableHead>
                      <TableHead>Final Examiner 2</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submittedSuggestions.map((suggestion) => {
                      const subArea1Id = subAreaMap.get(suggestion.qualifyingArea1);
                      const subArea2Id = subAreaMap.get(suggestion.qualifyingArea2);
                      
                      return (
                      <TableRow key={suggestion.applicationId}>
                        <TableCell className="font-medium">
                          {suggestion.studentName}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">
                              {suggestion.qualifyingArea1}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Suggestions:{" "}
                              {suggestion.suggestedExaminers1.join(", ")}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                            {subArea1Id && (
                                <Select
                                    value={finalExaminers[suggestion.applicationId]?.[subArea1Id] || ""}
                                    onValueChange={(value) =>
                                    handleExaminerSelection(
                                        suggestion.applicationId.toString(),
                                        subArea1Id.toString(),
                                        value,
                                    )
                                    }
                                >
                                    <SelectTrigger>
                                    <SelectValue placeholder="Select examiner" />
                                    </SelectTrigger>
                                    <SelectContent>
                                    {suggestion.suggestedExaminers1.map((examiner) => (
                                        <SelectItem key={examiner} value={examiner}>
                                        {examiner}
                                        </SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">
                              {suggestion.qualifyingArea2}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Suggestions:{" "}
                              {suggestion.suggestedExaminers2.join(", ")}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                            {subArea2Id && (
                                <Select
                                    value={finalExaminers[suggestion.applicationId]?.[subArea2Id] || ""}
                                    onValueChange={(value) =>
                                    handleExaminerSelection(
                                        suggestion.applicationId.toString(),
                                        subArea2Id.toString(),
                                        value,
                                    )
                                    }
                                >
                                    <SelectTrigger>
                                    <SelectValue placeholder="Select examiner" />
                                    </SelectTrigger>
                                    <SelectContent>
                                    {suggestion.suggestedExaminers2.map((examiner) => (
                                        <SelectItem key={examiner} value={examiner}>
                                        {examiner}
                                        </SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </TableCell>
                      </TableRow>
                    )})}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={timetableDialogOpen} onOpenChange={setTimetableDialogOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Exam Timetable</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-4">
            {loadingTimetable ? (
              <div className="py-8 text-center"><LoadingSpinner /></div>
            ) : timetableData ? (
              <div className="space-y-6">
                {timetableData.conflicts && timetableData.conflicts.length > 0 && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      <strong>Conflicts detected:</strong>{" "}
                      {timetableData.conflicts.join(", ")}
                    </AlertDescription>
                  </Alert>
                )}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Session 1</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {timetableData.schedule.session1.length === 0 ? (
                        <p className="text-center text-muted-foreground">
                          No exams scheduled
                        </p>
                      ) : (
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Area</TableHead>
                                    <TableHead>Examiner</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {timetableData.schedule.session1.map((exam, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{exam.studentName}</TableCell>
                                        <TableCell>{exam.subArea}</TableCell>
                                        <TableCell>{exam.examinerName}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                         </Table>
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Session 2</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {timetableData.schedule.session2.length === 0 ? (
                        <p className="text-center text-muted-foreground">
                          No exams scheduled
                        </p>
                      ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Area</TableHead>
                                    <TableHead>Examiner</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {timetableData.schedule.session2.map((exam, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{exam.studentName}</TableCell>
                                        <TableCell>{exam.subArea}</TableCell>
                                        <TableCell>{exam.examinerName}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                         </Table>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">No timetable data available</div>
            )}
            <div className="flex justify-end">
              <Button onClick={() => setTimetableDialogOpen(false)}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};