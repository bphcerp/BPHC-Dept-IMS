"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import EvaluationFormModal from "@/components/qp_review/EvaluationFormModal";
import api from "@/lib/axios-instance";
import { useLocation } from "react-router-dom";

const tabItems = [
  { value: "midSem", label: "Mid Sem" },
  { value: "midSemSol", label: "Mid Sem Solutions" },
  { value: "compre", label: "Compre" },
  { value: "compreSol", label: "Compre Solutions" },
];

export default function FacultyReview() {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [files, setFiles] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const requestId = location.state?.requestId;
  const email = "harishdixit@university.com";

  useEffect(() => {
    async function fetchFiles() {
      try {
        const response = await api.get(
          `/qp/getFilesByRequestID/${Number(requestId)}`
        );
        const data = response.data.data;

        setFiles(() => data);
        console.log(files);
      } catch (error) {
        console.error("Error fetching files:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchFiles();
    console.log(files);
  }, [requestId]);

  if (loading) {
    return <>Loading...</>;
  }

  return (
    <main className="w-full bg-background">
      <div className="mx-4 mt-2">
        <div className="overflow-hidden rounded-md border">
          <div className="flex items-center justify-between border-b p-4">
            <h1 className="text-2xl font-bold">Review Documents</h1>
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
                  <DocumentDownload documentUrl={files[tab.value]} />
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      </div>

      <EvaluationFormModal
        open={showReviewModal}
        onOpenChange={setShowReviewModal}
        courseCode={undefined}
        requestId={requestId}
        email={email}
      />
    </main>
  );
}

function DocumentDownload({ documentUrl }: { documentUrl: string | null }) {
  if (!documentUrl) {
    return (
      <div className="flex h-[75vh] items-center justify-center bg-gray-100">
        <p className="text-gray-500">No document available</p>
      </div>
    );
  }

  return (
    <div className="relative flex h-[75vh] items-center justify-center bg-gray-100">
      <a href={documentUrl} download target="_blank" rel="noopener noreferrer">
        <Button size="sm" className="absolute right-2 top-2 flex gap-2">
          <Download className="h-5 w-5" />
          Download PDF
        </Button>
      </a>
    </div>
  );
}
