import React, { useState, useEffect } from "react";
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
import { File, ExternalLink, Replace, Download, X } from "lucide-react";
import { z } from "zod";

interface StudentProposalFormProps {
  onSuccess: () => void;
  proposalData?: any | null;
}

interface UserProfile {
  phdType: "part-time" | "full-time";
}

interface Faculty {
  value: string;
  label: string;
}

const templateLinks: Record<string, string> = {
  appendixFile:
    "https://www.bits-pilani.ac.in/wp-content/uploads/1.-Appendix-I-to-be-attached-with-research-Proposals.pdf",
  summaryFile:
    "https://www.bits-pilani.ac.in/wp-content/uploads/2.-Summary-of-Research-Proposal.pdf",
  outlineFile:
    "https://www.bits-pilani.ac.in/wp-content/uploads/3.-Outline-of-the-Proposed-topic-of-Research.pdf",
  outsideSupervisorBiodataFile:
    "https://www.bits-pilani.ac.in/wp-content/uploads/5.-Format-For-Outside-Supervisors-Biodata.pdf",
  outsideCoSupervisorFormatFile:
    "https://www.bits-pilani.ac.in/wp-content/uploads/7.-Format-for-Proposed-out-side-Co-Supervisor.pdf",
  placeOfResearchFile:
    "https://www.bits-pilani.ac.in/wp-content/uploads/6.-Format-for-proposed-as-Place-of-Research-Work.pdf",
};

export const StudentProposalForm: React.FC<StudentProposalFormProps> = ({
  onSuccess,
  proposalData = null,
}) => {
  const { authState } = useAuth();
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [hasOutsideCoSupervisor, setHasOutsideCoSupervisor] = useState(false);
  const [declaration, setDeclaration] = useState(false);

  // State to manage multiple co-supervisors
  const [internalCoSupervisors, setInternalCoSupervisors] = useState<string[]>(
    []
  );
  const [externalCoSupervisors, setExternalCoSupervisors] = useState<
    { name: string; email: string }[]
  >([]);

  // Temporary state for the "add external" input fields
  const [tempExternalName, setTempExternalName] = useState("");
  const [tempExternalEmail, setTempExternalEmail] = useState("");

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

  useEffect(() => {
    if (proposalData && facultyList.length > 0) {
      setTitle(proposalData.title || "");
      setHasOutsideCoSupervisor(proposalData.hasOutsideCoSupervisor || false);

      // Correctly populate internal and external co-supervisors on edit
      const internals =
        proposalData.coSupervisors
          ?.filter((s: any) =>
            facultyList.some((f) => f.value === s.coSupervisorEmail)
          )
          .map((s: any) => s.coSupervisorEmail) ?? [];
      const externals =
        proposalData.coSupervisors
          ?.filter(
            (s: any) =>
              !facultyList.some((f) => f.value === s.coSupervisorEmail)
          )
          .map((s: any) => ({
            name: s.coSupervisorName || "",
            email: s.coSupervisorEmail,
          })) ?? [];

      setInternalCoSupervisors(internals);
      setExternalCoSupervisors(externals);
    }
  }, [proposalData, facultyList]);

  const mutation = useMutation({
    mutationFn: (formData: FormData) => {
      if (proposalData?.id) {
        return api.post(
          `/phd/proposal/student/resubmit/${proposalData.id}`,
          formData
        );
      }
      if (!proposalData?.proposalCycleId) {
        toast.error("Proposal Submission Cycle is missing.");
        throw new Error("Proposal Cycle ID is missing.");
      }
      formData.append(
        "proposalCycleId",
        proposalData.proposalCycleId.toString()
      );
      return api.post(`/phd/proposal/student/submitProposal`, formData);
    },
    onSuccess: () => {
      toast.success(
        `Proposal ${proposalData?.id ? "resubmitted" : "submitted"} successfully!`
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

  const handleAddExternal = () => {
    const emailCheck = z.string().email().safeParse(tempExternalEmail);
    if (!tempExternalName.trim() || !emailCheck.success) {
      toast.error(
        "Please enter a valid name and email for the external co-supervisor."
      );
      return;
    }
    if (externalCoSupervisors.some((e) => e.email === tempExternalEmail)) {
      toast.error("This external co-supervisor has already been added.");
      return;
    }
    setExternalCoSupervisors((prev) => [
      ...prev,
      { name: tempExternalName, email: tempExternalEmail },
    ]);
    setTempExternalName("");
    setTempExternalEmail("");
  };

  const handleRemoveInternal = (email: string) => {
    setInternalCoSupervisors((prev) => prev.filter((e) => e !== email));
  };

  const handleRemoveExternal = (email: string) => {
    setExternalCoSupervisors((prev) => prev.filter((e) => e.email !== email));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposalData?.proposalCycleId && !proposalData?.id) {
      toast.error("Please select a proposal submission cycle.");
      return;
    }
    if (
      !title ||
      (!files.appendixFile && !proposalData?.appendixFileUrl) ||
      (!files.summaryFile && !proposalData?.summaryFileUrl) ||
      (!files.outlineFile && !proposalData?.outlineFileUrl)
    ) {
      toast.error(
        "Please fill in the title and upload all mandatory documents."
      );
      return;
    }
    if (
      profileData?.phdType === "part-time" &&
      !files.placeOfResearchFile &&
      !proposalData?.placeOfResearchFileUrl
    ) {
      toast.error(
        "Part-time students must upload the 'Place of Research' document."
      );
      return;
    }
    if (
      hasOutsideCoSupervisor &&
      !files.outsideCoSupervisorFormatFile &&
      !proposalData?.outsideCoSupervisorFormatFileUrl &&
      !files.outsideSupervisorBiodataFile &&
      !proposalData?.outsideSupervisorBiodataFileUrl
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

    // Append arrays of co-supervisors
    formData.append(
      "internalCoSupervisors",
      JSON.stringify(internalCoSupervisors)
    );
    formData.append(
      "externalCoSupervisors",
      JSON.stringify(externalCoSupervisors)
    );

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
    {
      key: "outlineFile",
      label: "Outline of Proposed Topic",
      required: true,
    },
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
          const existingFileUrl = proposalData?.[`${field.key}Url`];
          return (
            <div key={field.key}>
              <div className="mb-1 flex items-center gap-2">
                <Label>
                  {field.label}
                  {field.required && "*"}
                </Label>
                <a
                  href={templateLinks[field.key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Download Template"
                  className="text-primary hover:underline"
                >
                  <Download className="h-4 w-4" />
                </a>
              </div>
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
        <Label className="font-semibold">Co-Supervisors</Label>
        <div className="space-y-2">
          <Label>Internal Co-Supervisors (from BITS)</Label>
          <Combobox
            options={facultyList}
            selectedValues={internalCoSupervisors}
            onSelectedValuesChange={setInternalCoSupervisors}
            placeholder="Select faculty members..."
            searchPlaceholder="Search faculty..."
            emptyPlaceholder="No faculty found."
          />
          {internalCoSupervisors.length > 0 && (
            <div className="mt-2 space-y-1">
              {internalCoSupervisors.map((email) => (
                <div
                  key={email}
                  className="flex items-center justify-between rounded-md bg-muted/50 p-2 text-sm"
                >
                  <span>
                    {facultyList.find((f) => f.value === email)?.label ?? email}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => handleRemoveInternal(email)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label>External Co-Supervisors</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Name"
              value={tempExternalName}
              onChange={(e) => setTempExternalName(e.target.value)}
            />
            <Input
              placeholder="Email"
              type="email"
              value={tempExternalEmail}
              onChange={(e) => setTempExternalEmail(e.target.value)}
            />
            <Button type="button" variant="outline" onClick={handleAddExternal}>
              Add
            </Button>
          </div>
          {externalCoSupervisors.length > 0 && (
            <div className="mt-2 space-y-1">
              {externalCoSupervisors.map((ext) => (
                <div
                  key={ext.email}
                  className="flex items-center justify-between rounded-md bg-muted/50 p-2 text-sm"
                >
                  <span>
                    {ext.name} ({ext.email})
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => handleRemoveExternal(ext.email)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2 rounded-md border p-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="hasOutsideCoSupervisor"
            checked={hasOutsideCoSupervisor}
            onCheckedChange={(checked) =>
              setHasOutsideCoSupervisor(checked as boolean)
            }
          />
          <Label htmlFor="hasOutsideCoSupervisor">
            I have an outside co-supervisor (from outside of BITS Pilani
            campuses) and have attached the required forms.
          </Label>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="declaration"
          checked={declaration}
          onCheckedChange={(checked) => setDeclaration(checked as boolean)}
          required
        />
        <Label htmlFor="declaration">
          I hereby declare that all the information I have filled is correct to
          the best of my knowledge. *
        </Label>
      </div>
      <Button type="submit" className="w-full" disabled={mutation.isLoading}>
        {mutation.isLoading ? (
          <LoadingSpinner />
        ) : proposalData?.id ? (
          "Resubmit Proposal"
        ) : (
          "Submit Proposal"
        )}
      </Button>
    </form>
  );
};
