import React, { useState, useMemo, useEffect } from "react";
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
import { Search, User, BookOpen, Calendar } from "lucide-react";
import { allocationTypes } from "lib";
import api from "@/lib/axios-instance";
import { AxiosError } from "axios";
import { PreferredFaculty } from "node_modules/lib/src/types/allocationFormBuilder";
import { toast } from "sonner";
import { sectionTypes } from "../../../../lib/src/schemas/Allocation";
import {
  InstructorAllocationDetails,
  InstructorWithPreference,
} from "node_modules/lib/src/types/allocation";

interface AssignInstructorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  courseCode?: string | null;
  selectedSectionId: string;
  allocationData: allocationTypes.AllocationResponse | null;
  onAssignInstructor: (instructorEmail: string, close?: boolean) => void;
  isAssigning: boolean;
  userTypeViewMode?: "faculty" | "phd";
  viewModeInstructorEmail?: string | null;
}

export const getAllocatedCourseLoad = (
  instructorDetails:
    | allocationTypes.InstructorAllocationDetails
    | undefined
    | null,
  sectionType?: (typeof sectionTypes)[number]
) =>
  instructorDetails
    ? (
        Object.values(
          instructorDetails
        ) as InstructorAllocationDetails[keyof InstructorAllocationDetails][]
      )
        .flat()
        .filter((section) =>
          sectionType ? section.type === sectionType : true
        )
        .reduce((acc, section) => {
          let courseWiseLoad = 0;

          courseWiseLoad +=
            (section.type === "LECTURE"
              ? section.master.course.lectureUnits
              : section.type === "PRACTICAL"
                ? section.master.course.practicalUnits
                : 1) /
            section.instructors.filter((inst) => inst.type === "faculty")
              .length;

          return acc + courseWiseLoad;
        }, 0)
    : 0;

const AssignInstructorDialog: React.FC<AssignInstructorDialogProps> = ({
  isOpen,
  onOpenChange,
  selectedSectionId,
  courseCode,
  userTypeViewMode,
  allocationData,
  onAssignInstructor,
  isAssigning,
  viewModeInstructorEmail,
}) => {
  const [instructorSearchValue, setInstructorSearchValue] = useState("");
  const [selectedInstructorEmail, setSelectedInstructorEmail] = useState<
    string | null
  >(viewModeInstructorEmail ?? null);

  useEffect(() => {
    if (viewModeInstructorEmail)
      setSelectedInstructorEmail(viewModeInstructorEmail);
  }, [viewModeInstructorEmail]);

  const [selectedViewOtherResponsesInfo, setSelectedViewOtherResponsesInfo] =
    useState<{
      courseCode: string;
      sectionType: (typeof sectionTypes)[number];
    } | null>(null);

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
    queryKey: [
      "instructor-list",
      courseCode,
      selectedSection?.type,
      userTypeViewMode,
    ],
    queryFn: async () => {
      const response = await api.get<InstructorWithPreference[]>(
        `/allocation/allocation/getInstructorListWithPref?code=${courseCode}&sectionType=${selectedSection?.type}&userType=${userTypeViewMode}`
      );
      return response.data;
    },
    enabled: isOpen && !!selectedSection && !!courseCode && !!userTypeViewMode,
  });

  const { data: courseSectionPrefs } = useQuery({
    queryKey: [
      "course instructor response",
      selectedViewOtherResponsesInfo?.courseCode,
      selectedViewOtherResponsesInfo?.sectionType,
    ],
    queryFn: async ({ queryKey }) => {
      try {
        const [_, courseCode, sectionType] = queryKey;
        const res = await api.get<PreferredFaculty[]>(
          `/allocation/allocation/getPrefsCourse?code=${courseCode}&sectionType=${sectionType}`
        );
        return res.data;
      } catch (error) {
        toast.error(
          ((error as AxiosError).response?.data as string) ??
            "Failed to get instructor with preference"
        );
        throw error;
      }
    },
    enabled: !!selectedViewOtherResponsesInfo,
  });

  const { data: instructorPrefs } = useQuery({
    queryKey: [`instructor-prefs`, courseCode, selectedInstructorEmail],
    queryFn: async () => {
      try {
        const res = await api.get<PreferredFaculty[]>(
          `/allocation/allocation/getInstructorPrefs?email=${selectedInstructorEmail}`
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

  const handleAssignInstructor = (close: boolean = false) => {
    if (selectedInstructorEmail) {
      onAssignInstructor(selectedInstructorEmail, close);
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

  const getSectionNumber = (
    sectionId: string,
    masterId: string,
    type: (typeof sectionTypes)[number]
  ) =>
    instructorDetails
      ? instructorDetails[type]
          .filter((s) => s.master.id === masterId)
          .findIndex((s) => s.id === sectionId) + 1
      : null;

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="flex w-[90%] max-w-[90%] flex-col">
        <DialogHeader className="relative h-fit">
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {viewModeInstructorEmail
              ? "Instructor Details"
              : "Assign Instructor"}
            {selectedSection && allocationData && (
              <div className="ml-4 flex items-center gap-2">
                <Badge variant="outline" className="text-sm">
                  {allocationData.course.name} - {allocationData.courseCode}
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
                    onClick={() => handleAssignInstructor()}
                    disabled={isAssigning}
                    className="absolute -top-2 right-52"
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
                  <Button
                    onClick={() => handleAssignInstructor(true)}
                    disabled={isAssigning}
                    className="absolute -top-2 right-5"
                    variant='secondary'
                  >
                    {isAssigning ? (
                      <>
                        <LoadingSpinner className="mr-2 h-4 w-4" />
                        Assigning...
                      </>
                    ) : (
                      "Assign Instructor & Close"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex h-[80vh] w-full gap-6">
          {!viewModeInstructorEmail && (
            <div className="flex w-[20vw] flex-col">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 -translate-y-1/2 transform text-gray-400" />
                  <Input
                    placeholder="Search instructors..."
                    value={instructorSearchValue}
                    onChange={(e) => setInstructorSearchValue(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex h-full w-full overflow-y-auto rounded-md border">
                {instructorsLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <LoadingSpinner />
                  </div>
                ) : filteredInstructors.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No instructors found
                  </div>
                ) : (
                  <div className="flex w-full flex-col space-y-1 overflow-y-auto p-2">
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
                            <div className="truncate text-xs font-semibold text-gray-500">
                              Preference Given:{" "}
                              {instructor.preference ?? "Not Given"}
                            </div>
                            <div className="truncate text-xs font-semibold text-gray-500">
                              Type:{" "}
                              {instructor.type === "phd" ? "PhD" : "Faculty"}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex-1">
            {selectedInstructorEmail ? (
              <div className="grid h-full grid-cols-2 gap-x-2">
                <div className="h-full overflow-y-auto">
                  <>
                    {instructorDetailsLoading ? (
                      <div className="flex items-center justify-center p-8">
                        <LoadingSpinner />
                      </div>
                    ) : instructorDetails ? (
                      <>
                        {/* Current Allocations */}
                        {Object.keys(instructorDetails ?? {}).length > 0 && (
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
                            <CardContent className="space-y-4">
                              {Object.entries(instructorDetails).map(
                                ([sectionType, sections]) => (
                                  <div
                                    key={sectionType}
                                    className="flex flex-col space-y-2"
                                  >
                                    <div>
                                      {sections.map((section, index) => (
                                        <div
                                          key={index}
                                          className="rounded bg-gray-50 text-sm"
                                        >
                                          <div className={`py-1 font-medium`}>
                                            <span
                                              className={
                                                getSectionTypeColor(
                                                  section.type
                                                ) + " p-1"
                                              }
                                            >
                                              {section.type.charAt(0)}
                                              {getSectionNumber(
                                                section.id,
                                                section.master.id,
                                                section.type
                                              )}
                                            </span>
                                            {" - "}
                                            <span>
                                              {section.master.course.name} -{" "}
                                              {section.master.course.code}
                                            </span>
                                          </div>
                                          <div className="text-xs text-gray-600">
                                            IC: {section.master.ic ?? "Not Set"}
                                          </div>
                                          <div className="mt-1 text-sm">
                                            <div className="font-medium">
                                              Instructors:
                                            </div>
                                            <ol className="ml-3 mt-1 list-inside list-decimal space-y-0.5 text-xs">
                                              {section.instructors.map(
                                                (i, idx) => (
                                                  <li
                                                    key={i.email ?? idx}
                                                    className="truncate"
                                                  >
                                                    <span className="font-light">
                                                      {i.name ?? "N/A"}
                                                    </span>
                                                  </li>
                                                )
                                              )}
                                            </ol>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                    <Badge
                                      variant="outline"
                                      className="w-fit text-sm"
                                    >
                                      {sectionType} Credit Load:{" "}
                                      {getAllocatedCourseLoad(
                                        instructorDetails,
                                        sectionType as (typeof sectionTypes)[number]
                                      )}
                                    </Badge>
                                  </div>
                                )
                              )}
                              <Badge variant="outline" className="text-md">
                                <span>
                                  <strong>Total Allocated Load</strong>:{" "}
                                  {getAllocatedCourseLoad(instructorDetails)}
                                </span>
                              </Badge>
                            </CardContent>
                          </Card>
                        )}

                        {Object.keys(instructorDetails ?? {}).length === 0 && (
                          <Card>
                            <CardContent className="p-8 text-center">
                              <BookOpen className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                              <div className="text-gray-600">
                                No current allocations found for this instructor
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </>
                    ) : (
                      <Card>
                        <CardContent className="p-8 text-center">
                          <div className="text-gray-600">
                            No allocation details available
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                </div>
                <div className="flex h-full flex-col space-y-2 overflow-y-auto">
                  <h2 className="h-fit w-full text-center text-xl font-bold">
                    Instructor Response
                  </h2>
                  <div className="flex h-full flex-col space-y-2 overflow-y-auto p-2">
                    {instructorPrefs?.map((pref) => (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between gap-2">
                            <h5>
                              {pref.courseCode} - {pref.course.name}
                            </h5>
                            <Badge
                              variant="outline"
                              className={`text-xs ${getSectionTypeColor(pref.templateField.preferenceType ?? pref.templateField.type)}`}
                            >
                              {pref.templateField.preferenceType}
                            </Badge>
                          </CardTitle>
                          <CardDescription>
                            <div className="flex justify-between">
                              <span>Preference: {pref.preference}</span>
                              <Button
                                variant="link"
                                className="m-0 p-0 text-xs"
                                onClick={() => {
                                  if (
                                    selectedViewOtherResponsesInfo &&
                                    selectedViewOtherResponsesInfo.courseCode ===
                                      pref.courseCode &&
                                    selectedViewOtherResponsesInfo.sectionType ===
                                      pref.templateField.preferenceType
                                  )
                                    setSelectedViewOtherResponsesInfo(null);
                                  else
                                    setSelectedViewOtherResponsesInfo({
                                      courseCode: pref.courseCode!,
                                      sectionType:
                                        pref.templateField.preferenceType!,
                                    });
                                }}
                              >
                                {selectedViewOtherResponsesInfo &&
                                selectedViewOtherResponsesInfo.courseCode ===
                                  pref.courseCode &&
                                selectedViewOtherResponsesInfo.sectionType ===
                                  pref.templateField.preferenceType
                                  ? "Close"
                                  : "View Other Responses"}
                              </Button>
                            </div>
                          </CardDescription>
                          {courseSectionPrefs &&
                            courseSectionPrefs.length > 0 &&
                            selectedViewOtherResponsesInfo &&
                            selectedViewOtherResponsesInfo.courseCode ===
                              pref.courseCode &&
                            selectedViewOtherResponsesInfo.sectionType ===
                              pref.templateField.preferenceType && (
                              <CardContent className="mt-2 border-t pt-2">
                                <div className="text-sm font-semibold">
                                  Other Faculty Preferences for this Course:
                                </div>
                                <ul className="list-inside list-disc space-y-1 text-xs">
                                  {courseSectionPrefs
                                    .filter(
                                      (cfp) =>
                                        cfp.submittedBy.email !=
                                        selectedInstructorEmail
                                    )
                                    .map((cfp) => (
                                      <li key={cfp.submittedBy.email}>
                                        {cfp.submittedBy.name}
                                        {" - "}
                                        <span className="font-medium">
                                          {cfp.preference}
                                        </span>
                                      </li>
                                    ))}
                                </ul>
                              </CardContent>
                            )}
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Card className="h-full">
                <CardContent className="flex h-full items-center justify-center">
                  <div className="text-center text-gray-500">
                    <User className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                    <div>Select an instructor to view details</div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignInstructorDialog;
