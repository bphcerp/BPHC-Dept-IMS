import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { Button } from "@/components/ui/button";
import { 
  Accordion, AccordionContent, AccordionItem, AccordionTrigger 
} from "@/components/ui/accordion";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Download, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface ApplicationsPanelProps {
  selectedSemester: number | null;
  onSelectSemester: (semester: number) => void;
  onNext: () => void;
}

const ApplicationsPanel: React.FC<ApplicationsPanelProps> = ({ 
  selectedSemester, 
  onSelectSemester,
  onNext 
}) => {
  const [downloadingExamId, setDownloadingExamId] = useState<number | null>(null);

  // Fetch qualifying exam applications data
  const { data, isLoading } = useQuery({
    queryKey: ["phd-qualifying-exam-applications", selectedSemester],
    queryFn: async () => {
      const response = await api.get("/phd/drcMember/getPhdDataOfWhoFilledApplicationForm");
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleBatchDownload = async (examId: number) => {
    try {
      setDownloadingExamId(examId);
      
      // Use query parameter instead of path parameter
      const response = await api.get("/phd/drcMember/getApplicationFormsAsZip", {
        params: { examId },
        responseType: 'blob' // Important for binary data
      });
      
      // Create a download link for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      
      // Find the exam to use its name in the filename
      const exam = currentSemester?.exams.find((e:any) => e.id === examId);
      const fileName = exam 
        ? `${exam.examName.replace(/\s+/g, '_')}_applications.zip`
        : `qualifying_exam_applications_${examId}.zip`;
      
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      toast.success("Application forms downloaded successfully");
    } catch (error) {
      console.error("Error downloading application forms:", error);
      toast.error("Failed to download application forms");
    } finally {
      setDownloadingExamId(null);
    }
  };

  if (isLoading) {
    return <div>Loading application data...</div>;
  }

  if (!data?.success || !data.semestersWithExams.length) {
    return (
      <div className="py-4 text-center">
        <p>No qualifying exams or applications found</p>
      </div>
    );
  }

  const currentSemester = data.semestersWithExams.find(
    (sem:any) => sem.id === selectedSemester
  ) || data.semestersWithExams[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Student Applications</h2>
        <div className="flex gap-4">
          <Select
            value={selectedSemester?.toString() || currentSemester.id.toString()}
            onValueChange={(value) => onSelectSemester(parseInt(value))}
          >
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Select Semester" />
            </SelectTrigger>
            <SelectContent>
              {data.semestersWithExams.map((semester:any) => (
                <SelectItem 
                  key={semester.id} 
                  value={semester.id.toString()}
                >
                  {semester.year}-Semester {semester.semesterNumber}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {currentSemester.exams.length === 0 ? (
        <div className="py-4 text-center">
          No qualifying exams found for this semester
        </div>
      ) : (
        <Accordion type="single" collapsible className="w-full">
          {currentSemester.exams.map((exam:any) => (
            <AccordionItem key={exam.id} value={exam.id.toString()}>
              <AccordionTrigger className="rounded-lg px-4 py-2 hover:bg-gray-50">
                <div className="flex w-full justify-between pr-4">
                  <span>{exam.examName}</span>
                  <span className="text-gray-500">
                    Deadline: {formatDate(exam.deadline)}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {exam.students.length === 0 ? (
                  <div className="py-4 text-center">
                    No applications found for this exam
                  </div>
                ) : (
                  <>
                    <div className="mb-4 flex justify-end">
                      <Button
                        onClick={() => handleBatchDownload(exam.id)}
                        disabled={downloadingExamId === exam.id}
                        className="bg-blue-600 text-white hover:bg-blue-700"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        {downloadingExamId === exam.id 
                          ? "Downloading..." 
                          : `Download All Forms (${exam.students.length})`}
                      </Button>
                    </div>
                    
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>ERP ID</TableHead>
                          <TableHead>Qualifying Areas</TableHead>
                          <TableHead>Application Form</TableHead>
                          <TableHead>Submitted On</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {exam.students.map((student:any) => (
                          <TableRow key={`${exam.id}-${student.email}`}>
                            <TableCell className="font-medium">{student.name}</TableCell>
                            <TableCell>{student.email}</TableCell>
                            <TableCell>{student.erpId}</TableCell>
                            <TableCell>
                              <div>1. {student.qualifyingArea1 || "N/A"}</div>
                              <div>2. {student.qualifyingArea2 || "N/A"}</div>
                            </TableCell>
                            <TableCell>
                              {student.fileUrl ? (
                                <Button
                                  variant="link"
                                  className="text-blue-600"
                                  asChild
                                >
                                  <a
                                    href={student.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    {student.formName}
                                  </a>
                                </Button>
                              ) : (
                                <span className="text-gray-500">
                                  No form available
                                </span>
                              )}
                            </TableCell>
                            <TableCell>{formatDate(student.uploadedAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      <div className="flex justify-end pt-4">
        <Button onClick={onNext} className="bg-blue-600 hover:bg-blue-700">
          Next Step: Generate Forms <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ApplicationsPanel;
