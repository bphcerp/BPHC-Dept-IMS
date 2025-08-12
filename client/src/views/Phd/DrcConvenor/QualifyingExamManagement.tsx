import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/lib/axios-instance";
import ApplicationStatusPanel from "@/components/phd/DRCExaminerManagement/ApplicationStatusPanel";
import GenerateFormsPanel from "@/components/phd/DRCExaminerManagement/GenerateFormsPanel";
import ExaminerManagementPanel from "@/components/phd/DRCExaminerManagement/ExaminerManagementPanel";

// Types based on actual API responses and database schema
interface Semester {
  id: number;
  year: string;
  semesterNumber: number;
  startDate: string;
  endDate: string;
  createdAt: string;
}

interface QualifyingExam {
  id: number;
  semesterId: number;
  examName: string;
  examStartDate: string;
  examEndDate: string;
  submissionDeadline: string;
  vivaDate: string | null;
  createdAt: string;
  updatedAt: string;
}

const QualifyingExamManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState("applications");
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);

  // Fetch available semesters
  const { data: semesters, isLoading: isLoadingSemesters } = useQuery({
    queryKey: ["semesters"],
    queryFn: async () => {
      const response = await api.get<{ semesters: Semester[] }>("/phd/staff/getAllSem");
      return response.data.semesters;
    },
  });

  // Fetch exams for selected semester
  const { data: exams = [], isLoading: isLoadingExams } = useQuery({
    queryKey: ["exams", selectedSemester],
    queryFn: async () => {
      if (!selectedSemester) return [];
      const response = await api.get<{ exams: QualifyingExam[] }>(
        `/phd/staff/qualifyingExams/${selectedSemester}`
      );
      return response.data.exams;
    },
    enabled: !!selectedSemester,
  });

  const handleSemesterChange = (semesterId: string) => {
    const id = parseInt(semesterId);
    setSelectedSemester(id);
    setSelectedExamId(null); // Reset exam selection when semester changes
  };

  const handleExamChange = (examId: string) => {
    setSelectedExamId(Number.parseInt(examId));
  };

  const selectedExam = exams.find(exam => exam.id === selectedExamId);

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-7xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            PhD Qualifying Exam Management
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* Semester and Exam Selection */}
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="semester-select">Select Semester</Label>
              {isLoadingSemesters || !semesters ? (
                <LoadingSpinner />
              ) : (
                <Select
                  value={selectedSemester?.toString() || ""}
                  onValueChange={handleSemesterChange}
                >
                  <SelectTrigger id="semester-select">
                    <SelectValue placeholder="Choose semester..." />
                  </SelectTrigger>
                  <SelectContent>
                    {semesters.map((semester) => (
                      <SelectItem key={semester.id} value={semester.id.toString()}>
                        {semester.year} - Semester {semester.semesterNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="exam-select">Select Qualifying Exam</Label>
              {isLoadingExams ? (
                <LoadingSpinner />
              ) : (
                <Select
                  value={selectedExamId?.toString() || ""}
                  onValueChange={handleExamChange}
                  disabled={!selectedSemester}
                >
                  <SelectTrigger id="exam-select">
                    <SelectValue placeholder="Choose exam..." />
                  </SelectTrigger>
                  <SelectContent>
                    {exams.map((exam) => (
                      <SelectItem key={exam.id} value={exam.id.toString()}>
                        {exam.examName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Show exam details if selected */}
          {selectedExam && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">{selectedExam.examName}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-700">
                <div>
                  <span className="font-medium">Start:</span>{" "}
                  {new Date(selectedExam.examStartDate).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">End:</span>{" "}
                  {new Date(selectedExam.examEndDate).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">Submission Deadline:</span>{" "}
                  {new Date(selectedExam.submissionDeadline).toLocaleDateString()}
                </div>
              </div>
            </div>
          )}

          {/* Tabs - only show if exam is selected */}
          {selectedExamId ? (
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="applications">
                  1. Student Applications
                </TabsTrigger>
                <TabsTrigger value="forms">2. Generate Forms</TabsTrigger>
                <TabsTrigger value="examiners">
                  3. Examiner Management
                </TabsTrigger>
                <TabsTrigger value="results">4. Exam Results</TabsTrigger>
              </TabsList>

              <TabsContent value="applications" className="mt-6">
                <ApplicationStatusPanel
                  selectedExamId={selectedExamId}
                  onNext={() => setActiveTab("forms")}
                />
              </TabsContent>

              <TabsContent value="forms" className="mt-6">
                <GenerateFormsPanel
                  selectedExamId={selectedExamId}
                  onNext={() => setActiveTab("examiners")}
                  onBack={() => setActiveTab("applications")}
                />
              </TabsContent>

              <TabsContent value="examiners" className="mt-6">
                <ExaminerManagementPanel
                />
              </TabsContent>

              {/* <TabsContent value="results" className="mt-6">
                <ResultsPanel
                />
              </TabsContent> */}
            </Tabs>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500">
                Please select a semester and qualifying exam to get started.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QualifyingExamManagement;
