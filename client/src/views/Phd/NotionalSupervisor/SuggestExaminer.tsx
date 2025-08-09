// client/src/views/Phd/Supervisor/SuggestExaminer.tsx

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/spinner";
import { SuggestExaminersDialog } from "@/components/phd/SuggestExaminersDialog";
import { toast } from "sonner";

// Define the structure of a pending suggestion
interface PendingSuggestion {
  suggestionRequestId: number;
  studentName: string;
  qualifyingArea1: string;
  qualifyingArea2: string;
  examEventName: string;
}

const SuggestExaminerPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedSuggestion, setSelectedSuggestion] = useState<PendingSuggestion | null>(null);

  // Fetch the list of pending suggestions for the logged-in supervisor
  const { data, isLoading } = useQuery<{ pendingRequests: PendingSuggestion[] }>({
    queryKey: ['pending-examiner-suggestions'],
    queryFn: async () => {
      const response = await api.get('/phd/supervisor/pending-suggestions');
      return response.data;
    },
    refetchOnWindowFocus: false,
  });

  const handleOpenDialog = (suggestion: PendingSuggestion) => {
    setSelectedSuggestion(suggestion);
  };

  const handleCloseDialog = () => {
    setSelectedSuggestion(null);
  };

  const handleSuccess = () => {
    toast.success("Suggestions submitted successfully!");
    handleCloseDialog();
    // Refetch the list to show the updated status
    queryClient.invalidateQueries({ queryKey: ['pending-examiner-suggestions'] });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pending Examiner Suggestions</CardTitle>
          <CardDescription>
            Please provide examiner suggestions for the following students for their qualifying exams.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : !data?.pendingRequests || data.pendingRequests.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              You have no pending requests for examiner suggestions.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Exam Event</TableHead>
                  <TableHead>Qualifying Areas</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.pendingRequests.map((req) => (
                  <TableRow key={req.suggestionRequestId}>
                    <TableCell className="font-medium">{req.studentName}</TableCell>
                    <TableCell>{req.examEventName}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>1. {req.qualifyingArea1}</span>
                        <span>2. {req.qualifyingArea2}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => handleOpenDialog(req)}>
                        Submit Suggestions
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* This dialog will open when a suggestion is selected */}
      <SuggestExaminersDialog
        suggestion={selectedSuggestion}
        isOpen={!!selectedSuggestion}
        onClose={handleCloseDialog}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default SuggestExaminerPage;