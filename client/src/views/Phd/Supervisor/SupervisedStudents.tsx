import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SuggestDacMembers, {
  Student,
} from "@/components/phd/SuggestDacMembers";
import ProposalDocumentsModal from "@/components/phd/ProposalDocumentsModal";
import ProposalReviewDialog from "@/components/phd/ProposalReviewDialog";
import { LoadingSpinner } from "@/components/ui/spinner";
import { SuggestExaminersDialog } from "@/components/phd/SuggestExaminersDialog";

interface ProposalDocument {
  id: number;
  fieldName: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface SupervisedStudentsResponse {
  success: boolean;
  students: StudentWithProposalDocuments[];
}

interface StudentWithProposalDocuments extends Omit<Student, "proposalDocuments"> {
  proposalDocuments: ProposalDocument[] | null;
}

interface PendingSuggestion {
    suggestionRequestId: number;
    studentName: string;
    qualifyingArea1: string;
    qualifyingArea2: string;
    examEventName: string;
}

const SupervisedStudents: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedStudent, setSelectedStudent] = useState<StudentWithProposalDocuments | null>(null);
  const [showDacSuggestion, setShowDacSuggestion] = useState(false);
  const [showProposalDocuments, setShowProposalDocuments] = useState(false);
  const [showProposalReview, setShowProposalReview] = useState(false);
  const [showExaminerSuggestion, setShowExaminerSuggestion] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<PendingSuggestion | null>(null);
  const [selectedDocumentBatch, setSelectedDocumentBatch] = useState<ProposalDocument[] | null>(null);

  const { data, isLoading, refetch } = useQuery<SupervisedStudentsResponse>({
    queryKey: ["phd-supervised-students"] as const,
    queryFn: async () => {
      const response = await api.get<SupervisedStudentsResponse>(
        "/phd/supervisor/getSupervisedStudents",
      );
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });

  const { data: pendingSuggestions, isLoading: loadingSuggestions } = useQuery<{pendingRequests: PendingSuggestion[]}>({
    queryKey: ['pending-examiner-suggestions'],
    queryFn: async () => {
        const response = await api.get('/phd/supervisor/pending-suggestions');
        return response.data;
    },
    refetchOnWindowFocus: false,
  });

  const convertToStudent = (
    student: StudentWithProposalDocuments,
  ): Student => {
    const { proposalDocuments, ...baseStudent } = student;
    return {
      ...baseStudent,
      proposalDocuments: proposalDocuments,
    };
  };

  const groupProposalDocuments = (documents: ProposalDocument[]): ProposalDocument[][] => {
    if (!documents) return [];
    const groups: ProposalDocument[][] = [];
    documents.forEach((doc) => {
      const timestamp = new Date(doc.uploadedAt).getTime();
      const existingGroupIndex = groups.findIndex((group) =>
        group.some(
          (existingDoc) =>
            Math.abs(new Date(existingDoc.uploadedAt).getTime() - timestamp) <=
            1 * 60 * 1000,
        ),
      );
      if (existingGroupIndex !== -1) {
        groups[existingGroupIndex].push(doc);
      } else {
        groups.push([doc]);
      }
    });
    return groups;
  };

  const handleSuggestDacMembers = (student: StudentWithProposalDocuments) => {
    setSelectedStudent(student);
    setShowDacSuggestion(true);
  };
  
  const handleOpenProposalReview = (student: StudentWithProposalDocuments) => {
    setSelectedStudent(student);
    setShowProposalReview(true);
  };
  
  const handleViewDetails = (student: StudentWithProposalDocuments, documentBatch: ProposalDocument[])=>{
    setSelectedStudent(student);
    setSelectedDocumentBatch(documentBatch);
    setShowProposalDocuments(true);
  };

  const closeAllModals = () => {
    setSelectedStudent(null);
    setSelectedDocumentBatch(null);
    setSelectedSuggestion(null);
    setShowDacSuggestion(false);
    setShowProposalDocuments(false);
    setShowProposalReview(false);
    setShowExaminerSuggestion(false);
    refetch();
    queryClient.invalidateQueries({queryKey: ['pending-examiner-suggestions']});
  }


  if (isLoading || loadingSuggestions) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gray-100">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        
        {pendingSuggestions && pendingSuggestions.pendingRequests.length > 0 && (
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">Action Items: Examiner Suggestions</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Exam Event</TableHead>
                                <TableHead>Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pendingSuggestions.pendingRequests.map(req => (
                                <TableRow key={req.suggestionRequestId}>
                                    <TableCell>{req.studentName}</TableCell>
                                    <TableCell>{req.examEventName}</TableCell>
                                    <TableCell>
                                        <Button size="sm" onClick={() => {
                                            setSelectedSuggestion(req);
                                            setShowExaminerSuggestion(true);
                                        }}>
                                            Submit Suggestions
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold">
              Supervised Students (Proposal & DAC)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/3">Name</TableHead>
                  <TableHead className="w-1/3">Email</TableHead>
                  <TableHead className="w-1/6">Proposal Documents</TableHead>
                  <TableHead className="w-1/6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.students && data.students.length > 0 ? (
                  data.students.map((student) => {
                    const documentGroups = groupProposalDocuments(
                      student.proposalDocuments || [],
                    );
                    return (
                      <TableRow key={student.email}>
                        <TableCell className="font-medium">
                          {student.name}
                        </TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>
                          {student.proposalDocuments &&
                          student.proposalDocuments.length > 0 ? (
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-600"
                            >
                              Available ({student.proposalDocuments.length})
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-gray-50 text-gray-600"
                            >
                              Not Available
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {documentGroups.map((batch, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(student, batch)}
                              >
                                Batch {index + 1}
                              </Button>
                            ))}
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleSuggestDacMembers(student)}
                            >
                              Suggest DAC
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center">
                      No students under your supervision yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        {selectedStudent && showProposalDocuments && selectedDocumentBatch && (
          <ProposalDocumentsModal
            student={convertToStudent(selectedStudent)}
            documentBatch={{
              documents: selectedDocumentBatch,
              uploadedAt:
                selectedDocumentBatch[0]?.uploadedAt || new Date().toISOString(),
            }}
            onClose={closeAllModals}
            onReview={() => {
              setShowProposalDocuments(false);
              handleOpenProposalReview(selectedStudent);
            }}
          />
        )}
        
        {selectedStudent && showDacSuggestion && (
          <SuggestDacMembers
            student={convertToStudent(selectedStudent)}
            onClose={closeAllModals}
          />
        )}

        {selectedStudent && showProposalReview && (
          <ProposalReviewDialog
            studentEmail={selectedStudent.email}
            studentName={selectedStudent.name}
            onClose={closeAllModals}
          />
        )}
        
        <SuggestExaminersDialog 
            suggestion={selectedSuggestion}
            isOpen={showExaminerSuggestion}
            onClose={closeAllModals}
            onSuccess={closeAllModals}
        />
      </div>
    </div>
  );
};

export default SupervisedStudents;