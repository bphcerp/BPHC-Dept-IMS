import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/spinner";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { phdSchemas } from "lib";

type ApplicationResult = {
  id: number;
  student: { name: string | null; email: string };
  result: "pass" | "fail" | null;
  qualificationDate: string | null;
};

interface ResultsPanelProps {
  selectedExamId: number;
  onBack?: () => void;
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({
  selectedExamId,
  onBack,
}) => {
  const queryClient = useQueryClient();
  const [qualDate, setQualDate] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<
    ApplicationResult["student"] | null
  >(null);

  const {
    data: applications = [],
    isLoading,
    refetch,
  } = useQuery<ApplicationResult[]>({
    queryKey: ["applications-for-results", selectedExamId],
    queryFn: async () => {
      const response = await api.get(
        `/phd/drcMember/getVerifiedApplications/${selectedExamId}`
      );
      return response.data.filter(
        (app: any) => app.examinerAssignmentCount >= 2
      );
    },
    enabled: !!selectedExamId,
  });

  const submitResultMutation = useMutation({
    mutationFn: (data: phdSchemas.SubmitResultBody) =>
      api.post("/phd/drcMember/submitResult", data),
    onSuccess: (_, variables) => {
      toast.success("Result submitted successfully");
      if (variables.result === "pass") {
        toast.info(
          "A To-do has been created to set the student's qualification date."
        );
      }
      void refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to submit result");
    },
  });

  const setQualDateMutation = useMutation({
    mutationFn: (data: phdSchemas.SetQualificationDateBody) =>
      api.post("/phd/drcMember/setQualificationDate", data),
    onSuccess: () => {
      toast.success("Qualification date set successfully");
      setSelectedStudent(null);
      setQualDate("");
      void refetch();
      void queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to set qualification date"
      );
    },
  });

  const handleSetDate = () => {
    if (!selectedStudent || !qualDate) return;
    setQualDateMutation.mutate({
      studentEmail: selectedStudent.email,
      qualificationDate: new Date(qualDate).toISOString(),
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Submit Qualifying Exam Results</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>
                    <div className="font-medium">{app.student.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {app.student.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    {app.result ? (
                      <span
                        className={`font-semibold ${app.result === "pass" ? "text-green-600" : "text-red-600"}`}
                      >
                        {app.result.charAt(0).toUpperCase() +
                          app.result.slice(1)}
                      </span>
                    ) : (
                      "Pending"
                    )}
                  </TableCell>
                  <TableCell className="space-x-2 text-right">
                    {!app.result ? (
                      <>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() =>
                            submitResultMutation.mutate({
                              applicationId: app.id,
                              result: "pass",
                            })
                          }
                          disabled={submitResultMutation.isLoading}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" /> Pass
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            submitResultMutation.mutate({
                              applicationId: app.id,
                              result: "fail",
                            })
                          }
                          disabled={submitResultMutation.isLoading}
                        >
                          <XCircle className="mr-2 h-4 w-4" /> Fail
                        </Button>
                      </>
                    ) : app.result === "pass" ? (
                      app.qualificationDate ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="whitespace-nowrap text-sm text-muted-foreground">
                            {new Date(
                              app.qualificationDate
                            ).toLocaleDateString()}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedStudent(app.student)}
                          >
                            Change
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedStudent(app.student)}
                        >
                          Set Qualification Date
                        </Button>
                      )
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <div className="flex justify-start">
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Examiners
          </Button>
        )}
      </div>
      <Dialog
        open={!!selectedStudent}
        onOpenChange={(isOpen) => !isOpen && setSelectedStudent(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Qualification Date</DialogTitle>
            <DialogDescription>
              Set the official qualification date for{selectedStudent?.name}.
              This action will also complete the corresponding to-do item.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="qualDate">Qualification Date</Label>
            <Input
              id="qualDate"
              type="datetime-local"
              value={qualDate}
              onChange={(e) => setQualDate(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedStudent(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSetDate}
              disabled={setQualDateMutation.isLoading}
            >
              {setQualDateMutation.isLoading && (
                <LoadingSpinner className="mr-2 h-4 w-4" />
              )}
              Set Date
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResultsPanel;
