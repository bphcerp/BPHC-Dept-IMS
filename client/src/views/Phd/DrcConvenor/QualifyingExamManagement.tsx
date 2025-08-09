import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { NewApplicationsPanel } from "@/components/phd/NewApplicationsPanel";
import { NewExaminerManagementPanel } from "@/components/phd/NewExaminerManagementPanel";
import { NewResultsPanel } from "@/components/phd/NewResultsPanel";
import { GenerateFormsPanel } from "@/components/phd/GenerateFormsPanel";

const QualifyingExamManagement: React.FC = () => {
  const [selectedExamEventId, setSelectedExamEventId] = useState<number | null>(null);

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-bold">Qualifying Exam Management</h1>
        <p className="text-muted-foreground">
          Manage the complete qualifying exam workflow from applications to
          results
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Workflow Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="applications" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="applications">Applications</TabsTrigger>
              <TabsTrigger value="forms">Generate Forms</TabsTrigger>
              <TabsTrigger value="examiners">Manage Examiners</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
            </TabsList>
            <TabsContent value="applications" className="space-y-4 pt-4">
              <NewApplicationsPanel
                selectedExamEventId={selectedExamEventId}
                onSelectExamEvent={setSelectedExamEventId}
              />
            </TabsContent>
            <TabsContent value="forms" className="space-y-4 pt-4">
              <GenerateFormsPanel selectedExamEventId={selectedExamEventId} />
            </TabsContent>
            <TabsContent value="examiners" className="space-y-4 pt-4">
              <NewExaminerManagementPanel
                selectedExamEventId={selectedExamEventId}
              />
            </TabsContent>
            <TabsContent value="results" className="space-y-4 pt-4">
              <NewResultsPanel selectedExamEventId={selectedExamEventId} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default QualifyingExamManagement;