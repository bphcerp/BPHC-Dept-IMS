import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, UserPlus, X, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { isAxiosError } from "axios";

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
  const [selectedApplication, setSelectedApplication] = useState<ApplicationForSuggestion | null>(null);
  const [isSuggestionDialogOpen, setIsSuggestionDialogOpen] = useState(false);

  const { data: applications = [], isLoading: isLoadingApplications } = useQuery<ApplicationForSuggestion[]>({
    queryKey: ["supervisor-applications-for-suggestion"],
    queryFn: async () => {
      const response = await api.get("/phd/supervisor/getApplicationsForSuggestion");
      return response.data as ApplicationForSuggestion[];
    },
  });

  const handleSuccess = () => {
    setIsSuggestionDialogOpen(false);
    void queryClient.invalidateQueries({ queryKey: ["supervisor-applications-for-suggestion"] });
  };

  if (isLoadingApplications) {
    return <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>;
  }

  return (
    <div className="min-h-screen w-full bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Examiner Suggestions</h1>
          <p className="mt-2 text-gray-600">Suggest examiners for your supervised PhD students.</p>
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
                {applications.length > 0 ? applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <div className="font-medium">{app.studentName}</div>
                      <div className="text-sm text-muted-foreground">{app.studentEmail}</div>
                    </TableCell>
                    <TableCell>{app.qualifyingArea1}</TableCell>
                    <TableCell>{app.qualifyingArea2}</TableCell>
                    <TableCell>
                      <Badge variant={app.hasSuggestions ? "default" : "secondary"} className={app.hasSuggestions ? "bg-green-100 text-green-800" : ""}>
                        {app.hasSuggestions ? "Submitted" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {!app.hasSuggestions && (
                        <Button size="sm" onClick={() => { setSelectedApplication(app); setIsSuggestionDialogOpen(true); }}>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Suggest Examiners
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">No applications awaiting suggestions.</TableCell>
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

const SuggestionDialog: React.FC<SuggestionDialogProps> = ({ application, isOpen, onClose, onSuccess }) => {
  const [suggestions1, setSuggestions1] = useState<string[]>([]);
  const [suggestions2, setSuggestions2] = useState<string[]>([]);

  const { data: facultyList = [], isLoading: isLoadingFaculty } = useQuery<FacultyMember[]>({
    queryKey: ["faculty-list"],
    queryFn: async () => {
      const response = await api.get<FacultyMember[]>("/phd/supervisor/getFacultyList");
      return response.data;
    },
  });

  const mutation = useMutation({
    mutationFn: (data: { applicationId: number; suggestionsArea1: string[]; suggestionsArea2: string[] }) =>
      api.post("/phd/supervisor/suggestExaminers", data),
    onSuccess: () => {
      toast.success("Suggestions submitted successfully.");
      onSuccess();
    },
    onError: (error) => {
              if (isAxiosError(error)) {
                toast.error(`Submission failed:, ${error.response?.data}`);
              }
              toast.error("Submission failed.");
            },
  });

  const handleSubmit = () => {
    if (suggestions1.length < 1 || suggestions2.length < 1) {
      toast.error("Please select at least 1 examiner for each area.");
      return;
    }
    mutation.mutate({ applicationId: application.id, suggestionsArea1: suggestions1, suggestionsArea2: suggestions2 });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Suggest Examiners for {application.studentName}</DialogTitle>
          <DialogDescription>Select between 1 and {application.examinerCount} examiners for each qualifying area from the list or add an external examiner by email.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
          <ExaminerSelector title={`Area 1: ${application.qualifyingArea1}`} selected={suggestions1} setSelected={setSuggestions1} facultyList={facultyList} isLoading={isLoadingFaculty} maxCount={application.examinerCount} />
          <ExaminerSelector title={`Area 2: ${application.qualifyingArea2}`} selected={suggestions2} setSelected={setSuggestions2} facultyList={facultyList} isLoading={isLoadingFaculty} maxCount={application.examinerCount} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={mutation.isLoading}>
            {mutation.isLoading && <LoadingSpinner className="mr-2" />}
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
}

const ExaminerSelector: React.FC<ExaminerSelectorProps> = ({ title, selected, setSelected, facultyList, isLoading, maxCount = 4 }) => {
  const [open, setOpen] = useState(false);
  const [externalEmail, setExternalEmail] = useState("");

  const handleSelect = (email: string) => {
    if (selected.length < maxCount && !selected.includes(email)) {
      setSelected([...selected, email]);
    } else if (selected.length >= maxCount) {
      toast.error(`You cannot suggest more than ${maxCount} examiners.`);
    }
    setOpen(false);
  };

  const handleRemove = (email: string) => {
    setSelected(selected.filter(s => s !== email));
  };

  const handleAddExternal = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(externalEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (selected.length >= maxCount) {
      toast.error(`You cannot suggest more than ${maxCount} examiners.`);
      return;
    }
    if (selected.includes(externalEmail) || facultyList.some(f => f.email === externalEmail)) {
      toast.error("This examiner has already been suggested or is in the faculty list.");
      return;
    }
    setSelected([...selected, externalEmail]);
    setExternalEmail("");
  };


  return (
    <div className="space-y-4">
      <Label className="font-semibold">{title} ({selected.length} / {maxCount} selected)</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between" disabled={selected.length >= maxCount || isLoading}>
            {isLoading ? "Loading..." : "Select from Faculty List..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Search faculty..." />
            <CommandList>
              <CommandEmpty>No faculty found.</CommandEmpty>
              <CommandGroup>
                {facultyList.filter(f => !selected.includes(f.email)).map((faculty) => (
                  <CommandItem key={faculty.email} onSelect={() => handleSelect(faculty.email)}>
                    <Check className={cn("mr-2 h-4 w-4", selected.includes(faculty.email) ? "opacity-100" : "opacity-0")} />
                    {faculty.name} ({faculty.email})
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <div className="relative">
        <Separator />
        <div className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-background px-2 text-xs text-muted-foreground">OR</div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="external-email">Add External Examiner</Label>
        <div className="flex gap-2">
          <Input
            id="external-email"
            placeholder="examiner@email.com"
            value={externalEmail}
            onChange={(e) => setExternalEmail(e.target.value)}
            disabled={selected.length >= maxCount}
          />
          <Button type="button" variant="secondary" onClick={handleAddExternal} disabled={selected.length >= maxCount || !externalEmail.trim()}>
            <PlusCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2 pt-2">
        {selected.map(email => (
          <div key={email} className="flex items-center justify-between p-2 border rounded-md text-sm">
            <span>{email}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemove(email)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExaminerSuggestions;