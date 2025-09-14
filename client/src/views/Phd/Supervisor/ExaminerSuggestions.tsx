import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, UserPlus, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { isAxiosError } from "axios";
import { phdSchemas } from "lib";

interface ApplicationForSuggestion {
  id: number;
  studentName: string | null;
  studentEmail: string;
  qualifyingArea1: string;
  qualifyingArea2: string;
  examinerCount: number;
  hasSuggestions: boolean;
}

interface FacultyMember {
  name: string | null;
  email: string;
}

const ExaminerSuggestions: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedApplication, setSelectedApplication] =
    useState<ApplicationForSuggestion | null>(null);
  const [isSuggestionDialogOpen, setIsSuggestionDialogOpen] = useState(false);

  const { data: applications = [], isLoading: isLoadingApplications } =
    useQuery<ApplicationForSuggestion[]>({
      queryKey: ["supervisor-applications-for-suggestion"],
      queryFn: async () => {
        const response = await api.get(
          "/phd/supervisor/getApplicationsForSuggestion"
        );
        return response.data as ApplicationForSuggestion[];
      },
    });

  const handleSuccess = () => {
    setIsSuggestionDialogOpen(false);
    void queryClient.invalidateQueries({
      queryKey: ["supervisor-applications-for-suggestion"],
    });
  };

  if (isLoadingApplications) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Examiner Suggestions</h1>
          <p className="mt-2 text-gray-600">
            Suggest examiners for your supervised PhD students.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Verified Student Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Area 1</TableHead>
                  <TableHead>Area 2</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.length > 0 ? (
                  applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell>
                        <div className="font-medium">{app.studentName}</div>
                        <div className="text-sm text-muted-foreground">
                          {app.studentEmail}
                        </div>
                      </TableCell>
                      <TableCell>{app.qualifyingArea1}</TableCell>
                      <TableCell>{app.qualifyingArea2}</TableCell>
                      <TableCell>
                        <Badge
                          variant={app.hasSuggestions ? "default" : "secondary"}
                          className={
                            app.hasSuggestions
                              ? "bg-green-100 text-green-800"
                              : ""
                          }
                        >
                          {app.hasSuggestions ? "Submitted" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {!app.hasSuggestions && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedApplication(app);
                              setIsSuggestionDialogOpen(true);
                            }}
                          >
                            <UserPlus className="mr-2 h-4 w-4" />
                            Suggest Examiners
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No applications awaiting suggestions.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      {selectedApplication && (
        <SuggestionDialog
          application={selectedApplication}
          isOpen={isSuggestionDialogOpen}
          onClose={() => setIsSuggestionDialogOpen(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};

interface SuggestionDialogProps {
  application: ApplicationForSuggestion;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SuggestionDialog: React.FC<SuggestionDialogProps> = ({
  application,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [suggestions1, setSuggestions1] = useState<string[]>([]);
  const [suggestions2, setSuggestions2] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const { data: facultyList = [], isLoading: isLoadingFaculty } = useQuery<
    FacultyMember[]
  >({
    queryKey: ["faculty-list"],
    queryFn: async () => {
      const response = await api.get<FacultyMember[]>(
        "/phd/supervisor/getFacultyList"
      );
      return response.data;
    },
  });

  const suggestExaminersSchema = phdSchemas.createSuggestExaminersSchema(
    application.examinerCount
  );

  const validateInput = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    try {
      suggestExaminersSchema.parse({
        suggestionsArea1: suggestions1,
        suggestionsArea2: suggestions2,
      });
      setValidationErrors([]);
      return { isValid: true, errors: [] };
    } catch (error) {
      if (error && typeof error === "object" && "issues" in error) {
        const zodError = error as {
          issues: Array<{ message: string; path: (string | number)[] }>;
        };
        zodError.issues.forEach((issue) => {
          errors.push(issue.message);
        });
      } else if (error instanceof Error) {
        errors.push(error.message);
      }
      setValidationErrors(errors);
      return { isValid: false, errors };
    }
  };

  const mutation = useMutation({
    mutationFn: (data: {
      applicationId: number;
      suggestionsArea1: string[];
      suggestionsArea2: string[];
    }) =>
      api.post(`/phd/supervisor/suggestExaminers/${data.applicationId}`, data),
    onSuccess: () => {
      toast.success("Suggestions submitted successfully.");
      onSuccess();
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        toast.error(`Submission failed: ${error.response?.data}`);
      } else {
        toast.error("Submission failed.");
      }
    },
  });

  const handleSubmit = () => {
    const validation = validateInput();

    if (!validation.isValid) {
      if (validation.errors.length > 0) {
        toast.error(validation.errors[0]);
      } else {
        toast.error("Please fix the validation errors before submitting.");
      }
      return;
    }

    mutation.mutate({
      applicationId: application.id,
      suggestionsArea1: suggestions1,
      suggestionsArea2: suggestions2,
    });
  };

  // Clear validation errors when suggestions change
  React.useEffect(() => {
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  }, [suggestions1, suggestions2, validationErrors.length]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl font-semibold">
            Suggest Examiners for {application.studentName}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Select exactly {application.examinerCount} examiner
            {application.examinerCount > 1 ? "s" : ""} for each qualifying area
            from the faculty list
          </DialogDescription>

          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-inside list-disc space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </DialogHeader>

        <div className="grid grid-cols-1 gap-6 py-6 lg:grid-cols-2">
          <ExaminerSelector
            title={`Area 1: ${application.qualifyingArea1}`}
            selected={suggestions1}
            setSelected={setSuggestions1}
            facultyList={facultyList}
            isLoading={isLoadingFaculty}
            maxCount={application.examinerCount}
            hasError={validationErrors.some((error) =>
              error.includes("suggestionsArea1")
            )}
          />
          <ExaminerSelector
            title={`Area 2: ${application.qualifyingArea2}`}
            selected={suggestions2}
            setSelected={setSuggestions2}
            facultyList={facultyList}
            isLoading={isLoadingFaculty}
            maxCount={application.examinerCount}
            hasError={validationErrors.some((error) =>
              error.includes("suggestionsArea2")
            )}
          />
        </div>

        <DialogFooter className="flex flex-col gap-3 border-t pt-6 sm:flex-row">
          <Button
            variant="outline"
            onClick={onClose}
            className="order-2 sm:order-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={mutation.isLoading}
            className="order-1 sm:order-2"
            type="button"
          >
            {mutation.isLoading && <LoadingSpinner className="mr-2 h-4 w-4" />}
            Submit Suggestions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface ExaminerSelectorProps {
  title: string;
  selected: string[];
  setSelected: React.Dispatch<React.SetStateAction<string[]>>;
  facultyList: FacultyMember[];
  isLoading: boolean;
  maxCount?: number;
  hasError?: boolean;
}

const ExaminerSelector: React.FC<ExaminerSelectorProps> = ({
  title,
  selected,
  setSelected,
  facultyList,
  isLoading,
  maxCount = 4,
  hasError = false,
}) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (email: string) => {
    if (selected.length < maxCount && !selected.includes(email)) {
      setSelected([...selected, email]);
    } else if (selected.length >= maxCount) {
      toast.error(`You cannot suggest more than ${maxCount} examiners.`);
    }
    setOpen(false);
  };

  const handleRemove = (email: string) => {
    setSelected(selected.filter((s) => s !== email));
  };

  return (
    <div
      className={cn(
        "space-y-4 rounded-lg border p-4",
        hasError && "border-destructive bg-destructive/5"
      )}
    >
      <div className="flex items-center justify-between">
        <Label
          className={cn(
            "text-base font-semibold",
            hasError && "text-destructive"
          )}
        >
          {title}
        </Label>
        <Badge
          variant={selected.length === maxCount ? "default" : "secondary"}
          className="text-xs"
        >
          {selected.length} / {maxCount} selected
        </Badge>
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              hasError && "border-destructive"
            )}
            disabled={selected.length >= maxCount || isLoading}
          >
            {isLoading ? "Loading..." : "Select from Faculty List..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[350px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search faculty..." />
            <CommandList>
              <CommandEmpty>No faculty found.</CommandEmpty>
              <CommandGroup>
                {facultyList
                  .filter((f) => !selected.includes(f.email))
                  .map((faculty) => (
                    <CommandItem
                      key={faculty.email}
                      onSelect={() => handleSelect(faculty.email)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selected.includes(faculty.email)
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">{faculty.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {faculty.email}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <div className="text-sm text-muted-foreground">
        If the examiner is not listed, please contact the admin.
      </div>

      {selected.length > 0 && (
        <div className="space-y-2 pt-2">
          <Label className="text-sm font-medium">Selected Examiners:</Label>
          {selected.map((email) => {
            const faculty = facultyList.find((f) => f.email === email);
            return (
              <div
                key={email}
                className="flex items-center justify-between rounded-md border border-border bg-card p-3 text-sm shadow-sm"
              >
                <div className="flex flex-col">
                  {faculty ? (
                    <>
                      <span className="font-medium">{faculty.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {email}
                      </span>
                    </>
                  ) : (
                    <span className="font-medium">{email}</span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleRemove(email)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ExaminerSuggestions;
