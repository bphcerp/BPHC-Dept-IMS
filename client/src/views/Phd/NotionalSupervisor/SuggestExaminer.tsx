// Modified component with the correct subarea handling

import React, { useState, useEffect } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Interfaces
interface ISubArea {
  id: number;
  subarea: string;
}

interface IStudent {
  email: string;
  name: string;
  qualifyingArea1: string | null;
  qualifyingArea2: string | null;
}

interface ISubAreasResponse {
  success: boolean;
  subAreas: ISubArea[];
}

interface IStudentsResponse {
  success: boolean;
  students: IStudent[];
}

interface ISuggestedExaminerData {
  studentEmail: string;
  subAreaId: number; // Backend expects a number
  suggestedExaminers: string[];
}

const SupervisorManageExaminers: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [selectedSubAreaName, setSelectedSubAreaName] = useState<string | null>(null);
  const [examinerDialogOpen, setExaminerDialogOpen] = useState(false);
  const [examiners, setExaminers] = useState<string[]>([]);
  const [newExaminer, setNewExaminer] = useState("");
  const [examinerError, setExaminerError] = useState("");

  // Fetch sub-areas for qualifying exams
  const { data: subAreasData, isLoading: loadingSubAreas } = useQuery({
    queryKey: ["phd-sub-areas"],
    queryFn: async () => {
      const response = await api.get<ISubAreasResponse>(
        "/phd/supervisor/getSubAreas"
      );
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch PhD students under this supervisor
  const { data: studentsData, isLoading: loadingStudents } = useQuery({
    queryKey: ["supervisor-phd-students"],
    queryFn: async () => {
      const response = await api.get<IStudentsResponse>(
        "/phd/supervisor/getStudents"
      );
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });

  // Mutation for updating suggested examiners
  const updateExaminersMutation = useMutation({
    mutationFn: async (data: ISuggestedExaminerData) => {
      return await api.post("/phd/supervisor/updateSuggestedExaminer", data);
    },
    onSuccess: () => {
      toast.success("Suggested examiners updated successfully");
      setExaminerDialogOpen(false);
      setExaminers([]);
      setNewExaminer("");
      void queryClient.invalidateQueries({
        queryKey: ["supervisor-phd-students"],
      });
    },
    onError: (error) => {
      toast.error("Failed to update examiners");
      console.error(error);
    },
  });

  // Reset examiners when student or sub-area changes
  useEffect(() => {
    setExaminers([]);
    setNewExaminer("");
    setExaminerError("");
  }, [selectedStudent, selectedSubAreaName]);

  // Validate and add new examiner
  const handleAddExaminer = () => {
    if (!newExaminer) {
      setExaminerError("Examiner email is required");
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newExaminer)) {
      setExaminerError("Please enter a valid email address");
      return;
    }

    // Check for duplicate
    if (examiners.includes(newExaminer)) {
      setExaminerError("This examiner has already been added");
      return;
    }

    // Limit to 4 examiners
    if (examiners.length >= 4) {
      setExaminerError("Maximum 4 examiners allowed");
      return;
    }

    setExaminers([...examiners, newExaminer]);
    setNewExaminer("");
    setExaminerError("");
  };

  // Remove examiner from list
  const handleRemoveExaminer = (email: string) => {
    setExaminers(examiners.filter((e) => e !== email));
  };

  // Get subarea ID from name
  const getSubAreaIdFromName = (subareaName: string): number | null => {
    if (!subAreasData?.subAreas) return null;
    
    const subarea = subAreasData.subAreas.find(
      area => area.subarea === subareaName
    );
    
    return subarea ? subarea.id : null;
  };

  // Handle submission of suggested examiners
  const handleSubmit = () => {
    if (!selectedStudent || !selectedSubAreaName) {
      toast.error("Please select a student and sub-area");
      return;
    }

    if (examiners.length === 0) {
      toast.error("Please add at least one examiner");
      return;
    }

    // Find the subarea ID by its name
    const subAreaId = getSubAreaIdFromName(selectedSubAreaName);
    
    if (subAreaId === null) {
      toast.error("Invalid sub-area selected");
      return;
    }

    updateExaminersMutation.mutate({
      studentEmail: selectedStudent,
      subAreaId: subAreaId, // Send the ID number to the backend
      suggestedExaminers: examiners,
    });
  };

  // Get sub-area name from ID (used for display)
  const getSubAreaName = (areaId: string | null) => {
    if (!areaId || !subAreasData?.subAreas) return "Unknown Sub-Area";
    
    const numId = Number(areaId);
    if (isNaN(numId)) return areaId;
    
    const subArea = subAreasData.subAreas.find(area => area.id === numId);
    return subArea ? subArea.subarea : areaId;
  };

  // Get qualifying area names for selected student
  const getStudentQualifyingAreas = () => {
    if (!selectedStudent || !studentsData?.students) return [];

    const student = studentsData.students.find(
      (s) => s.email === selectedStudent
    );
    if (!student) return [];

    const areas: string[] = [];
    if (student.qualifyingArea1) {
      areas.push(student.qualifyingArea1);
    }
    if (student.qualifyingArea2) {
      areas.push(student.qualifyingArea2);
    }

    return areas;
  };

  // Loading state
  if (loadingSubAreas || loadingStudents) {
    return <LoadingSpinner className="mx-auto mt-10" />;
  }

  // No data state
  if (!studentsData?.students || studentsData.students.length === 0) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
        <Card className="w-full max-w-4xl">
          <CardContent className="p-6">
            <h2 className="mb-4 text-xl font-bold">
              Suggest Qualifying Exam Examiners
            </h2>
            <div className="py-4 text-center">
              You don't have any PhD students assigned to you
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render supervisor view
  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold">
            Suggest Qualifying Exam Examiners
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-6">
            <p className="text-sm text-gray-500">
              As a supervisor, you can suggest examiners for your PhD students'
              qualifying exams. These suggestions will be reviewed by the
              Doctoral Research Committee.
            </p>
          </div>

          <div className="mb-6 space-y-4">
            <div>
              <Label htmlFor="student-select">Select PhD Student</Label>
              <Select
                value={selectedStudent || ""}
                onValueChange={(value) => setSelectedStudent(value)}
              >
                <SelectTrigger id="student-select" className="w-full">
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {studentsData.students.map((student) => (
                    <SelectItem key={student.email} value={student.email}>
                      {student.name} ({student.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedStudent && (
              <div>
                <Label htmlFor="subarea-select">Select Sub-Area</Label>
                <Select
                  value={selectedSubAreaName || ""}
                  onValueChange={(value) => setSelectedSubAreaName(value)}
                  disabled={!selectedStudent}
                >
                  <SelectTrigger id="subarea-select" className="w-full">
                    <SelectValue placeholder="Select a sub-area" />
                  </SelectTrigger>
                  <SelectContent>
                    {getStudentQualifyingAreas().map((areaName) => (
                      <SelectItem key={areaName} value={areaName}>
                        {areaName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedStudent && selectedSubAreaName && (
              <div className="mt-4">
                <Button
                  onClick={() => setExaminerDialogOpen(true)}
                  className="w-full"
                >
                  Suggest Examiners
                </Button>
              </div>
            )}
          </div>

          <div className="mt-8">
            <h3 className="mb-4 text-lg font-medium">My PhD Students</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Qualifying Areas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentsData.students.map((student) => (
                  <TableRow key={student.email}>
                    <TableCell className="font-medium">
                      {student.name}
                    </TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {student.qualifyingArea1 && (
                          <Badge variant="outline">
                            {getSubAreaName(student.qualifyingArea1)}
                          </Badge>
                        )}
                        {student.qualifyingArea2 && (
                          <Badge variant="outline">
                            {getSubAreaName(student.qualifyingArea2)}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog for suggesting examiners */}
      <Dialog open={examinerDialogOpen} onOpenChange={setExaminerDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Suggest Examiners</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            {selectedStudent && selectedSubAreaName && (
              <div className="mb-4 rounded-md bg-blue-50 p-3 text-sm text-blue-800">
                <p>
                  <strong>Student:</strong>{" "}
                  {
                    studentsData.students.find(
                      (s) => s.email === selectedStudent
                    )?.name
                  }
                </p>
                <p>
                  <strong>Sub-Area:</strong> {selectedSubAreaName}
                </p>
              </div>
            )}

            <div className="mb-4">
              <Label htmlFor="examiners-list">
                Current Suggested Examiners
              </Label>
              <div className="mt-2 min-h-24 rounded-md border p-2">
                {examiners.length === 0 ? (
                  <p className="py-2 text-center text-sm text-gray-500">
                    No examiners added yet
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {examiners.map((email) => (
                      <Badge
                        key={email}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {email}
                        <button
                          onClick={() => handleRemoveExaminer(email)}
                          className="ml-1 rounded-full p-1 hover:bg-gray-200"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mb-4">
              <Label htmlFor="new-examiner">Add Examiner (max 4)</Label>
              <div className="mt-2 flex gap-2">
                <Input
                  id="new-examiner"
                  value={newExaminer}
                  onChange={(e) => setNewExaminer(e.target.value)}
                  placeholder="Examiner's email address"
                  className="flex-1"
                />
                <Button
                  onClick={handleAddExaminer}
                  disabled={examiners.length >= 4}
                  variant="outline"
                  size="icon"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {examinerError && (
                <p className="mt-1 text-xs text-red-500">{examinerError}</p>
              )}
            </div>

            <div className="mt-6 flex gap-4">
              <Button
                variant="outline"
                onClick={() => setExaminerDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1"
                disabled={
                  updateExaminersMutation.isLoading || examiners.length === 0
                }
              >
                {updateExaminersMutation.isLoading
                  ? "Saving..."
                  : "Save Examiners"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupervisorManageExaminers;