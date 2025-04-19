import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import SuggestDacMembers, { Student } from "@/components/phd/SuggestDacMembers";
import ProposalDocumentsModal from "@/components/phd/ProposalDocumentsModal";
import ProposalReviewDialog from "@/components/phd/ProposalReviewDialog";

// Define a more precise type for proposal documents
interface ProposalDocument {
  id: number;
  fieldName: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

// Response interface
export interface SupervisedStudentsResponse {
  success: boolean;
  students: StudentWithProposalDocuments[];
}

// Extended Student interface with proposal documents
interface StudentWithProposalDocuments
  extends Omit<Student, "proposalDocuments"> {
  proposalDocuments: ProposalDocument[];
}

const SupervisedStudents: React.FC = () => {
  const [selectedStudent, setSelectedStudent] =
    useState<StudentWithProposalDocuments | null>(null);
  const [showDacSuggestion, setShowDacSuggestion] = useState(false);
  const [showProposalDocuments, setShowProposalDocuments] = useState(false);
  const [showProposalReview, setShowProposalReview] = useState(false);
  const [selectedDocumentBatch, setSelectedDocumentBatch] = useState<
    ProposalDocument[] | null
  >(null);

  const { data, isLoading, refetch } = useQuery<SupervisedStudentsResponse>({
    queryKey: ["phd-supervised-students"] as const,
    queryFn: async () => {
      const response = await api.get<SupervisedStudentsResponse>(
        "/phd/supervisor/getSupervisedStudents"
      );

      // Ensure proper typing and handling of proposal documents
      return {
        ...response.data,
        students: response.data.students.map((student) => ({
          ...student,
          proposalDocuments: Array.isArray(student.proposalDocuments)
            ? student.proposalDocuments.flatMap((doc) =>
                Array.isArray(doc) ? doc : [doc]
              )
            : [],
        })),
      };
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });

  // Convert back to original Student type if needed
  const convertToStudent = (student: StudentWithProposalDocuments): Student => {
    const { proposalDocuments, ...baseStudent } = student;
    return {
      ...baseStudent,
      proposalDocuments: proposalDocuments,
    };
  };

  // Group documents by upload batch (within 1 minute)
  const groupProposalDocuments = (
    documents: ProposalDocument[]
  ): ProposalDocument[][] => {
    const groups: ProposalDocument[][] = [];

    documents.forEach((doc) => {
      const timestamp = new Date(doc.uploadedAt).getTime();

      // Find an existing group within 1 minute
      const existingGroupIndex = groups.findIndex((group) =>
        group.some(
          (existingDoc) =>
            Math.abs(new Date(existingDoc.uploadedAt).getTime() - timestamp) <=
            1 * 60 * 1000
        )
      );

      if (existingGroupIndex !== -1) {
        groups[existingGroupIndex].push(doc);
      } else {
        groups.push([doc]);
      }
    });

    return groups;
  };

  const handleViewDetails = (
    student: StudentWithProposalDocuments,
    documentBatch: ProposalDocument[]
  ) => {
    setSelectedStudent(student);
    setSelectedDocumentBatch(documentBatch);
    setShowProposalDocuments(true);
  };

  const handleCloseDetails = () => {
    setSelectedStudent(null);
    setSelectedDocumentBatch(null);
    setShowProposalDocuments(false);
    void refetch();
  };

  const handleSuggestDacMembers = (student: StudentWithProposalDocuments) => {
    setSelectedStudent(student);
    setShowDacSuggestion(true);
  };

  const handleCloseDacSuggestion = () => {
    setShowDacSuggestion(false);
    setSelectedStudent(null);
    void refetch();
  };

  const handleOpenProposalReview = (student: StudentWithProposalDocuments) => {
    setSelectedStudent(student);
    setShowProposalReview(true);
  };

  const handleCloseProposalReview = () => {
    setSelectedStudent(null);
    setShowProposalReview(false);
    void refetch();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
        <Card className="mx-auto w-full max-w-4xl">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold">
              Supervised Students
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
                <TableRow>
                  <TableCell colSpan={4} className="py-4 text-center">
                    No students under your supervision yet.
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="mx-auto w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            Supervised Students
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
                  // Group documents for this student
                  const documentGroups = groupProposalDocuments(
                    student.proposalDocuments
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
          onClose={handleCloseDetails}
          onReview={() => {
            handleCloseDetails();
            handleOpenProposalReview(selectedStudent);
          }}
        />
      )}

      {selectedStudent && showDacSuggestion && (
        <SuggestDacMembers
          student={convertToStudent(selectedStudent)}
          onClose={handleCloseDacSuggestion}
        />
      )}

      {selectedStudent && showProposalReview && (
        <ProposalReviewDialog
          studentEmail={selectedStudent.email}
          studentName={selectedStudent.name}
          onClose={handleCloseProposalReview}
        />
      )}
    </div>
  );
};

export default SupervisedStudents;
