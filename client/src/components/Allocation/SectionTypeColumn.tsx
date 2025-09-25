import React, { useState } from "react";
import { allocationSchemas, allocationTypes } from "lib";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/spinner";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { toast } from "sonner";

interface SectionTypeColumnProps {
  sectionType: (typeof allocationSchemas.sectionTypes)[number];
  selectedCourse: allocationTypes.Course;
  allocationData: allocationTypes.AllocationResponse;
  isLoading: boolean;
}

const SectionTypeColumn: React.FC<SectionTypeColumnProps> = ({
  sectionType,
  selectedCourse,
  allocationData,
  isLoading,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAssignInstructorDialogOpen, setIsAssignInstructorDialogOpen] =
    useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [instructorSearchOpen, setInstructorSearchOpen] = useState(false);
  const [instructorSearchValue, setInstructorSearchValue] = useState("");

  const queryClient = useQueryClient();

  // Fetch instructor list
  const { data: instructors = [] } = useQuery({
    queryKey: ["instructor-list"],
    queryFn: async () => {
      const response = await api.get<{ email: string; name: string | null }[]>(
        "/allocation/allocation/getInstructorList"
      );
      return response.data;
    },
  });

  // Add section mutation
  const addSectionMutation = useMutation({
    mutationFn: async (data: { masterId: string; sectionType: string }) => {
      await api.post("/allocation/allocation/section/add", data);
    },
    onSuccess: () => {
      toast.success("Section added successfully");
      void queryClient.invalidateQueries({
        queryKey: ["allocation", selectedCourse.code],
      });
    },
    onError: (error) => {
      toast.error(
        (error as { response: { data: string } }).response?.data ||
          "Failed to add section"
      );
    },
  });

  // Remove section mutation
  const removeSectionMutation = useMutation({
    mutationFn: async (sectionId: string) => {
      await api.delete("/allocation/allocation/section/remove", {
        data: { sectionId },
      });
    },
    onSuccess: () => {
      toast.success("Section removed successfully");
      void queryClient.invalidateQueries({
        queryKey: ["allocation", selectedCourse.code],
      });
    },
    onError: (error) => {
      toast.error(
        (error as { response: { data: string } })?.response?.data ||
          "Failed to remove section"
      );
    },
  });

  // Assign instructor mutation
  const assignInstructorMutation = useMutation({
    mutationFn: async (data: {
      sectionId: string;
      instructorEmail: string;
    }) => {
      await api.put("/allocation/allocation/section/assignInstructor", data);
    },
    onSuccess: () => {
      toast.success("Instructor assigned successfully");
      void queryClient.invalidateQueries({
        queryKey: ["allocation", selectedCourse.code],
      });
      setIsAssignInstructorDialogOpen(false);
      setSelectedSectionId("");
    },
    onError: (error) => {
      toast.error(
        (error as { response: { data: string } })?.response?.data ||
          "Failed to assign instructor"
      );
    },
  });

  // Dismiss instructor mutation
  const dismissInstructorMutation = useMutation({
    mutationFn: async (data: {
      sectionId: string;
      instructorEmail: string;
    }) => {
      await api.delete("/allocation/allocation/section/dismissInstructor", {
        data,
      });
    },
    onSuccess: () => {
      toast.success("Instructor dismissed successfully");
      void queryClient.invalidateQueries({
        queryKey: ["allocation", selectedCourse.code],
      });
    },
    onError: (error) => {
      toast.error(
        (error as { response: { data: string } })?.response?.data ||
          "Failed to dismiss instructor"
      );
    },
  });

  const handleAddSection = () => {
    if (allocationData?.id) {
      addSectionMutation.mutate({
        masterId: allocationData.id,
        sectionType: sectionType,
      });
    }
  };

  const handleRemoveSection = (sectionId: string) => {
    removeSectionMutation.mutate(sectionId);
  };

  const handleAssignInstructor = (instructorEmail: string) => {
    if (selectedSectionId) {
      assignInstructorMutation.mutate({
        sectionId: selectedSectionId,
        instructorEmail,
      });
    }
  };

  const handleDismissInstructor = (
    sectionId: string,
    instructorEmail: string
  ) => {
    dismissInstructorMutation.mutate({
      sectionId,
      instructorEmail,
    });
  };

  const getSectionTypeIcon = () => {
    switch (sectionType) {
      case "LECTURE":
        return "🎓";
      case "TUTORIAL":
        return "📝";
      case "PRACTICAL":
        return "🔬";
      default:
        return "📚";
    }
  };

  const getSectionTypeColor = () => {
    switch (sectionType) {
      case "LECTURE":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "TUTORIAL":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "PRACTICAL":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getSectionLabel = (index: number) => {
    const letter = sectionType.charAt(0);
    return `${letter}${index + 1}`;
  };

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

  return (
    <div
      className={`relative flex h-full flex-col border-r transition-all duration-300 last:border-r-0 ${
        isCollapsed ? "w-12 flex-shrink-0" : "min-w-0 flex-1"
      }`}
    >
      {/* Collapse/Expand Button */}
      <div
        className={`absolute top-2 z-10 ${isCollapsed ? "left-1/2 -translate-x-1/2" : "right-2"}`}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-6 w-6 p-0"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {isCollapsed ? (
        // Collapsed state - just show the icon and section type vertically
        <div className="flex h-full flex-col items-center justify-center p-1 pt-8">
          <div className="flex flex-col items-center gap-8">
            <span className="text-xl">{getSectionTypeIcon()}</span>
            <div className="origin-center rotate-90 whitespace-nowrap text-xs font-medium tracking-wider">
              {sectionType}
            </div>
            <Badge
              variant="secondary"
              className={`${getSectionTypeColor()} flex min-w-[20px] items-center justify-center rounded-full px-1 py-0.5 text-xs`}
            >
              {allocationData?.sections?.filter((s) => s.type === sectionType)
                ?.length || 0}
            </Badge>
          </div>
        </div>
      ) : (
        // Expanded state - full content with scrolling
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex-shrink-0 border-b bg-background p-3 pr-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getSectionTypeIcon()}</span>
                <span className="font-medium">{sectionType}</span>
                <Badge variant="secondary" className={getSectionTypeColor()}>
                  {allocationData?.sections?.filter(
                    (s) => s.type === sectionType
                  )?.length || 0}
                </Badge>
              </div>
              {allocationData?.id && (
                <Button
                  onClick={handleAddSection}
                  size="sm"
                  variant="outline"
                  className="h-7"
                  disabled={addSectionMutation.isLoading}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Add
                </Button>
              )}
            </div>
          </div>

          {/* Scrollable Content */}
          <ScrollArea className="flex-1">
            <div className="space-y-2 p-3 pr-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : (
                // Show existing sections for this section type
                <div className="space-y-2">
                  {allocationData?.sections
                    ?.filter((section) => section.type === sectionType)
                    ?.map((section, index: number) => (
                      <div
                        key={section.id}
                        className="space-y-3 rounded-lg border p-3"
                      >
                        {/* Section Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {selectedCourse.code} - {getSectionLabel(index)}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {section.instructors?.length || 0} instructors
                            </Badge>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              onClick={() => {
                                setSelectedSectionId(section.id);
                                setIsAssignInstructorDialogOpen(true);
                              }}
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                            >
                              <UserPlus className="h-3 w-3" />
                            </Button>
                            <Button
                              onClick={() => handleRemoveSection(section.id)}
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                              disabled={removeSectionMutation.isLoading}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Instructors List */}
                        {section.instructors &&
                        section.instructors.length > 0 ? (
                          <div className="space-y-2">
                            <div className="text-xs font-medium text-muted-foreground">
                              Instructors:
                            </div>
                            <div className="space-y-1">
                              {section.instructors.map(
                                (instructor, idx: number) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between rounded-md border bg-card p-2 text-sm transition-colors hover:bg-accent"
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-medium">
                                        {instructor.name || "Unknown Name"}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {instructor.email}
                                      </span>
                                    </div>
                                    <Button
                                      onClick={() =>
                                        handleDismissInstructor(
                                          section.id,
                                          instructor.email
                                        )
                                      }
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                      disabled={
                                        dismissInstructorMutation.isLoading
                                      }
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs italic text-muted-foreground">
                            No instructors assigned
                          </div>
                        )}
                      </div>
                    ))}

                  {/* If no sections of this type exist in the allocation */}
                  {!allocationData?.sections?.some(
                    (s) => s.type === sectionType
                  ) && (
                    <div className="py-8 text-center text-muted-foreground">
                      <p className="text-sm">
                        No {sectionType.toLowerCase()} sections created yet
                      </p>
                      {allocationData?.id && (
                        <Button
                          onClick={handleAddSection}
                          size="sm"
                          variant="outline"
                          className="mt-2"
                          disabled={addSectionMutation.isLoading}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Create First Section
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Assign Instructor Dialog */}
      <Dialog
        open={isAssignInstructorDialogOpen}
        onOpenChange={setIsAssignInstructorDialogOpen}
      >
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
                      <CommandGroup>
                        {filteredInstructors.map((instructor) => (
                          <CommandItem
                            key={instructor.email}
                            value={instructor.email}
                            onSelect={() => {
                              handleAssignInstructor(instructor.email);
                              setInstructorSearchOpen(false);
                            }}
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
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SectionTypeColumn;
