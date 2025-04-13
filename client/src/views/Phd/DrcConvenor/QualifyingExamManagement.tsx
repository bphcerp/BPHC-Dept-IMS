import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import ApplicationsPanel from "@/components/phd/ApplicationsPanel";
import GenerateFormsPanel from "@/components/phd/GenerateFormsPanel";
import ExaminerManagementPanel from "@/components/phd/ExaminerManagementPanel";
import ResultsPanel from "@/components/phd/ResultsPanel";

const QualifyingExamManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState("applications");
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);

  // Fetch semesters data
  const {  isLoading: isLoadingSemesters } = useQuery({
    queryKey: ["phd-semesters"],
    queryFn: async () => {
      const response = await api.get("/phd/staff/getAllSem");
      if (response.data.success && response.data.semesters.length > 0) {
        setSelectedSemester(response.data.semesters[0].id);
      }
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoadingSemesters) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
        <Card className="w-full max-w-6xl">
          <CardContent className="p-6">
            <div className="flex justify-center py-8">
              <p>Loading semester data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-7xl">
        <CardContent className="p-6">
          <h1 className="mb-6 text-2xl font-bold">PhD Qualifying Exam Management</h1>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="applications">1. Student Applications</TabsTrigger>
              <TabsTrigger value="forms">2. Generate Forms</TabsTrigger>
              <TabsTrigger value="examiners">3. Examiner Management</TabsTrigger>
              <TabsTrigger value="results">4. Exam Results</TabsTrigger>
            </TabsList>

            <TabsContent value="applications" className="mt-6">
              <ApplicationsPanel 
                selectedSemester={selectedSemester} 
                onSelectSemester={setSelectedSemester} 
                onNext={() => setActiveTab("forms")}
              />
            </TabsContent>

            <TabsContent value="forms" className="mt-6">
              <GenerateFormsPanel 
                selectedSemester={selectedSemester}
                onNext={() => setActiveTab("examiners")}
                onBack={() => setActiveTab("applications")}
              />
            </TabsContent>

            <TabsContent value="examiners" className="mt-6">
              <ExaminerManagementPanel 
                selectedSemester={selectedSemester}
                onNext={() => setActiveTab("results")}
                onBack={() => setActiveTab("forms")}
              />
            </TabsContent>

            <TabsContent value="results" className="mt-6">
              <ResultsPanel 
                selectedSemester={selectedSemester}
                onBack={() => setActiveTab("examiners")}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default QualifyingExamManagement;
