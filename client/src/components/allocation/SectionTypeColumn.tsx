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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { toast } from "sonner";
import { TTDRoom } from "node_modules/lib/src/types/allocation";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface SectionTypeColumnProps {
  sectionType: (typeof allocationSchemas.sectionTypes)[number];
  allocationData: allocationTypes.AllocationResponse;
  isLoading: boolean;
  onAssignInstructor: (sectionId: string) => void;
  rooms?: TTDRoom[] | null;
}

const SectionTypeColumn: React.FC<SectionTypeColumnProps> = ({
  sectionType,
  allocationData,
  isLoading,
  onAssignInstructor,
  rooms,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const queryClient = useQueryClient();

  const setRoomMuatation = useMutation({
    mutationFn: async (data: { sectionId: string; roomId: string }) => {
      await api.post("/allocation/allocation/section/setRoom", data);
    },
    onSuccess: () => {
      toast.success("Section updated successfully");
      void queryClient.invalidateQueries({
        queryKey: ["allocation"],
      });
    },
    onError: (error) => {
      toast.error(
        (error as { response: { data: string } }).response?.data ||
          "Failed to update section"
      );
    },
  });

  const addSectionMutation = useMutation({
    mutationFn: async (data: { masterId: string; sectionType: string }) => {
      await api.post("/allocation/allocation/section/add", data);
    },
    onSuccess: () => {
      toast.success("Section added successfully");
      void queryClient.invalidateQueries({
        queryKey: ["allocation"],
      });
    },
    onError: (error) => {
      toast.error(
        (error as { response: { data: string } }).response?.data ||
          "Failed to add section"
      );
    },
  });

  const removeSectionMutation = useMutation({
    mutationFn: async (sectionId: string) => {
      await api.delete("/allocation/allocation/section/remove", {
        data: { sectionId },
      });
    },
    onSuccess: () => {
      toast.success("Section removed successfully");
      void queryClient.invalidateQueries({
        queryKey: ["allocation"],
      });
    },
    onError: (error) => {
      toast.error(
        (error as { response: { data: string } })?.response?.data ||
          "Failed to remove section"
      );
    },
  });

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
        queryKey: ["allocation"],
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

  const handleDismissInstructor = (
    sectionId: string,
    instructorEmail: string
  ) => {
    dismissInstructorMutation.mutate({
      sectionId,
      instructorEmail,
    });
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

  return (
    <div
      className={`relative flex h-full flex-col border-r transition-all duration-300 last:border-r-0 ${
        isCollapsed ? "w-12 flex-shrink-0" : "min-w-0 flex-1"
      }`}
    >
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
        <div className="flex h-full flex-col items-center justify-center p-1 pt-8">
          <div className="flex flex-col items-center gap-8">
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
        <div className="flex h-full flex-col">
          <div className="flex-shrink-0 border-b bg-background p-3 pr-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">{sectionType}</span>
                <Badge variant="secondary" className={getSectionTypeColor()}>
                  {
                    allocationData?.sections?.filter(
                      (section) =>
                        section.type === sectionType &&
                        !!section.instructors.length
                    ).length
                  }{" "}
                  /{" "}
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

          <ScrollArea className="flex-1">
            <div className="space-y-2 p-3 pr-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : (
                <div className="space-y-2">
                  {allocationData?.sections
                    ?.filter((section) => section.type === sectionType)
                    ?.map((section, index: number) => (
                      <div
                        key={section.id}
                        className="space-y-3 rounded-lg border p-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="flex-shrink-0 text-sm font-medium">
                              {getSectionLabel(index)}
                            </span>

                            {sectionType === "PRACTICAL" && (
                              <div className="flex flex-shrink items-center gap-1 overflow-hidden">
                                <Select
                                  defaultValue={section.timetableRoomId ?? undefined}
                                  onValueChange={(roomId) => {
                                    if (roomId !== section.timetableRoomId)
                                      setRoomMuatation.mutate({
                                        sectionId: section.id,
                                        roomId,
                                      });
                                  }}
                                >
                                  <SelectTrigger className="h-7 w-[90px] max-w-[90px] text-xs">
                                    <SelectValue placeholder="Room" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {rooms?.map((room) => (
                                      <SelectItem key={room._id} value={room._id}>
                                        {room.roomNumber}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-shrink-0 gap-1">
                            <Button
                              onClick={() => onAssignInstructor(section.id)}
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
                                      <span
                                        className={
                                          allocationData.ic?.email ===
                                          instructor.email
                                            ? "font-semibold"
                                            : "font-medium"
                                        }
                                      >
                                        {instructor.name ?? "Unknown Name"} -{" "}
                                        {instructor.type === "faculty"
                                          ? "Faculty"
                                          : "PhD"}
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
    </div>
  );
};

export default SectionTypeColumn;
