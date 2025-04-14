import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Types from AssignExaminers
interface ISubArea {
  id: number;
  subarea: string;
  examiners?: IExaminer[];
}

interface IExaminer {
  id: number;
  suggestedExaminer: string[];
  examiner: string | null;
}

interface IPhDStudent {
  email: string;
  name: string;
  qualifyingArea1: string | null;
  qualifyingArea2: string | null;
}

interface ISupervisor {
  email: string;
  name: string;
  students: IPhDStudent[];
}

interface ISubAreasExaminerResponse {
  success: boolean;
  subAreas: ISubArea[];
}

interface ISupervisorsResponse {
  success: boolean;
  supervisors: ISupervisor[];
}

interface IExamGroup {
  email: string;
  name: string;
  subAreaId: number;
  subArea: string;
  examiner: string;
}

interface ISession {
  sessionNumber: number;
  exams: IExamGroup[];
}

interface ITimetableResponse {
  success: boolean;
  timetable: ISession[];
  conflicts?: string[];
}

// Enhanced student interface with examiner information
interface IEnhancedStudent extends IPhDStudent {
  area1Id?: number;
  area2Id?: number;
  suggestedExaminers1: string[];
  suggestedExaminers2: string[];
  selectedExaminer1: string;
  selectedExaminer2: string;
}

interface ExaminerManagementPanelProps {
  selectedSemester: number | null;
  onNext: () => void;
  onBack: () => void;
}

const ExaminerManagementPanel: React.FC<ExaminerManagementPanelProps> = ({
  onNext,
  onBack,
}) => {
  const queryClient = useQueryClient();
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [selectedSupervisors, setSelectedSupervisors] = useState<string[]>([]);
  const [examinerTabView, setExaminerTabView] = useState("supervisors");
  const [studentExaminers, setStudentExaminers] = useState<
    Record<string, { area1: string; area2: string }>
  >({});
  const [timetableDialogOpen, setTimetableDialogOpen] = useState(false);

  // Fetch supervisor data
  const { data: supervisorsData, isLoading: loadingSupervisors } = useQuery<
    ISupervisorsResponse,
    Error
  >({
    queryKey: ["phd-supervisors"],
    queryFn: async () => {
      const response = await api.get<ISupervisorsResponse>(
        "/phd/drcMember/getSupervisorsWithStudents"
      );
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch sub-areas and examiner data
  const { data: subAreasData, isLoading: loadingSubAreas } = useQuery<
    ISubAreasExaminerResponse,
    Error
  >({
    queryKey: ["phd-sub-areas-examiners"],
    queryFn: async () => {
      const response = await api.get<ISubAreasExaminerResponse>(
        "/phd/drcMember/getSubAreasAndExaminer"
      );
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch timetable data with manual trigger
  const {
    data: timetableData,
    isLoading: loadingTimetable,
    refetch: refetchTimetable,
  } = useQuery<ITimetableResponse, Error>({
    queryKey: ["phd-exam-timetable"],
    queryFn: async () => {
      const response = await api.get<ITimetableResponse>(
        "/phd/drcMember/getQeTimeTable"
      );
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: false, // Don't fetch automatically
  });

  // Process data to get a student-centric view
  const enhancedStudents: IEnhancedStudent[] = React.useMemo(() => {
    if (!supervisorsData?.supervisors || !subAreasData?.subAreas) {
      return [];
    }

    // Map subareas to their IDs and examiners
    const subareaMap = new Map<
      string,
      { id: number; examiners: IExaminer[] }
    >();
    subAreasData.subAreas.forEach((subarea) => {
      subareaMap.set(subarea.subarea, {
        id: subarea.id,
        examiners: subarea.examiners || [],
      });
    });

    // Flatten students from all supervisors and enhance with examiner info
    const students: IEnhancedStudent[] = [];

    supervisorsData.supervisors.forEach((supervisor) => {
      supervisor.students.forEach((student) => {
        if (student.qualifyingArea1 || student.qualifyingArea2) {
          const area1Data = student.qualifyingArea1
            ? subareaMap.get(student.qualifyingArea1)
            : undefined;
          const area2Data = student.qualifyingArea2
            ? subareaMap.get(student.qualifyingArea2)
            : undefined;

          students.push({
            ...student,
            area1Id: area1Data?.id,
            area2Id: area2Data?.id,
            suggestedExaminers1:
              area1Data?.examiners.flatMap((e) => e.suggestedExaminer) || [],
            suggestedExaminers2:
              area2Data?.examiners.flatMap((e) => e.suggestedExaminer) || [],
            selectedExaminer1:
              studentExaminers[student.email]?.area1 ||
              area1Data?.examiners[0]?.examiner ||
              "",
            selectedExaminer2:
              studentExaminers[student.email]?.area2 ||
              area2Data?.examiners[0]?.examiner ||
              "",
          });
        }
      });
    });

    return students;
  }, [supervisorsData, subAreasData, studentExaminers]);

  // Mutation for notifying supervisors
  const notifySupervisorMutation = useMutation({
    mutationFn: async (data: {
      supervisorEmail: string;
      deadline?: string;
    }) => {
      return await api.post("/phd/drcMember/notifySupervisor", data);
    },
    onSuccess: () => {
      toast.success("Notification sent successfully");
      setNotificationDialogOpen(false);
      setSelectedSupervisors([]);
      setDeadline(undefined);
    },
    onError: () => {
      toast.error("Failed to send notification");
    },
  });

  // Mutation for updating examiner
  const updateExaminerMutation = useMutation({
    mutationFn: async (data: {
      subAreaId: number;
      examinerEmail: string;
      studentEmail?: string;
    }) => {
      return await api.post("/phd/drcMember/updateExaminer", data);
    },
    onSuccess: () => {
      toast.success("Examiners updated successfully");
      void queryClient.invalidateQueries({
        queryKey: ["phd-sub-areas-examiners"],
      });
    },
    onError: () => {
      toast.error("Failed to update examiner");
    },
  });

  const handleSelectAllSupervisors = () => {
    if (!supervisorsData?.supervisors) return;

    if (selectedSupervisors.length === supervisorsData.supervisors.length) {
      setSelectedSupervisors([]);
    } else {
      setSelectedSupervisors(
        supervisorsData.supervisors.map((sup) => sup.email)
      );
    }
  };

  const toggleSupervisorSelection = (email: string) => {
    setSelectedSupervisors((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  const handleNotifySupervisors = () => {
    if (selectedSupervisors.length === 0) {
      toast.error("Please select at least one supervisor");
      return;
    }

    selectedSupervisors.forEach((supervisorEmail) => {
      notifySupervisorMutation.mutate({
        supervisorEmail,
        deadline: deadline ? deadline.toISOString() : undefined,
      });
    });
  };

  const handleViewTimetable = () => {
    refetchTimetable()
      .then(() => {
        setTimetableDialogOpen(true);
      })
      .catch(() => {
        toast.error("Failed to fetch timetable data");
      });
  };

  const handleExaminerChange = (
    studentEmail: string,
    areaNumber: 1 | 2,
    examinerEmail: string,
    areaId?: number
  ) => {
    if (!areaId) {
      toast.error("Area ID not found");
      return;
    }

    // Update local state for immediate UI feedback
    setStudentExaminers((prev) => ({
      ...prev,
      [studentEmail]: {
        ...prev[studentEmail],
        [`area${areaNumber}`]: examinerEmail,
      },
    }));

    // Update on server
    updateExaminerMutation.mutate({
      subAreaId: areaId,
      examinerEmail,
      studentEmail,
    });
  };

  const saveAllExaminers = () => {
    let updatedCount = 0;

    enhancedStudents.forEach((student) => {
      if (student.area1Id && student.selectedExaminer1) {
        updateExaminerMutation.mutate({
          subAreaId: student.area1Id,
          examinerEmail: student.selectedExaminer1,
          studentEmail: student.email,
        });
        updatedCount++;
      }

      if (student.area2Id && student.selectedExaminer2) {
        updateExaminerMutation.mutate({
          subAreaId: student.area2Id,
          examinerEmail: student.selectedExaminer2,
          studentEmail: student.email,
        });
        updatedCount++;
      }
    });

    if (updatedCount > 0) {
      toast.success(`Updated ${updatedCount} examiner assignments`);
    } else {
      toast.info("No examiner assignments to update");
    }
  };

  if (loadingSupervisors || loadingSubAreas) {
    return (
      <div className="py-8 text-center">
        Loading examiner management data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Examiner Management</h2>

      <Tabs value={examinerTabView} onValueChange={setExaminerTabView}>
        <TabsList className="mb-6 grid w-full grid-cols-2">
          <TabsTrigger value="supervisors">1. Notify Supervisors</TabsTrigger>
          <TabsTrigger value="examiners">2. Assign Examiners</TabsTrigger>
        </TabsList>

        <TabsContent value="supervisors">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-medium">PhD Supervisors</h3>
            <div className="flex gap-4">
              <Button variant="outline" onClick={handleSelectAllSupervisors}>
                {selectedSupervisors.length ===
                supervisorsData?.supervisors.length
                  ? "Deselect All"
                  : "Select All"}
              </Button>
              <Button
                onClick={() => setNotificationDialogOpen(true)}
                disabled={selectedSupervisors.length === 0}
              >
                Notify Selected Supervisors
              </Button>
            </div>
          </div>

          {!supervisorsData?.supervisors ||
          supervisorsData.supervisors.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No supervisors with PhD students found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Select</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>PhD Students</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supervisorsData.supervisors.map((supervisor) => (
                  <TableRow key={supervisor.email}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedSupervisors.includes(supervisor.email)}
                        onChange={() =>
                          toggleSupervisorSelection(supervisor.email)
                        }
                        className="h-4 w-4"
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {supervisor.name}
                    </TableCell>
                    <TableCell>{supervisor.email}</TableCell>
                    <TableCell>{supervisor.students.length}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedSupervisors([supervisor.email]);
                          setNotificationDialogOpen(true);
                        }}
                      >
                        Notify
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="examiners">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-medium">
              Student Examiner Assignments
            </h3>
            <div className="flex gap-4">
              <Button
                onClick={saveAllExaminers}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                Save All Assignments
              </Button>
              <Button
                onClick={handleViewTimetable}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                View Exam Timetable
              </Button>
            </div>
          </div>

          <p className="mb-4 text-sm text-gray-500">
            Assign examiners to each student's qualifying areas from the
            suggested examiners.
          </p>

          {enhancedStudents.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No students with qualifying areas found
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Qualifying Area 1</TableHead>
                    <TableHead>Examiner for Area 1</TableHead>
                    <TableHead>Qualifying Area 2</TableHead>
                    <TableHead>Examiner for Area 2</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enhancedStudents.map((student) => (
                    <TableRow key={student.email}>
                      <TableCell className="font-medium">
                        {student.name}
                      </TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{student.qualifyingArea1 || "N/A"}</TableCell>
                      <TableCell>
                        {student.qualifyingArea1 && student.area1Id ? (
                          <Select
                            value={student.selectedExaminer1}
                            onValueChange={(value) =>
                              handleExaminerChange(
                                student.email,
                                1,
                                value,
                                student.area1Id
                              )
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select Examiner" />
                            </SelectTrigger>
                            <SelectContent>
                              {student.suggestedExaminers1.length > 0 ? (
                                student.suggestedExaminers1.map(
                                  (examiner, index) => (
                                    <SelectItem
                                      key={`${student.email}-area1-${index}`}
                                      value={examiner}
                                    >
                                      {examiner}
                                    </SelectItem>
                                  )
                                )
                              ) : (
                                <SelectItem
                                  value="no-examiners-available"
                                  disabled
                                >
                                  No suggested examiners
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-gray-500">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>{student.qualifyingArea2 || "N/A"}</TableCell>
                      <TableCell>
                        {student.qualifyingArea2 && student.area2Id ? (
                          <Select
                            value={student.selectedExaminer2}
                            onValueChange={(value) =>
                              handleExaminerChange(
                                student.email,
                                2,
                                value,
                                student.area2Id
                              )
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select Examiner" />
                            </SelectTrigger>
                            <SelectContent>
                              {student.suggestedExaminers2.length > 0 ? (
                                student.suggestedExaminers2.map(
                                  (examiner, index) => (
                                    <SelectItem
                                      key={`${student.email}-area2-${index}`}
                                      value={examiner}
                                    >
                                      {examiner}
                                    </SelectItem>
                                  )
                                )
                              ) : (
                                <SelectItem
                                  value="no-examiners-available"
                                  disabled
                                >
                                  No suggested examiners
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-gray-500">N/A</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex justify-between">
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Form Generation
        </Button>

        <Button onClick={onNext} className="bg-blue-600 hover:bg-blue-700">
          Next: Update Results <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Notification Dialog */}
      <Dialog
        open={notificationDialogOpen}
        onOpenChange={setNotificationDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Notify Supervisor(s)</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <div className="mb-4">
              <h4 className="mb-2 text-sm font-medium">
                Selected Supervisors:
              </h4>
              <ul className="max-h-32 overflow-y-auto rounded-md border p-2">
                {selectedSupervisors.map((email) => {
                  const supervisor = supervisorsData?.supervisors.find(
                    (s) => s.email === email
                  );
                  return (
                    <li key={email} className="py-1">
                      {supervisor?.name || email}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium">
                Deadline (Optional)
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !deadline && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadline ? (
                      format(deadline, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={deadline}
                    onSelect={setDeadline}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="mt-6 flex gap-4">
              <Button
                variant="outline"
                onClick={() => setNotificationDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleNotifySupervisors}
                className="flex-1"
                disabled={notifySupervisorMutation.isLoading}
              >
                {notifySupervisorMutation.isLoading
                  ? "Sending..."
                  : "Send Notification"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Timetable Dialog */}
      <Dialog open={timetableDialogOpen} onOpenChange={setTimetableDialogOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>PhD Qualifying Exam Timetable</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            {loadingTimetable ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : timetableData ? (
              <div className="space-y-6">
                {timetableData.conflicts &&
                  timetableData.conflicts.length > 0 && (
                    <div className="rounded-md border border-red-200 bg-red-50 p-4">
                      <h4 className="mb-2 font-medium text-red-700">
                        Scheduling Conflicts
                      </h4>
                      <p className="text-sm text-red-600">
                        The following students have scheduling conflicts:
                      </p>
                      <ul className="mt-2 list-inside list-disc text-sm text-red-600">
                        {timetableData.conflicts.map((email, idx) => (
                          <li key={idx}>{email}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                {timetableData.timetable.map((session) => (
                  <Card key={session.sessionNumber} className="overflow-hidden">
                    <CardHeader className="bg-gray-50 pb-2">
                      <CardTitle className="text-lg">
                        Session {session.sessionNumber}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Subject Area</TableHead>
                            <TableHead>Examiner</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {session.exams.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={4}
                                className="py-4 text-center text-gray-500"
                              >
                                No exams scheduled for this session
                              </TableCell>
                            </TableRow>
                          ) : (
                            session.exams.map((exam, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="font-medium">
                                  {exam.name}
                                </TableCell>
                                <TableCell>{exam.email}</TableCell>
                                <TableCell>{exam.subArea}</TableCell>
                                <TableCell>{exam.examiner}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                Failed to load timetable data
              </div>
            )}
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setTimetableDialogOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExaminerManagementPanel;
