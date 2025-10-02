import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/spinner";
import { Search, User, BookOpen, Users, Calendar } from "lucide-react";
import { allocationTypes } from "lib";
import api from "@/lib/axios-instance";
import { AxiosError } from "axios";
import { PreferredFaculty } from "node_modules/lib/src/types/allocationFormBuilder";
import { toast } from "sonner";
import { sectionTypes } from "../../../../lib/src/schemas/Allocation";

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
  const [instructorSearchValue, setInstructorSearchValue] = useState("");
  const [selectedInstructorEmail, setSelectedInstructorEmail] = useState<
    string | null
  >(null);

  const selectedSection = useMemo(() => {
    if (!allocationData?.sections || !selectedSectionId) return null;
    const section = allocationData.sections.find(
      (s) => s.id === selectedSectionId
    );
    if (!section) return null;
    const sectionsByType = allocationData.sections.filter(
      (s) => s.type === section.type
    );
    const sectionNumber =
      sectionsByType.findIndex((s) => s.id === selectedSectionId) + 1;

    return { ...section, sectionNumber };
  }, [allocationData?.sections, selectedSectionId]);

  // Fetch instructor list
  const { data: instructors = [], isLoading: instructorsLoading } = useQuery({
    queryKey: ["instructor-list"],
    queryFn: async () => {
      const response = await api.get<Instructor[]>(
        "/allocation/allocation/getInstructorList"
      );
      return response.data;
    },
    enabled: isOpen,
  });

  const { data: facultyPrefs } = useQuery({
    queryKey: [`faculty-prefs`],
    queryFn: async () => {
      try {
        const res = await api.get<PreferredFaculty[]>(
          `/allocation/allocation/getFacultyPrefs?email=${selectedInstructorEmail}`
        );
        return res.data;
      } catch (error) {
        toast.error(
          ((error as AxiosError).response?.data as string) ??
            "Failed to get faculty with preference"
        );
        throw error;
      }
    },
    enabled: !!selectedInstructorEmail,
  });

  // Fetch selected instructor details
  const { data: instructorDetails, isLoading: instructorDetailsLoading } =
    useQuery({
      queryKey: ["instructor-details", selectedInstructorEmail],
      queryFn: async () => {
        if (!selectedInstructorEmail) return null;
        const response =
          await api.get<allocationTypes.InstructorAllocationDetails>(
            `/allocation/allocation/instructor/details?email=${encodeURIComponent(selectedInstructorEmail)}`
          );
        return response.data;
      },
      enabled: !!selectedInstructorEmail,
    });

  const filteredInstructors = useMemo(() => {
    return instructors.filter((instructor) => {
      const matchesSearch =
        instructor.name
          ?.toLowerCase()
          .includes(instructorSearchValue.toLowerCase()) ||
        instructor.email
          .toLowerCase()
          .includes(instructorSearchValue.toLowerCase());

      if (!matchesSearch) return false;

      // Filter out already assigned instructors
      if (selectedSection) {
        const assignedEmails =
          selectedSection.instructors?.map((inst) => inst.email) || [];
        return !assignedEmails.includes(instructor.email);
      }

      return true;
    });
  }, [instructors, instructorSearchValue, selectedSection]);

  const handleAssignInstructor = () => {
    if (selectedInstructorEmail) {
      onAssignInstructor(selectedInstructorEmail);
      setSelectedInstructorEmail(null);
      setInstructorSearchValue("");
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setInstructorSearchValue("");
      setSelectedInstructorEmail(null);
    }
  };

  const getSectionTypeColor = (type: string) => {
    switch (type) {
      case "LECTURE":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "TUTORIAL":
        return "bg-green-100 text-green-800 border-green-300";
      case "PRACTICAL":
        return "bg-purple-100 text-purple-800 border-purple-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getAllocatedCourseLoad = () =>
    instructorDetails?.allAllocationsOfCoursesAllocatedToUser?.reduce(
      (acc, alloc) => {
        let courseWiseLoad = 0;

        sectionTypes.forEach((sectionType) => {
          alloc.sections[sectionType]
            ?.filter((section) =>
              instructorDetails.userAllocatedSections[sectionType]?.some(
                (userSection) => userSection.id === section.id
              )
            )
            .forEach((section) => {
              courseWiseLoad +=
                (sectionType === "LECTURE"
                  ? alloc.course.lectureUnits
                  : sectionType === "PRACTICAL"
                    ? alloc.course.practicalUnits
                    : 1) / section.instructors.length;
            });
        });

        return acc + courseWiseLoad;
      },
      0
    ) ?? 0;

  const getAllocatedSectionWiseLoad = (
    sectionType: (typeof sectionTypes)[number]
  ) =>
    instructorDetails?.allAllocationsOfCoursesAllocatedToUser?.reduce(
      (acc, alloc) => {
        let courseWiseLoad = 0;

        alloc.sections[sectionType]
          ?.filter((section) =>
            instructorDetails.userAllocatedSections[sectionType]?.some(
              (userSection) => userSection.id === section.id
            )
          )
          .forEach((section) => {
            courseWiseLoad +=
              (sectionType === "LECTURE"
                ? alloc.course.lectureUnits
                : sectionType === "PRACTICAL"
                  ? alloc.course.practicalUnits
                  : 1) / section.instructors.length;
          });

        return acc + courseWiseLoad;
      },
      0
    ) ?? 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="flex max-w-6xl flex-col">
        <DialogHeader className="relative h-fit">
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Assign Instructor
            {selectedSection && allocationData && (
              <div className="ml-4 flex items-center gap-2">
                <Badge variant="outline" className="text-sm">
                  {allocationData.courseCode}
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-sm ${getSectionTypeColor(selectedSection.type)}`}
                >
                  {selectedSection.type.charAt(0)}
                  {selectedSection.sectionNumber}
                </Badge>
                <div>
                  <Button
                    onClick={handleAssignInstructor}
                    disabled={isAssigning}
                    className="absolute -top-2 right-5"
                  >
                    {isAssigning ? (
                      <>
                        <LoadingSpinner className="mr-2 h-4 w-4" />
                        Assigning...
                      </>
                    ) : (
                      "Assign Instructor"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex h-[80vh] gap-6">
          {/* Left Column - Instructor Selection */}
          <div className="flex w-1/3 flex-col">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <Input
                  placeholder="Search instructors..."
                  value={instructorSearchValue}
                  onChange={(e) => setInstructorSearchValue(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex h-full overflow-y-auto rounded-md border">
              {instructorsLoading ? (
                <div className="flex items-center justify-center p-4">
                  <LoadingSpinner />
                </div>
              ) : filteredInstructors.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No instructors found
                </div>
              ) : (
                <div className="flex flex-col space-y-1 overflow-y-auto p-2">
                  {filteredInstructors.map((instructor) => (
                    <div
                      key={instructor.email}
                      onClick={() =>
                        setSelectedInstructorEmail(instructor.email)
                      }
                      className={`cursor-pointer rounded-md p-3 transition-colors hover:bg-gray-100 ${
                        selectedInstructorEmail === instructor.email
                          ? "border border-blue-200 bg-blue-50"
                          : "border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">
                            {instructor.name || instructor.email}
                          </div>
                          <div className="truncate text-xs text-gray-500">
                            {instructor.email}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <>
            {selectedInstructorEmail ? (
              <div className="grid grid-cols-2 gap-x-2">
                <div className="h-full overflow-y-auto">
                  <Card className="mb-4">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Selected Instructor
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Name:</span>{" "}
                          {instructors.find(
                            (i) => i.email === selectedInstructorEmail
                          )?.name || "N/A"}
                        </div>
                        <div>
                          <span className="font-medium">Email:</span>{" "}
                          {selectedInstructorEmail}
                        </div>
                        <Badge className="p-2 tracking-wide">
                          <strong>
                            Allocated Load : {getAllocatedCourseLoad()}
                          </strong>
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <div>
                    {instructorDetailsLoading ? (
                      <div className="flex items-center justify-center p-8">
                        <LoadingSpinner />
                      </div>
                    ) : instructorDetails ? (
                      <div className="space-y-4">
                        {/* Current Allocations */}
                        {Object.keys(
                          instructorDetails.userAllocatedSections ?? {}
                        ).length > 0 && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Current Allocations
                              </CardTitle>
                              <CardDescription>
                                Sections currently allocated to this instructor
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                {Object.entries(
                                  instructorDetails.userAllocatedSections
                                ).map(([sectionType, sections]) => (
                                  <div
                                    key={sectionType}
                                    className="flex flex-col space-y-2"
                                  >
                                    <Badge
                                      className={`mb-2 ${getSectionTypeColor(sectionType)}`}
                                    >
                                      {sectionType}
                                    </Badge>
                                    <div className="ml-4 space-y-2">
                                      {sections.map((section, index) => (
                                        <div
                                          key={index}
                                          className="rounded bg-gray-50 p-2 text-sm"
                                        >
                                          <div className="font-medium">
                                            {section.master.courseCode}
                                          </div>
                                          <div className="text-xs text-gray-600">
                                            IC: {section.master.ic ?? "Not Set"}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                    <Badge
                                      variant="outline"
                                      className="text-sm"
                                    >
                                      Credit Load:{" "}
                                      {getAllocatedSectionWiseLoad(
                                        sectionType as (typeof sectionTypes)[number]
                                      )}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Course Statistics */}
                        {instructorDetails
                          .allAllocationsOfCoursesAllocatedToUser?.length >
                          0 && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4" />
                                Course Overview
                              </CardTitle>
                              <CardDescription>
                                All courses where this instructor has
                                allocations
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                {instructorDetails.allAllocationsOfCoursesAllocatedToUser.map(
                                  (allocation) => (
                                    <div
                                      key={allocation.id}
                                      className="rounded-lg border p-4"
                                    >
                                      <div className="mb-3 flex items-start justify-between">
                                        <div>
                                          <div className="font-medium">
                                            {allocation.courseCode}
                                          </div>
                                          <div className="text-sm text-gray-600">
                                            {allocation.course.name}
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            IC: {allocation.ic}
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <div className="flex gap-1">
                                            <Badge
                                              variant="outline"
                                              className="text-xs"
                                            >
                                              {allocation.course.offeredAs}
                                            </Badge>
                                            <Badge
                                              variant="outline"
                                              className="text-xs"
                                            >
                                              {allocation.course.offeredTo}
                                            </Badge>
                                          </div>
                                          <div className="mt-1 text-xs text-gray-500">
                                            {allocation.course.totalUnits} units
                                          </div>
                                        </div>
                                      </div>

                                      <div className="space-y-2">
                                        {Object.entries(
                                          allocation.sections
                                        ).map(
                                          ([sectionType, sections]) =>
                                            sections.length > 0 && (
                                              <div
                                                key={sectionType}
                                                className="flex items-center gap-2 text-sm"
                                              >
                                                <Badge
                                                  variant="outline"
                                                  className={`text-xs ${getSectionTypeColor(sectionType)}`}
                                                >
                                                  {sectionType}
                                                </Badge>
                                                <div className="flex items-center gap-1">
                                                  <Users className="h-3 w-3 text-gray-400" />
                                                  <span className="text-xs text-gray-600">
                                                    {sections.length} section
                                                    {sections.length !== 1
                                                      ? "s"
                                                      : ""}{" "}
                                                    •{" "}
                                                    {sections.reduce(
                                                      (acc, section) =>
                                                        acc +
                                                        section.instructors
                                                          .length,
                                                      0
                                                    )}{" "}
                                                    instructor
                                                    {sections.reduce(
                                                      (acc, section) =>
                                                        acc +
                                                        section.instructors
                                                          .length,
                                                      0
                                                    ) !== 1
                                                      ? "s"
                                                      : ""}
                                                  </span>
                                                </div>
                                              </div>
                                            )
                                        )}
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {Object.keys(
                          instructorDetails.userAllocatedSections ?? {}
                        ).length === 0 &&
                          instructorDetails
                            .allAllocationsOfCoursesAllocatedToUser?.length ===
                            0 && (
                            <Card>
                              <CardContent className="p-8 text-center">
                                <BookOpen className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                                <div className="text-gray-600">
                                  No current allocations found for this
                                  instructor
                                </div>
                              </CardContent>
                            </Card>
                          )}
                      </div>
                    ) : (
                      <Card>
                        <CardContent className="p-8 text-center">
                          <div className="text-gray-600">
                            No allocation details available
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
                <div className="flex h-full flex-col space-y-2 overflow-y-auto">
                  <h2 className="h-fit w-full text-center text-xl font-bold">
                    Instructor Form Response
                  </h2>
                  <div className="flex h-full flex-col space-y-2 overflow-y-auto p-2">
                    {facultyPrefs?.map((pref) => (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between gap-2">
                            <h5>{pref.courseCode}</h5>
                            <Badge
                              variant="outline"
                              className={`text-xs ${getSectionTypeColor(pref.templateField.preferenceType ?? pref.templateField.type)}`}
                            >
                              {pref.templateField.preferenceType}
                            </Badge>
                          </CardTitle>
                          <CardDescription>{pref.course.name}</CardDescription>
                        </CardHeader>
                        <CardContent>Preference: {pref.preference}</CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Card className="flex-1">
                <CardContent className="flex h-full items-center justify-center">
                  <div className="text-center text-gray-500">
                    <User className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                    <div>Select an instructor to view details</div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignInstructorDialog;
