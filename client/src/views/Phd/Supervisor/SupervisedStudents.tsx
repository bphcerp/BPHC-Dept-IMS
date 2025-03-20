import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { LoadingSpinner } from "@/components/ui/spinner";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";

interface Student {
  email: string;
  name: string;
  documents: string | null;
}

interface StudentDetailProps {
  student: Student;
  onClose: () => void;
}

const suggestDacSchema = z.object({
  dacMembers: z.array(z.string()).min(1).max(5),
});

const StudentDetail: React.FC<StudentDetailProps> = ({ student, onClose }) => {
  const [dacMembers, setDacMembers] = useState<string[]>(['']);
  const queryClient = useQueryClient();

  const suggestDacMutation = useMutation({
    mutationFn: async (data: { dacMembers: string[] }) => {
      return await api.post("/phd/supervisor/suggestDacMembers", data);
    },
    onSuccess: () => {
      toast.success("DAC members suggested successfully");
      queryClient.invalidateQueries({ queryKey: ["phd-supervised-students"] });
      onClose();
    },
    onError: (error) => {
      toast.error("Failed to suggest DAC members");
    },
  });

  const handleAddDacMember = () => {
    setDacMembers([...dacMembers, '']);
  };

  const handleRemoveDacMember = (index: number) => {
    const newDacMembers = [...dacMembers];
    newDacMembers.splice(index, 1);
    setDacMembers(newDacMembers);
  };

  const handleDacMemberChange = (index: number, value: string) => {
    const newDacMembers = [...dacMembers];
    newDacMembers[index] = value;
    setDacMembers(newDacMembers);
  };

  const onSubmit = () => {
    // Filter out empty entries
    const filteredDacMembers = dacMembers.filter(member => member.trim() !== '');
    
    if (filteredDacMembers.length === 0) {
      toast.error("Please add at least one DAC member");
      return;
    }

    suggestDacMutation.mutate({
      dacMembers: filteredDacMembers,
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Student Details</DialogTitle>
          <DialogDescription>
            View details and suggest DAC members for {student.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-1 font-medium">Name:</div>
            <div className="col-span-3">{student.name}</div>
            
            <div className="col-span-1 font-medium">Email:</div>
            <div className="col-span-3">{student.email}</div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Documents</h3>
            {student.documents ? (
              <Button variant="link" className="text-blue-600 p-0" asChild>
                <a href={student.documents} target="_blank" rel="noopener noreferrer">
                  View Proposal
                </a>
              </Button>
            ) : (
              <p className="text-sm text-gray-500">No documents available</p>
            )}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Suggest DAC Members</h3>
            <div className="space-y-2">
              {dacMembers.map((member, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder={`DAC Member ${index + 1} Email`}
                    value={member}
                    onChange={(e) => handleDacMemberChange(index, e.target.value)}
                  />
                  {dacMembers.length > 1 && (
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleRemoveDacMember(index)}
                    >
                      ✕
                    </Button>
                  )}
                </div>
              ))}
              
              {dacMembers.length < 5 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddDacMember}
                  className="mt-2"
                >
                  Add DAC Member
                </Button>
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={onSubmit}
              disabled={suggestDacMutation.isLoading}
            >
              {suggestDacMutation.isLoading ? (
                <LoadingSpinner className="mr-2 h-4 w-4" />
              ) : null}
              Submit DAC Suggestions
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="destructive" size="sm">
              Reject
            </Button>
            <Button variant="default" size="sm">
              Accept
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const SupervisedStudents: React.FC = () => {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  const { data, isLoading } = useQuery({
    queryKey: ["phd-supervised-students"],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; students: Student[] }>(
        "/phd/supervisor/getSupervisedStudents"
      );
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });

  const handleViewDetails = (student: Student) => {
    setSelectedStudent(student);
  };

  const handleCloseDetails = () => {
    setSelectedStudent(null);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="mx-auto w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Supervised Students
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/3">Name</TableHead>
                <TableHead className="w-1/3">Email</TableHead>
                <TableHead className="w-1/3">Documents</TableHead>
                <TableHead className="w-1/6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.students && data.students.length > 0 ? (
                data.students.map((student) => (
                  <TableRow key={student.email}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>
                      {student.documents ? (
                        <Badge variant="outline" className="bg-green-50 text-green-600">
                          Available
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-50 text-gray-600">
                          Not Available
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(student)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    No students under your supervision yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {selectedStudent && (
        <StudentDetail
          student={selectedStudent}
          onClose={handleCloseDetails}
        />
      )}
    </div>
  );
};

export default SupervisedStudents;