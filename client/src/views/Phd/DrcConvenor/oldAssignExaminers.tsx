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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Interfaces
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

const AssignExaminers: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedExaminer, setSelectedExaminer] = useState<string>("");
  const [selectedSubAreaId, setSelectedSubAreaId] = useState<number | null>(null);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [selectedSupervisors, setSelectedSupervisors] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("supervisors");

  // Fetch supervisors with PhD students
  const { data: supervisorsData, isLoading: loadingSupervisors } = useQuery({
    queryKey: ["phd-supervisors"],
    queryFn: async () => {
      const response = await api.get<ISupervisorsResponse>("/phd/drcMember/getSupervisorsWithStudents");
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch sub-areas and examiners
  const { data: subAreasData, isLoading: loadingSubAreas } = useQuery({
    queryKey: ["phd-sub-areas-examiners"],
    queryFn: async () => {
      const response = await api.get<ISubAreasExaminerResponse>("/phd/drcMember/getSubAreasAndExaminer");
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });

  // Mutation for notifying supervisors
  const notifySupervisorMutation = useMutation({
    mutationFn: async (data: { supervisorEmail: string; deadline?: string }) => {
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

  // Mutation for updating examiners
  const updateExaminerMutation = useMutation({
    mutationFn: async (data: { subAreaId: number; examinerEmail: string }) => {
      return await api.post("/phd/drcMember/updateExaminer", data);
    },
    onSuccess: () => {
      toast.success("Examiner updated successfully");
      void queryClient.invalidateQueries({ queryKey: ["phd-sub-areas-examiners"] });
      setSelectedExaminer("");
      setSelectedSubAreaId(null);
    },
    onError: () => {
      toast.error("Failed to update examiner");
    },
  });

  // Handle select/deselect all supervisors
  const handleSelectAllSupervisors = () => {
    if (!supervisorsData?.supervisors) return;

    if (selectedSupervisors.length === supervisorsData.supervisors.length) {
      setSelectedSupervisors([]);
    } else {
      setSelectedSupervisors(supervisorsData.supervisors.map(sup => sup.email));
    }
  };

  // Toggle selection of an individual supervisor
  const toggleSupervisorSelection = (email: string) => {
    setSelectedSupervisors(prev => 
      prev.includes(email) 
        ? prev.filter(e => e !== email) 
        : [...prev, email]
    );
  };

  // Handle sending notifications
  const handleNotifySupervisors = () => {
    if (selectedSupervisors.length === 0) {
      toast.error("Please select at least one supervisor");
      return;
    }

    // Send notification to each selected supervisor
    selectedSupervisors.forEach(supervisorEmail => {
      notifySupervisorMutation.mutate({
        supervisorEmail,
        deadline: deadline ? deadline.toISOString() : undefined
      });
    });
  };

  // Handle examiner update
  const handleUpdateExaminer = () => {
    if (!selectedSubAreaId || !selectedExaminer) {
      toast.error("Please select a sub-area and an examiner");
      return;
    }

    updateExaminerMutation.mutate({
      subAreaId: selectedSubAreaId,
      examinerEmail: selectedExaminer
    });
  };

  if (loadingSupervisors || loadingSubAreas) {
    return <LoadingSpinner className="mx-auto mt-10" />;
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-6xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold">DRC Examiner Management</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 grid w-full grid-cols-2">
              <TabsTrigger value="supervisors">Supervisors</TabsTrigger>
              <TabsTrigger value="examiners">Examiners</TabsTrigger>
            </TabsList>

            {/* Supervisors Tab */}
            <TabsContent value="supervisors">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-medium">PhD Supervisors</h3>
                <div className="flex gap-4">
                  <Button 
                    variant="outline" 
                    onClick={handleSelectAllSupervisors}
                  >
                    {selectedSupervisors.length === supervisorsData?.supervisors.length 
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

              {!supervisorsData?.supervisors || supervisorsData.supervisors.length === 0 ? (
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
                            onChange={() => toggleSupervisorSelection(supervisor.email)}
                            className="h-4 w-4"
                          />
                        </TableCell>
                        <TableCell className="font-medium">{supervisor.name}</TableCell>
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

            {/* Examiners Tab */}
            <TabsContent value="examiners">
              <div className="mb-4">
                <h3 className="mb-2 text-lg font-medium">PhD Sub-Areas and Examiners</h3>
                <p className="text-sm text-gray-500">
                  View suggested examiners for each sub-area and assign final examiners.
                </p>
              </div>

              {!subAreasData?.subAreas || subAreasData.subAreas.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  No sub-areas found
                </div>
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {subAreasData.subAreas.map((subArea) => (
                    <AccordionItem key={subArea.id} value={subArea.id.toString()}>
                      <AccordionTrigger className="rounded-lg px-4 py-2 hover:bg-gray-50">
                        <div className="flex w-full justify-between pr-4">
                          <span>{subArea.subarea}</span>
                          <span className="text-sm text-gray-500">
                            {subArea.examiners && subArea.examiners.length > 0
                              ? `${subArea.examiners.length} suggested examiner(s)`
                              : "No suggested examiners"}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 p-2">
                          {(!subArea.examiners || subArea.examiners.length === 0) ? (
                            <div className="py-2 text-center text-gray-500">
                              No examiners suggested yet
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="rounded-md border">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Suggested Examiners</TableHead>
                                      <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {subArea.examiners.map((examiner) => (
                                      <React.Fragment key={examiner.id}>
                                        {examiner.suggestedExaminer.map((suggested, index) => (
                                          <TableRow key={`${examiner.id}-${index}`}>
                                            <TableCell>
                                              {suggested}
                                            </TableCell>
                                            <TableCell className="text-right">
                                              <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => {
                                                  setSelectedExaminer(suggested);
                                                  setSelectedSubAreaId(subArea.id);
                                                }}
                                              >
                                                Select
                                              </Button>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </React.Fragment>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                              
                              <div className="rounded-md border bg-gray-50 p-4">
                                <h4 className="mb-2 font-medium">Assign Final Examiner</h4>
                                <div className="flex items-end gap-4">
                                  <div className="flex-1">
                                    <p className="mb-1 text-sm">Current Examiner:</p>
                                    <p className="font-medium">
                                      {subArea.examiners[0]?.examiner || "Not assigned"}
                                    </p>
                                  </div>
                                  {selectedSubAreaId === subArea.id && (
                                    <div className="flex-1">
                                      <p className="mb-1 text-sm">New Examiner:</p>
                                      <Input 
                                        type="email"
                                        value={selectedExaminer}
                                        onChange={(e) => setSelectedExaminer(e.target.value)}
                                        placeholder="Email address"
                                        className="mb-2"
                                      />
                                      <Button 
                                        onClick={handleUpdateExaminer}
                                        className="w-full"
                                        disabled={updateExaminerMutation.isLoading}
                                      >
                                        {updateExaminerMutation.isLoading ? "Updating..." : "Update Examiner"}
                                      </Button>
                                    </div>
                                  )}
                                  {selectedSubAreaId !== subArea.id && (
                                    <Button 
                                      onClick={() => setSelectedSubAreaId(subArea.id)}
                                      variant="outline"
                                    >
                                      Change Examiner
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Notification Dialog */}
      <Dialog open={notificationDialogOpen} onOpenChange={setNotificationDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Notify Supervisor(s)</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <div className="mb-4">
              <h4 className="mb-2 text-sm font-medium">Selected Supervisors:</h4>
              <ul className="max-h-32 overflow-y-auto rounded-md border p-2">
                {selectedSupervisors.map((email) => {
                  const supervisor = supervisorsData?.supervisors.find(s => s.email === email);
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
                    {deadline ? format(deadline, "PPP") : <span>Pick a date</span>}
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
                {notifySupervisorMutation.isLoading ? "Sending..." : "Send Notification"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssignExaminers;