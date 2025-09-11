import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FileUploader } from "@/components/ui/file-uploader";
import { LoadingSpinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { useAuth } from "@/hooks/Auth";

interface StudentProposalFormProps {
  proposalId?: number;
  onSuccess: () => void;
}

interface UserProfile {
  phdType: "part-time" | "full-time";
}

export const StudentProposalForm: React.FC<StudentProposalFormProps> = ({
  proposalId,
  onSuccess,
}) => {
  const { authState } = useAuth();
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [hasOutsideCoSupervisor, setHasOutsideCoSupervisor] = useState(false);
  const [declaration, setDeclaration] = useState(false);

  const { data: profileData } = useQuery<UserProfile>({
    queryKey: ["student-profile-details", authState?.email],
    queryFn: async () => {
      const response = await api.get("/phd/student/getProfileDetails");
      return response.data.student;
    },
    enabled: !!authState?.email,
  });

  const mutation = useMutation({
    mutationFn: (formData: FormData) => {
      if (proposalId) {
        return api.post(
          `/phd/proposal/student/resubmit/${proposalId}`,
          formData
        );
      }
      return api.post(`/phd/proposal/student/submitProposal`, formData);
    },
    onSuccess: () => {
      toast.success(
        `Proposal ${proposalId ? "resubmitted" : "submitted"} successfully!`
      );
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "An error occurred.");
    },
  });

  const handleFileChange = (key: string, file: File | null) => {
    setFiles((prev) => ({ ...prev, [key]: file }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !title ||
      !files.appendixFile ||
      !files.summaryFile ||
      !files.outlineFile
    ) {
      toast.error(
        "Please fill in the title and upload all mandatory documents."
      );
      return;
    }
    if (profileData?.phdType === "part-time" && !files.placeOfResearchFile) {
      toast.error(
        "Part-time students must upload the 'Place of Research' document."
      );
      return;
    }
    if (
      hasOutsideCoSupervisor &&
      (!files.outsideCoSupervisorFormatFile ||
        !files.outsideSupervisorBiodataFile)
    ) {
      toast.error(
        "Please upload both documents for the outside co-supervisor."
      );
      return;
    }
    if (!declaration) {
      toast.error("You must agree to the declaration.");
      return;
    }
    const formData = new FormData();
    formData.append("title", title);
    formData.append("hasOutsideCoSupervisor", String(hasOutsideCoSupervisor));
    formData.append("declaration", String(declaration));

    Object.keys(files).forEach((key) => {
      if (files[key]) {
        formData.append(key, files[key] as File);
      }
    });
    mutation.mutate(formData);
  };

  const fileFields = [
    { key: "appendixFile", label: "Appendix I", required: true },
    {
      key: "summaryFile",
      label: "Summary of Research Proposal",
      required: true,
    },
    { key: "outlineFile", label: "Outline of Proposed Topic", required: true },
    {
      key: "placeOfResearchFile",
      label: "Format for Place of Research Work",
      required: profileData?.phdType === "part-time",
      condition: profileData?.phdType === "part-time",
    },
    {
      key: "outsideCoSupervisorFormatFile",
      label: "Format for Proposed Outside Co-Supervisor",
      required: hasOutsideCoSupervisor,
      condition: hasOutsideCoSupervisor,
    },
    {
      key: "outsideSupervisorBiodataFile",
      label: "Format for Outside Supervisor's Biodata",
      required: hasOutsideCoSupervisor,
      condition: hasOutsideCoSupervisor,
    },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="title">Proposal Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      {fileFields
        .filter((f) => f.condition ?? true)
        .map((field) => (
          <div key={field.key}>
            <Label>
              {field.label}
              {field.required && "*"}
            </Label>
            <FileUploader
              value={files[field.key] ? [files[field.key] as File] : []}
              onValueChange={(newFiles) =>
                handleFileChange(field.key, newFiles[0] ?? null)
              }
              accept={{ "application/pdf": [] }}
            />
          </div>
        ))}

      <div className="flex items-center space-x-2">
        <Checkbox
          id="hasOutsideCoSupervisor"
          checked={hasOutsideCoSupervisor}
          onCheckedChange={(checked) =>
            setHasOutsideCoSupervisor(checked as boolean)
          }
        />
        <Label htmlFor="hasOutsideCoSupervisor">
          My co-supervisor is from outside of campus (Optional)
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="declaration"
          checked={declaration}
          onCheckedChange={(checked) => setDeclaration(checked as boolean)}
        />
        <Label htmlFor="declaration">
          I hereby declare that all the information I have filled is correct to
          the best of my knowledge. *
        </Label>
      </div>

      <Button type="submit" className="w-full" disabled={mutation.isLoading}>
        {mutation.isLoading ? (
          <LoadingSpinner />
        ) : proposalId ? (
          "Resubmit Proposal"
        ) : (
          "Submit Proposal"
        )}
      </Button>
    </form>
  );
};
