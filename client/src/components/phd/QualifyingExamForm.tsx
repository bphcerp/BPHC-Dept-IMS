import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import api from "@/lib/axios-instance";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// Updated interface to match actual data
interface PhdSubArea {
  id: number;
  subarea: string;
}

interface Exam {
  id: number;
  examName: string;
  deadline: string;
  examStartDate: string;
  examEndDate: string;
  semesterYear?: string;
  semesterNumber?: number;
}

interface BackendResponse {
  success: boolean;
  exams: Exam[];
}

interface SubAreasResponse {
  success: boolean;
  subAreas: PhdSubArea[];
}

export default function ExamForm() {
  const [qualifyingArea1, setQualifyingArea1] = useState("");
  const [qualifyingArea2, setQualifyingArea2] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");

  // New state for checkboxes
  const [generalInfoChecked, setGeneralInfoChecked] = useState(false);
  const [academicInfoChecked, setAcademicInfoChecked] = useState(false);
  const [anticipatedPlanChecked, setAnticipatedPlanChecked] = useState(false);
  const [qualifyingExamDetailsChecked, setQualifyingExamDetailsChecked] = useState(false);

  // Fetch sub-areas
  const { 
    data: subAreasData, 
    isLoading: isSubAreasLoading, 
    error: subAreasError 
  } = useQuery<SubAreasResponse, Error>({
    queryKey: ["phd-sub-areas"],
    queryFn: async () => {
      console.log("Fetching sub-areas...");
      try {
        const response = await api.get<SubAreasResponse>("/phd/student/getSubAreas");
        console.log("Sub-areas response:", response.data);
        return response.data;
      } catch (error) {
        console.error("Error fetching sub-areas:", error);
        throw error;
      }
    },
    refetchOnWindowFocus: false,
  });

  // Fetch exam deadline and dates
  const { 
    data: examData, 
    isLoading: isExamDataLoading 
  } = useQuery<BackendResponse, Error>({
    queryKey: ["get-qualifying-exam-deadline"],
    queryFn: async (): Promise<BackendResponse> => {
      try {
        const response = await api.get<BackendResponse>(
          "/phd/student/getQualifyingExamDeadLine",
          {
            params: {
              name: "Regular Qualifying Exam",
            },
          }
        );
        return response.data;
      } catch (err) {
        console.error("Error fetching exam deadline:", err);
        throw err;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const submitMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await api.post<{
        success: boolean;
        message: string;
      }>("/phd/student/uploadQeApplicationForm", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Qualifying exam application submitted successfully");
      setQualifyingArea1("");
      setQualifyingArea2("");
      setFile(null);
      setFileName("");
      // Reset checkboxes
      setGeneralInfoChecked(false);
      setAcademicInfoChecked(false);
      setAnticipatedPlanChecked(false);
      setQualifyingExamDetailsChecked(false);
    },
    onError: (error) => {
      toast.error(
        isAxiosError(error)
          ? (error.response?.data as string) || "Submission failed"
          : "Submission failed"
      );
      console.error("Submission error:", error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!examData || examData.exams.length === 0) {
      toast.error("No valid exam dates found");
      return;
    }

    // Check if all required fields and checkboxes are filled
    if (
      !file ||
      !qualifyingArea1 ||
      !qualifyingArea2 ||
      qualifyingArea1 === qualifyingArea2 || // Ensure areas are different
      !generalInfoChecked ||
      !academicInfoChecked ||
      !anticipatedPlanChecked ||
      !qualifyingExamDetailsChecked
    ) {
      toast.error(qualifyingArea1 === qualifyingArea2 
        ? "Please select two different research sub-areas" 
        : "All fields and checkboxes are required"
      );
      return;
    }

    const selectedExam = examData.exams[0]; // Use the first exam if multiple

    const formData = new FormData();
    formData.append("qualificationForm", file);
    formData.append("qualifyingArea1", qualifyingArea1);
    formData.append("qualifyingArea2", qualifyingArea2);
    formData.append("examStartDate", selectedExam.examStartDate);
    formData.append("examEndDate", selectedExam.examEndDate);

    submitMutation.mutate(formData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setFileName(selectedFile?.name || "");
  };

  // Render loading or error states
  if (isSubAreasLoading) {
    return <div>Loading sub-areas...</div>;
  }

  if (subAreasError) {
    return (
      <div>
        Error loading sub-areas: 
        {subAreasError instanceof Error ? subAreasError.message : "Unknown error"}
      </div>
    );
  }

  // Additional debugging for empty sub-areas
  if (!subAreasData || subAreasData.subAreas.length === 0) {
    console.error("No sub-areas found!");
    return <div>No research sub-areas available</div>;
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardContent className="space-y-4 pt-6">
        <h2 className="text-2xl font-bold">Qualifying Exam Application</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="qualifyingArea1">Research Sub-Area 1 *</Label>
            <Select 
              value={qualifyingArea1}
              onValueChange={setQualifyingArea1}
              disabled={isSubAreasLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select research sub-area" />
              </SelectTrigger>
              <SelectContent>
                {subAreasData.subAreas.map((subArea) => (
                  <SelectItem 
                    key={subArea.id} 
                    value={subArea.subarea}
                  >
                    {subArea.subarea}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label htmlFor="qualifyingArea2">Research Sub-Area 2 *</Label>
            <Select 
              value={qualifyingArea2}
              onValueChange={setQualifyingArea2}
              disabled={isSubAreasLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select research sub-area" />
              </SelectTrigger>
              <SelectContent>
                {subAreasData.subAreas
                  .filter(subArea => subArea.subarea !== qualifyingArea1)
                  .map((subArea) => (
                    <SelectItem 
                      key={subArea.id} 
                      value={subArea.subarea}
                    >
                      {subArea.subarea}
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label htmlFor="qualificationForm">Research Proposal (PDF) *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="qualificationForm"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                required
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() =>
                  document.getElementById("qualificationForm")?.click()
                }
              >
                <Upload className="mr-2 h-4 w-4" />
                {fileName || "Choose PDF file"}
              </Button>
            </div>
            {fileName && (
              <p className="truncate text-sm text-muted-foreground">
                Selected file: {fileName}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="generalInfo"
                className="form-checkbox h-4 w-4"
                checked={generalInfoChecked}
                onChange={(e) => setGeneralInfoChecked(e.target.checked)}
                required
              />
              <Label htmlFor="generalInfo" className="text-sm font-medium">
                I have filled the General Information *
              </Label>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="academicInfo"
                className="form-checkbox h-4 w-4"
                checked={academicInfoChecked}
                onChange={(e) => setAcademicInfoChecked(e.target.checked)}
                required
              />
              <Label htmlFor="academicInfo" className="text-sm font-medium">
                I have filled the Academic Information *
              </Label>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="anticipatedPlan"
                className="form-checkbox h-4 w-4"
                checked={anticipatedPlanChecked}
                onChange={(e) => setAnticipatedPlanChecked(e.target.checked)}
                required
              />
              <Label htmlFor="anticipatedPlan" className="text-sm font-medium">
                I have filled the Anticipated Plan for PhD *
              </Label>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="qualifyingExamDetails"
                className="form-checkbox h-4 w-4"
                checked={qualifyingExamDetailsChecked}
                onChange={(e) =>
                  setQualifyingExamDetailsChecked(e.target.checked)
                }
                required
              />
              <Label
                htmlFor="qualifyingExamDetails"
                className="text-sm font-medium"
              >
                I have filled Details about PhD Qualifying Examination *
              </Label>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={
              submitMutation.isLoading || 
              isExamDataLoading || 
              isSubAreasLoading
            }
          >
            {submitMutation.isLoading ? "Submitting..." : "Submit Application"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}