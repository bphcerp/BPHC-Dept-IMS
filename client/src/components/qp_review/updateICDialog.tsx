"use client";
import { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { toast } from "sonner";

interface AssignICDialogProps {
  isOpen?: boolean;
  setIsOpen?: (val: boolean) => void;
  onAssign: (reviewer: string, sendEmail: boolean) => void;
}

interface Faculty {
  name: string;
  email: string;
  type: string;
  deactivated: boolean;
}

export function AssignICDialog({
  isOpen,
  setIsOpen,
  onAssign,
}: AssignICDialogProps) {
  const [reviewer, setReviewer] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);
  const [shouldFetch, setShouldFetch] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldFetch(true);
    }
  }, [isOpen]);

  const {
    data: faculties,
    isLoading,
    refetch,
  } = useQuery<Faculty[]>({
    queryKey: ["faculties-list"],
    queryFn: async () => {
      try {
        const response = await api.get<{
          success: boolean;
          faculties: Faculty[];
        }>("/handout/dcaconvenor/getAllFaculty");
        return response.data.faculties;
      } catch (error) {
        toast.error("Failed to fetch faculty list");
        throw error;
      }
    },
    enabled: shouldFetch,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    if (shouldFetch) {
      void refetch();
    }
  }, [shouldFetch, refetch]);

  useEffect(() => {
    if (!isOpen) {
      setReviewer("");
      setOpen(false);
    }
  }, [isOpen]);

  const handleAssign = () => {
    if (reviewer) {
      console.log("Assigned IC:", reviewer);
      console.log("Send Email:", sendEmail);
      onAssign(reviewer, sendEmail);
      if (setIsOpen) {
        setIsOpen(false);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign IC</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                >
                  {reviewer
                    ? faculties?.find((f) => f.email === reviewer)?.name ||
                      "Select IC..."
                    : "Select IC..."}
                  <ChevronsUpDown className="opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput
                    placeholder="Search reviewer..."
                    className="h-9"
                  />
                  <CommandList>
                    <CommandEmpty>No faculty found.</CommandEmpty>
                    <CommandGroup>
                      {!isLoading &&
                        faculties &&
                        faculties
                          .filter((f) => !f.deactivated)
                          .map((faculty) => (
                            <CommandItem
                              key={faculty.email}
                              onSelect={() => {
                                setReviewer(faculty.email);
                                setOpen(false);
                              }}
                            >
                              {faculty.name}
                              <Check
                                className={cn(
                                  "ml-auto",
                                  reviewer === faculty.email
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex gap-2 text-sm text-muted-foreground">
            <Checkbox
              checked={sendEmail}
              onCheckedChange={(val) => setSendEmail(!!val.valueOf())}
            />
            Send email to reviewer
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleAssign} disabled={!reviewer}>
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
