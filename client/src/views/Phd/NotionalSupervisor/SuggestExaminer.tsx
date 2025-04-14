import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { LoadingSpinner } from "@/components/ui/spinner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { X, Plus,  } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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
  subAreaId: number;
  suggestedExaminers: string[];
}

const SupervisorManageExaminers: React.FC = () => {
  const queryClient = useQueryClient();
  const [examinerDialogOpen, setExaminerDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<IStudent | null>(null);
  const [selectedSubAreaName, setSelectedSubAreaName] = useState<string | null>(null);
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
  React.useEffect(() => {
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
      (area) => area.subarea === subareaName
    );

    return subarea ? subarea.id : null;
  };

  // Open examiner dialog for a specific student and area
  const openExaminerDialog = (student: IStudent, areaName: string) => {
    setSelectedStudent(student);
    setSelectedSubAreaName(areaName);
    setExaminerDialogOpen(true);
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
      studentEmail: selectedStudent.email,
      subAreaId: subAreaId,
      suggestedExaminers: examiners,
    });
  };

  // Loading state
  if (loadingSubAreas || loadingStudents) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center">
        <LoadingSpinner className="h-10 w-10" />
        <p className="mt-4 text-gray-500">
          Loading examiner management data...
        </p>
      </div>
    );
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

  return (
    <div className="min-h-screen w-full bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-center text-3xl font-bold text-gray-900">
          Suggest Qualifying Exam Examiners
        </h1>

        <div className="mb-6">
          <h2 className="mb-4 text-xl font-semibold">My PhD Students</h2>

          <div className="space-y-4">
            {studentsData.students.map((student) => (
              <Card key={student.email} className="overflow-hidden">
                <CardHeader className="bg-gray-50 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle>{student.name}</CardTitle>
                      <CardDescription>{student.email}</CardDescription>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {student.qualifyingArea1 && (
                          <Badge variant="outline">{student.qualifyingArea1}</Badge>
                        )}
                        {student.qualifyingArea2 && (
                          <Badge variant="outline">{student.qualifyingArea2}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="examiners">
                      <AccordionTrigger className="px-4 py-3">
                        <span className="text-sm font-medium">Manage Examiners</span>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="space-y-4">
                          {!student.qualifyingArea1 && !student.qualifyingArea2 ? (
                            <p className="text-center text-sm text-gray-500 py-2">
                              No qualifying areas assigned to this student
                            </p>
                          ) : (
                            <>
                              {student.qualifyingArea1 && (
                                <div className="rounded-lg border p-3">
                                  <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2">
                                    <div>
                                      <h4 className="text-sm font-medium">Area 1: {student.qualifyingArea1}</h4>
                                    </div>
                                    <Button
                                      size="sm"
                                      onClick={() => openExaminerDialog(student, student.qualifyingArea1!)}
                                    >
                                      Suggest Examiners
                                    </Button>
                                  </div>
                                </div>
                              )}
                              {student.qualifyingArea2 && (
                                <div className="rounded-lg border p-3">
                                  <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2">
                                    <div>
                                      <h4 className="text-sm font-medium">Area 2: {student.qualifyingArea2}</h4>
                                    </div>
                                    <Button
                                      size="sm"
                                      onClick={() => openExaminerDialog(student, student.qualifyingArea2!)}
                                    >
                                      Suggest Examiners
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

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
                  <strong>Student:</strong> {selectedStudent.name}
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