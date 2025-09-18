"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import EvaluationFormModal from "@/components/qp_review/EvaluationFormModal";
import api from "@/lib/axios-instance";
import { useLocation } from "react-router-dom";

const tabItems = [
  { value: "midSemQp", label: "Mid Sem" },
  { value: "midSemSol", label: "Mid Sem Solutions" },
  { value: "compreQp", label: "Compre" },
  { value: "compreSol", label: "Compre Solutions" },
];

export default function FacultyReview() {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [files, setFiles] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const requestId = location.state?.requestId;
  const email = "f20240500@hyderabad.bits-pilani.ac.in";

  useEffect(() => {
    async function fetchFiles() {
      try {
        const response = await api.get(
          `/qp/getFilesByRequestID/${Number(requestId)}`
        );
        setFiles(response.data.data);
      } catch (error) {
        console.error("Error fetching files:", error);
      } finally {
        setLoading(false);
      }
    }

    if (requestId) {
      fetchFiles();
    }
  }, [requestId]);

  // Filter tabs to only show those with valid document URLs
  const availableTabs = tabItems.filter(tab => files[tab.value]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  // If no documents are available, show message
  if (availableTabs.length === 0) {
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
            <div className="flex h-[75vh] items-center justify-center bg-gray-100">
              <p className="text-gray-500">No documents available for review</p>
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
            <Tabs defaultValue={availableTabs[0]?.value} className="w-full">
              <div className="border-b px-4">
                <TabsList className="h-12 bg-transparent">
                  {availableTabs.map((tab) => (
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

              {availableTabs.map((tab) => (
                <TabsContent key={tab.value} value={tab.value} className="m-0">
                  <DocumentPreview documentUrl={files[tab.value]} />
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

function DocumentPreview({ documentUrl }: { documentUrl: string | null }) {
  if (!documentUrl) {
    return (
      <div className="flex h-[75vh] items-center justify-center bg-gray-100">
        <p className="text-gray-500">No document available</p>
      </div>
    );
  }

  return (
    <div className="relative h-[75vh] bg-gray-100">
      {/* Download Button - Top Right Corner */}
      <div className="absolute top-4 right-4 z-10">
        <a href={documentUrl} download target="_blank" rel="noopener noreferrer">
          <Button size="sm" className="flex gap-2 shadow-lg">
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </a>
      </div>

      {/* PDF Preview */}
      <iframe
        src={documentUrl}
        className="w-full h-full border-0"
        title="Document Preview"
        loading="lazy"
      >
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Your browser doesn't support PDF preview
            </p>
            <a href={documentUrl} download target="_blank" rel="noopener noreferrer">
              <Button className="flex gap-2">
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            </a>
          </div>
        </div>
      </iframe>
    </div>
  );
}
