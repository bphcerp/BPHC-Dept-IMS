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
import { Badge } from "@/components/ui/badge";
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header Section */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">PhD Qualifying Exam Management</h1>
          <p className="mt-3 text-lg text-gray-600">Manage qualifying exam applications and processes</p>
        </div>

        {/* Exam Selection Card */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-gray-900">
              Exam Selection
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Semester and Exam Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="semester-select" className="text-sm font-medium text-gray-700">
                  Select Semester
                </Label>
                {isLoadingSemesters ? (
                  <div className="flex items-center justify-center h-11 bg-gray-50 rounded-lg border border-gray-200">
                    <LoadingSpinner className="h-4 w-4 text-gray-600" />
                  </div>
                ) : (
                  <Select
                    value={selectedSemester?.toString() || ""}
                    onValueChange={handleSemesterChange}
                  >
                    <SelectTrigger id="semester-select" className="h-11 border-gray-200 focus:border-gray-400 focus:ring-gray-400">
                      <SelectValue placeholder="Choose semester..." />
                    </SelectTrigger>
                    <SelectContent>
                      {semesters?.map((semester) => (
                        <SelectItem key={semester.id} value={semester.id.toString()}>
                          {semester.year} - Semester {semester.semesterNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="exam-select" className="text-sm font-medium text-gray-700">
                  Select Qualifying Exam
                </Label>
                {selectedSemester && isLoadingExams ? (
                  <div className="flex items-center justify-center h-11 bg-gray-50 rounded-lg border border-gray-200">
                    <LoadingSpinner className="h-4 w-4 text-gray-600" />
                  </div>
                ) : (
                  <Select
                    value={selectedExamId?.toString() || ""}
                    onValueChange={handleExamChange}
                    disabled={!selectedSemester}
                  >
                    <SelectTrigger
                      id="exam-select"
                      className={`h-11 border-gray-200 focus:border-gray-400 focus:ring-gray-400 ${!selectedSemester ? 'bg-gray-50 text-gray-400' : ''
                        }`}
                    >
                      <SelectValue placeholder={selectedSemester ? "Choose exam..." : "Select semester first"} />
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
              <div className="mt-6 p-5 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg mb-3">
                      {selectedExam.examName}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Start Date</div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatDate(selectedExam.examStartDate)}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">End Date</div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatDate(selectedExam.examEndDate)}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Submission Deadline</div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatDate(selectedExam.submissionDeadline)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200">
                    Active
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs - only show if exam is selected */}
        {selectedExamId ? (
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-6">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1 rounded-lg">
                  <TabsTrigger
                    value="applications"
                    className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-md transition-all duration-200"
                  >
                    <span className="font-medium">Applications</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="forms"
                    className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-md transition-all duration-200"
                  >
                    <span className="font-medium">Generate Forms</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="examiners"
                    className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-md transition-all duration-200"
                  >
                    <span className="font-medium">Examiners</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="results"
                    className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-md transition-all duration-200"
                  >
                    <span className="font-medium">Results</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="applications" className="mt-6">
                  <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 1: Review Student Applications</h3>
                    <p className="text-gray-600 text-sm">Review and manage qualifying exam applications from students.</p>
                  </div>
                  <ApplicationStatusPanel
                    selectedExamId={selectedExamId}
                    onNext={() => setActiveTab("forms")}
                  />
                </TabsContent>

                <TabsContent value="forms" className="mt-6">
                  <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 2: Generate Required Forms</h3>
                    <p className="text-gray-600 text-sm">Generate necessary forms and documents for the qualifying exam process.</p>
                  </div>
                  <GenerateFormsPanel
                    selectedExamId={selectedExamId}
                    onNext={() => setActiveTab("examiners")}
                    onBack={() => setActiveTab("applications")}
                  />
                </TabsContent>

                <TabsContent value="examiners" className="mt-6">
                  <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 3: Manage Examiners</h3>
                    <p className="text-gray-600 text-sm">Assign and manage examiners for the qualifying exam.</p>
                  </div>
                  <ExaminerManagementPanel />
                </TabsContent>

                <TabsContent value="results" className="mt-6">
                  <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 4: Exam Results</h3>
                    <p className="text-gray-600 text-sm">View and manage qualifying exam results and outcomes.</p>
                  </div>
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Results Management</h3>
                    <p className="text-gray-500">Exam results management feature coming soon.</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-12">
              <div className="text-center">
                <div className="text-gray-400 mb-6">
                  <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">No Exam Selected</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Please select a semester and qualifying exam from the dropdowns above to begin managing the exam process.
                </p>
                <div className="mt-6 flex justify-center">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span>Step 1: Select Semester</span>
                    <div className="w-8 h-px bg-gray-300"></div>
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <span>Step 2: Select Exam</span>
                    <div className="w-8 h-px bg-gray-300"></div>
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <span>Step 3: Manage Process</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default QualifyingExamManagement;
