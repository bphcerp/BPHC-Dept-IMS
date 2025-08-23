import React, { useState, useEffect } from "react";
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
import ResultsPanel from "@/components/phd/DRCExaminerManagement/ResultPanel";
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
  examinerCount: number;
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

  const { data: semesters, isLoading: isLoadingSemesters } = useQuery({
    queryKey: ["semesters"],
    queryFn: async () => {
      const response = await api.get<{ semesters: Semester[] }>(
        "/phd/staff/getAllSem"
      );
      return response.data.semesters;
    },
  });

  const { data: latestSemester } = useQuery({
    queryKey: ["latestSemester"],
    queryFn: async () => {
      const response = await api.get<{ semester: Semester }>(
        "/phd/staff/getLatestSem"
      );
      return response.data.semester;
    },
  });

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

  useEffect(() => {
    if (latestSemester && !selectedSemester) {
      setSelectedSemester(latestSemester.id);
    }
  }, [latestSemester, selectedSemester]);

  useEffect(() => {
    if (exams.length > 0 && selectedSemester && !selectedExamId) {
      setSelectedExamId(exams[0].id);
    }
  }, [exams, selectedSemester, selectedExamId]);

  const handleSemesterChange = (semesterId: string) => {
    const id = parseInt(semesterId);
    setSelectedSemester(id);
    setSelectedExamId(null);
  };

  const handleExamChange = (examId: string) => {
    setSelectedExamId(Number.parseInt(examId));
  };

  const selectedExam = exams.find((exam) => exam.id === selectedExamId);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            PhD Qualifying Exam Management
          </h1>
          <p className="mt-3 text-lg text-gray-600">
            Manage qualifying exam applications and processes
          </p>
        </div>
        <Card className="border-0 bg-white shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-gray-900">
              Exam Selection
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <Label
                  htmlFor="semester-select"
                  className="text-sm font-medium text-gray-700"
                >
                  Select Semester
                </Label>
                {isLoadingSemesters ? (
                  <div className="flex h-11 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
                    <LoadingSpinner className="h-4 w-4 text-gray-600" />
                  </div>
                ) : (
                  <Select
                    value={selectedSemester?.toString() || ""}
                    onValueChange={handleSemesterChange}
                  >
                    <SelectTrigger
                      id="semester-select"
                      className="h-11 border-gray-200 focus:border-gray-400 focus:ring-gray-400"
                    >
                      <SelectValue placeholder="Choose semester..." />
                    </SelectTrigger>
                    <SelectContent>
                      {semesters?.map((semester) => (
                        <SelectItem
                          key={semester.id}
                          value={semester.id.toString()}
                        >
                          {semester.year} - Semester {semester.semesterNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-3">
                <Label
                  htmlFor="exam-select"
                  className="text-sm font-medium text-gray-700"
                >
                  Select Qualifying Exam
                </Label>
                {selectedSemester && isLoadingExams ? (
                  <div className="flex h-11 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
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
                      className={`h-11 border-gray-200 focus:border-gray-400 focus:ring-gray-400 ${!selectedSemester ? "bg-gray-50 text-gray-400" : ""}`}
                    >
                      <SelectValue
                        placeholder={
                          selectedSemester
                            ? "Choose exam..."
                            : "Select semester first"
                        }
                      />
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
            {selectedExam && (
              <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="mb-3 text-lg font-semibold text-gray-900">
                      {selectedExam.examName}
                    </h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="rounded-lg border border-gray-200 bg-white p-3">
                        <div className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                          Start Date
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatDate(selectedExam.examStartDate)}
                        </div>
                      </div>
                      <div className="rounded-lg border border-gray-200 bg-white p-3">
                        <div className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                          End Date
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatDate(selectedExam.examEndDate)}
                        </div>
                      </div>
                      <div className="rounded-lg border border-gray-200 bg-white p-3">
                        <div className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                          Submission Deadline
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatDate(selectedExam.submissionDeadline)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="border-gray-200 bg-gray-100 text-gray-700"
                  >
                    Active
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        {selectedExamId ? (
          <Card className="border-0 bg-white shadow-sm">
            <CardContent className="p-6">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-4 rounded-lg bg-gray-100 p-1">
                  <TabsTrigger
                    value="applications"
                    className="rounded-md transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
                  >
                    <span className="font-medium">Applications</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="forms"
                    className="rounded-md transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
                  >
                    <span className="font-medium">Generate Forms</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="examiners"
                    className="rounded-md transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
                  >
                    <span className="font-medium">Examiners</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="results"
                    className="rounded-md transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
                  >
                    <span className="font-medium">Results</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="applications" className="mt-6">
                  <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h3 className="mb-2 text-lg font-semibold text-gray-900">
                      Step 1: Review Student Applications
                    </h3>
                    <p className="text-sm text-gray-600">
                      Review and manage qualifying exam applications from
                      students.
                    </p>
                  </div>
                  <ApplicationStatusPanel
                    selectedExamId={selectedExamId}
                    onNext={() => setActiveTab("forms")}
                  />
                </TabsContent>
                <TabsContent value="forms" className="mt-6">
                  <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h3 className="mb-2 text-lg font-semibold text-gray-900">
                      Step 2: Generate Required Forms
                    </h3>
                    <p className="text-sm text-gray-600">
                      Generate necessary forms and documents for the qualifying
                      exam process.
                    </p>
                  </div>
                  <GenerateFormsPanel
                    selectedExamId={selectedExamId}
                    onNext={() => setActiveTab("examiners")}
                    onBack={() => setActiveTab("applications")}
                  />
                </TabsContent>
                <TabsContent value="examiners" className="mt-6">
                  <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h3 className="mb-2 text-lg font-semibold text-gray-900">
                      Step 3: Manage Examiners
                    </h3>
                    <p className="text-sm text-gray-600">
                      Notify supervisors, and assign examiners for the
                      qualifying exam.
                    </p>
                  </div>
                  <ExaminerManagementPanel
                    selectedExamId={selectedExamId}
                    examinerCount={selectedExam?.examinerCount || 2}
                    onBack={() => setActiveTab("forms")}
                  />
                </TabsContent>
                <TabsContent value="results" className="mt-6">
                  <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h3 className="mb-2 text-lg font-semibold text-gray-900">
                      Step 4: Exam Results
                    </h3>
                    <p className="text-sm text-gray-600">
                      View and manage qualifying exam results and outcomes.
                    </p>
                  </div>
                  <ResultsPanel
                    selectedExamId={selectedExamId}
                    onBack={() => setActiveTab("examiners")}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 bg-white shadow-sm">
            <CardContent className="p-12">
              <div className="text-center">
                <div className="mb-6 text-gray-400">
                  <svg
                    className="mx-auto h-16 w-16"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="mb-3 text-xl font-semibold text-gray-900">
                  No Exam Selected
                </h3>
                <p className="mx-auto max-w-md text-gray-600">
                  Please select a semester and qualifying exam from the
                  dropdowns above to begin managing the exam process.
                </p>
                <div className="mt-6 flex justify-center">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                    <span>Step 1: Select Semester</span>
                    <div className="h-px w-8 bg-gray-300"></div>
                    <div className="h-2 w-2 rounded-full bg-gray-300"></div>
                    <span>Step 2: Select Exam</span>
                    <div className="h-px w-8 bg-gray-300"></div>
                    <div className="h-2 w-2 rounded-full bg-gray-300"></div>
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
