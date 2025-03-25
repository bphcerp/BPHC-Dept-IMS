"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import EvaluationFormModal from "@/components/qp_review/EvaluationFormModal";
import { useParams, useLocation } from "react-router-dom";

const tabItems = [
  { value: "midSem", label: "Mid Sem" },
  { value: "midSemSol", label: "Mid Sem Solutions" },
  { value: "compre", label: "Compre" },
  { value: "compreSol", label: "Compre Solutions" },
];

export default function FacultyReview() {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const { course } = useParams<{ course: string }>();
  const location = useLocation();
  const courseCode =
    (location.state as { courseName: string })?.courseName ||
    course?.toUpperCase().replace("-", " ");

  return (
    <main className="w-full bg-background">
      <div className="mx-auto max-w-6xl p-4">
        <div className="overflow-hidden rounded-md border">
          <div className="flex items-center justify-between border-b p-4">
            <h1 className="text-2xl font-bold">{courseCode}</h1>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowReviewModal(true)}
            >
              Review
            </Button>
          </div>

          <div>
            <Tabs defaultValue={tabItems[0].value} className="w-full">
              <div className="border-b px-4">
                <TabsList className="h-12 bg-transparent">
                  {tabItems.map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="data-[state=active]:bg-gray-300"
                    >
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {tabItems.map((tab) => (
                <TabsContent key={tab.value} value={tab.value} className="m-0">
                  <DocumentPreview document={tab.label} />
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      </div>

      <EvaluationFormModal
        open={showReviewModal}
        courseCode={courseCode}
        onOpenChange={setShowReviewModal}
      />
    </main>
  );
}

interface Document {
  document: string;
}

function DocumentPreview({ document }: Document) {
  return (
    <div className="relative flex h-[75vh] items-center justify-center bg-gray-100">
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2"
        title="Download"
      >
        <Download className="h-5 w-5" />
      </Button>
      <p className="text-gray-500">{document}</p>
    </div>
  );
}
