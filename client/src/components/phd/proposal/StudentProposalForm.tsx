// client/src/components/phd/proposal/StudentProposalForm.tsx
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
import { Combobox } from "@/components/ui/combobox";
import { File, ExternalLink, Replace } from "lucide-react";

interface StudentProposalFormProps {
  proposalId?: number;
  proposalCycleId?: number;
  onSuccess: () => void;
  existingFiles?: Record<string, string | null>;
}

interface UserProfile {
  phdType: "part-time" | "full-time";
}

interface Faculty {
  value: string;
  label: string;
}

export const StudentProposalForm: React.FC<StudentProposalFormProps> = ({
  proposalId,
  proposalCycleId,
  onSuccess,
  existingFiles = {},
}) => {
  const { authState } = useAuth();
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [hasOutsideCoSupervisor, setHasOutsideCoSupervisor] = useState(false);
  const [declaration, setDeclaration] = useState(false);

  // Co-supervisor state
  const [coSupervisorEmail, setCoSupervisorEmail] = useState<string[]>([]);
  const [isOtherCoSupervisor, setIsOtherCoSupervisor] = useState(false);
  const [externalCoSupervisorName, setExternalCoSupervisorName] = useState("");
  const [externalCoSupervisorEmail, setExternalCoSupervisorEmail] =
    useState("");

  const { data: profileData } = useQuery<UserProfile>({
    queryKey: ["student-profile-details", authState?.email],
    queryFn: async () => {
      const response = await api.get("/phd/student/getProfileDetails");
      return response.data.student;
    },
    enabled: !!authState?.email,
  });

  const { data: facultyList = [] } = useQuery<Faculty[]>({
    queryKey: ["facultyList"],
    queryFn: async () => {
      const res = await api.get("/phd/proposal/getFacultyList");
      return res.data.map((f: { name: string; email: string }) => ({
        label: `${f.name} (${f.email})`,
        value: f.email,
      }));
    },
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
    if (!proposalCycleId && !proposalId) {
      toast.error("Please select a proposal submission cycle.");
      return;
    }
    if (
      !title ||
      (!files.appendixFile && !existingFiles.appendixFileUrl) ||
      (!files.summaryFile && !existingFiles.summaryFileUrl) ||
      (!files.outlineFile && !existingFiles.outlineFileUrl)
    ) {
      toast.error(
        "Please fill in the title and upload all mandatory documents."
      );
      return;
    }
    if (
      profileData?.phdType === "part-time" &&
      !files.placeOfResearchFile &&
      !existingFiles.placeOfResearchFileUrl
    ) {
      toast.error(
        "Part-time students must upload the 'Place of Research' document."
      );
      return;
    }
    if (
      hasOutsideCoSupervisor &&
      ((!files.outsideCoSupervisorFormatFile &&
        !existingFiles.outsideCoSupervisorFormatFileUrl) ||
        (!files.outsideSupervisorBiodataFile &&
          !existingFiles.outsideSupervisorBiodataFileUrl))
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

    if (proposalCycleId) {
      formData.append("proposalCycleId", String(proposalCycleId));
    }

    if (!hasOutsideCoSupervisor) {
      if (isOtherCoSupervisor) {
        if (!externalCoSupervisorName || !externalCoSupervisorEmail) {
          toast.error(
            "Please enter the name and email for the external co-supervisor."
          );
          return;
        }
        formData.append("externalCoSupervisorName", externalCoSupervisorName);
        formData.append("externalCoSupervisorEmail", externalCoSupervisorEmail);
      } else if (coSupervisorEmail.length > 0) {
        formData.append("coSupervisorEmail", coSupervisorEmail[0]);
      }
    }

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
    <form onSubmit={handleSubmit} className="space-y-6 pt-4">
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
        .map((field) => {
          const existingFileUrl = existingFiles[field.key + "Url"];
          return (
            <div key={field.key}>
              <Label>
                {field.label}
                {field.required && "*"}
              </Label>
              {existingFileUrl && !files[field.key] ? (
                <div className="mt-1 flex items-center justify-between gap-2 rounded-md border bg-blue-50 p-3">
                  <a
                    href={existingFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                  >
                    <File className="h-4 w-4" /> View Current File{" "}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() =>
                      document.getElementById(`uploader-${field.key}`)?.click()
                    }
                  >
                    <Replace className="mr-2 h-4 w-4" /> Replace
                  </Button>
                  <div className="hidden">
                    <FileUploader
                      id={`uploader-${field.key}`}
                      value={[]}
                      onValueChange={(newFiles) =>
                        handleFileChange(field.key, newFiles[0] ?? null)
                      }
                      accept={{ "application/pdf": [] }}
                    />
                  </div>
                </div>
              ) : (
                <FileUploader
                  value={files[field.key] ? [files[field.key] as File] : []}
                  onValueChange={(newFiles) =>
                    handleFileChange(field.key, newFiles[0] ?? null)
                  }
                  accept={{ "application/pdf": [] }}
                />
              )}
            </div>
          );
        })}

      <div className="space-y-4 rounded-md border p-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="hasOutsideCoSupervisor"
            checked={hasOutsideCoSupervisor}
            onCheckedChange={(checked) =>
              setHasOutsideCoSupervisor(checked as boolean)
            }
          />
          <Label htmlFor="hasOutsideCoSupervisor">
            My co-supervisor is from outside of BITS campuses
          </Label>
        </div>
        {!hasOutsideCoSupervisor && (
          <div className="space-y-4 border-l pl-6 pt-4">
            <div>
              <Label>Select Co-Supervisor from BITS</Label>
              <Combobox
                options={facultyList}
                selectedValues={coSupervisorEmail}
                onSelectedValuesChange={(vals) => {
                  setCoSupervisorEmail(vals);
                  setIsOtherCoSupervisor(false);
                }}
                placeholder="Select a faculty member..."
                searchPlaceholder="Search faculty..."
                emptyPlaceholder="No faculty found."
                disabled={isOtherCoSupervisor}
              />
            </div>
            <div className="relative">
              {" "}
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isOther"
                checked={isOtherCoSupervisor}
                onCheckedChange={(checked) => {
                  setIsOtherCoSupervisor(checked as boolean);
                  if (checked) setCoSupervisorEmail([]);
                }}
              />
              <Label htmlFor="isOther">
                My co-supervisor is not in the list above
              </Label>
            </div>
            {isOtherCoSupervisor && (
              <div className="grid grid-cols-1 gap-4 border-l pl-6 pt-2 md:grid-cols-2">
                <div>
                  <Label htmlFor="externalName">Co-Supervisor Name</Label>
                  <Input
                    id="externalName"
                    value={externalCoSupervisorName}
                    onChange={(e) =>
                      setExternalCoSupervisorName(e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="externalEmail">Co-Supervisor Email</Label>
                  <Input
                    id="externalEmail"
                    type="email"
                    value={externalCoSupervisorEmail}
                    onChange={(e) =>
                      setExternalCoSupervisorEmail(e.target.value)
                    }
                  />
                </div>
              </div>
            )}
          </div>
        )}
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
