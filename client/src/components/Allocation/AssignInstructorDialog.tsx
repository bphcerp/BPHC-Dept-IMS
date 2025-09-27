import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/spinner";
import { ChevronRight } from "lucide-react";
import { allocationTypes } from "lib";
import api from "@/lib/axios-instance";

interface Instructor {
  email: string;
  name: string | null;
}

interface AssignInstructorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSectionId: string;
  allocationData: allocationTypes.AllocationResponse | null;
  onAssignInstructor: (instructorEmail: string) => void;
  isAssigning: boolean;
}

const AssignInstructorDialog: React.FC<AssignInstructorDialogProps> = ({
  isOpen,
  onOpenChange,
  selectedSectionId,
  allocationData,
  onAssignInstructor,
  isAssigning,
}) => {
  const [instructorSearchOpen, setInstructorSearchOpen] = useState(false);
  const [instructorSearchValue, setInstructorSearchValue] = useState("");

  // Fetch instructor list
  const { data: instructors = [], isLoading: instructorsLoading } = useQuery({
    queryKey: ["instructor-list"],
    queryFn: async () => {
      const response = await api.get<Instructor[]>(
        "/allocation/allocation/getInstructorList"
      );
      return response.data;
    },
    enabled: isOpen, // Only fetch when dialog is open
  });

  const filteredInstructors = instructors.filter((instructor) => {
    const matchesSearch =
      instructor.name
        ?.toLowerCase()
        .includes(instructorSearchValue.toLowerCase()) ||
      instructor.email
        .toLowerCase()
        .includes(instructorSearchValue.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedSectionId) {
      const selectedSection = allocationData?.sections?.find(
        (section) => section.id === selectedSectionId
      );
      const assignedEmails =
        selectedSection?.instructors?.map((inst) => inst.email) || [];

      return !assignedEmails.includes(instructor.email);
    }

    return true;
  });

  const handleAssignInstructor = (instructorEmail: string) => {
    onAssignInstructor(instructorEmail);
    setInstructorSearchOpen(false);
    setInstructorSearchValue("");
  };

  const handleDialogOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setInstructorSearchValue("");
      setInstructorSearchOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Instructor</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Select Instructor</Label>
            <Popover
              open={instructorSearchOpen}
              onOpenChange={setInstructorSearchOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={instructorSearchOpen}
                  className="w-full justify-between"
                  disabled={isAssigning}
                >
                  Select instructor...
                  <ChevronRight className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput
                    placeholder="Search instructors..."
                    value={instructorSearchValue}
                    onValueChange={setInstructorSearchValue}
                  />
                  <CommandEmpty>No instructor found.</CommandEmpty>
                  <CommandList>
                    {instructorsLoading ? (
                      <div className="flex items-center justify-center p-4">
                        <LoadingSpinner />
                      </div>
                    ) : (
                      <CommandGroup>
                        {filteredInstructors.map((instructor) => (
                          <CommandItem
                            key={instructor.email}
                            value={instructor.email}
                            onSelect={() =>
                              handleAssignInstructor(instructor.email)
                            }
                            className="cursor-pointer"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {instructor.name || instructor.email}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {instructor.email}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignInstructorDialog;
