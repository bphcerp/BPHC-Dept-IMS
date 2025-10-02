// client/src/components/phd/proposal/StudentProposalForm.tsx
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
import { File, ExternalLink, Replace, Download, X, Info } from "lucide-react";
import { z } from "zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
    "https://www.bits-pilani.ac.in/uploads/Appendix_I_and_II_for_PhD_students_w.e.f._I_Sem_2020-21.doc",
  summaryFile:
    "https://www.bits-pilani.ac.in/uploads/SUMMARY_OF_RESEARCH_PROPOSAL_w.e.f._I_Sem_2020-21.doc",
  outlineFile:
    "https://www.bits-pilani.ac.in/uploads/OUTLINE_OF_PROPOSED_TOPIC_OF_RESEARCH_w.e.f._I_Sem_2020-21.doc",
  outsideSupervisorBiodataFile:
    "https://www.bits-pilani.ac.in/uploads/BIODATA_OF_PROPOSED_SUPERVISOR_w.e.f._I_Sem_2020-21.doc",
  outsideCoSupervisorFormatFile:
    "https://www.bits-pilani.ac.in/uploads/Format_for_Proposed_Outside_Co-supervisor_w.e.f_2020-21.doc",
  placeOfResearchFile:
    "https://www.bits-pilani.ac.in/uploads/FORMAT_FOR_PLACE_OF_RESEARCH_WORK_w.e.f._I_Sem_2020-21.doc",
};

const FileField = ({
  field,
  existingFileUrl,
  currentFile,
  handleFileChange,
}: {
  field: { key: string; label: string; required: boolean };
  existingFileUrl?: string | null;
  currentFile: File | null;
  handleFileChange: (key: string, file: File | null) => void;
}) => (
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
    {existingFileUrl && !currentFile ? (
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
        value={currentFile ? [currentFile] : []}
        onValueChange={(newFiles) =>
          handleFileChange(field.key, newFiles[0] ?? null)
        }
        accept={{ "application/pdf": [] }}
      />
    )}
  </div>
);

export const StudentProposalForm: React.FC<StudentProposalFormProps> = ({
  onSuccess,
  proposalData = null,
}) => {
  const { authState } = useAuth();
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [hasOutsideCoSupervisor, setHasOutsideCoSupervisor] = useState(false);
  const [declaration, setDeclaration] = useState(false);
  const [previewConfirmation, setPreviewConfirmation] = useState(false);
  const [internalCoSupervisors, setInternalCoSupervisors] = useState<string[]>(
    []
  );
  const [externalCoSupervisors, setExternalCoSupervisors] = useState<
    { name: string; email: string }[]
  >([]);
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
      toast.success(`Proposal action completed successfully!`);
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

  const handleSubmit = (submissionType: "draft" | "final") => {
    if (submissionType === "final") {
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
      if (!previewConfirmation) {
        toast.error("Please confirm you have previewed the submission.");
        return;
      }
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("hasOutsideCoSupervisor", String(hasOutsideCoSupervisor));
    formData.append("declaration", String(declaration));
    formData.append("submissionType", submissionType);
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

  const unconditionalFileFields = [
    { key: "appendixFile", label: "Appendix I", required: true },
    {
      key: "summaryFile",
      label: "Summary of Research Proposal",
      required: true,
    },
    { key: "outlineFile", label: "Outline of Proposed Topic", required: true },
  ];

  const partTimeFileField = {
    key: "placeOfResearchFile",
    label: "Format for Place of Research Work",
    required: profileData?.phdType === "part-time",
    condition: profileData?.phdType === "part-time",
  };

  const outsideSupervisorFileFields = [
    {
      key: "outsideCoSupervisorFormatFile",
      label: "Format for Proposed Outside Co-Supervisor",
      required: true,
    },
    {
      key: "outsideSupervisorBiodataFile",
      label: "Format for Outside Supervisor's Biodata",
      required: true,
    },
  ];

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6 pt-4">
      {proposalData?.id && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Resubmitting Proposal</AlertTitle>
          <AlertDescription>
            The form fields have been pre-filled with your previous submission.
            Please review the details and upload any corrected documents below.
          </AlertDescription>
        </Alert>
      )}

      <div>
        <Label htmlFor="title">Proposal Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      {unconditionalFileFields.map((field) => (
        <FileField
          key={field.key}
          field={field}
          existingFileUrl={proposalData?.[`${field.key}Url`]}
          currentFile={files[field.key]}
          handleFileChange={handleFileChange}
        />
      ))}

      {profileData?.phdType === "part-time" && (
        <FileField
          field={partTimeFileField}
          existingFileUrl={proposalData?.[`${partTimeFileField.key}Url`]}
          currentFile={files[partTimeFileField.key]}
          handleFileChange={handleFileChange}
        />
      )}

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

      {hasOutsideCoSupervisor &&
        outsideSupervisorFileFields.map((field) => (
          <FileField
            key={field.key}
            field={field}
            existingFileUrl={proposalData?.[`${field.key}Url`]}
            currentFile={files[field.key]}
            handleFileChange={handleFileChange}
          />
        ))}

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

      <div className="space-y-4 rounded-md border-2 border-primary/50 bg-primary/5 p-4">
        <div className="flex items-start space-x-2">
          <Checkbox
            id="previewConfirmation"
            checked={previewConfirmation}
            onCheckedChange={(checked) =>
              setPreviewConfirmation(checked as boolean)
            }
          />
          <Label
            htmlFor="previewConfirmation"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            I have previewed my submission and confirm all details are correct.
            I understand I cannot edit after final submission unless it is
            reverted. *
          </Label>
        </div>
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Final Step</AlertTitle>
          <AlertDescription>
            You can save your application as a draft anytime. Before final
            submission, please use the "Preview" button on the main page to
            review your application. Check the box above to confirm your review
            before submitting.
          </AlertDescription>
        </Alert>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={mutation.isLoading}
          onClick={() => handleSubmit("draft")}
        >
          {mutation.isLoading &&
          mutation.variables?.get("submissionType") === "draft" ? (
            <LoadingSpinner />
          ) : (
            "Save as Draft"
          )}
        </Button>
        <Button
          type="button"
          className="w-full"
          disabled={mutation.isLoading || !previewConfirmation || !declaration}
          onClick={() => handleSubmit("final")}
        >
          {mutation.isLoading &&
          mutation.variables?.get("submissionType") === "final" ? (
            <LoadingSpinner />
          ) : proposalData?.id ? (
            "Resubmit Proposal"
          ) : (
            "Submit Proposal"
          )}
        </Button>
      </div>
    </form>
  );
};
