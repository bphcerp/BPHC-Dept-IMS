import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { Button } from "@/components/ui/button";
import { 
  Accordion, AccordionContent, AccordionItem, AccordionTrigger 
} from "@/components/ui/accordion";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle 
} from "@/components/ui/dialog";
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from "@/components/ui/tabs";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface ExaminerManagementPanelProps {
  selectedSemester: number | null;
  onNext: () => void;
  onBack: () => void;
}

interface Supervisor {
  email: string;
  name: string;
  students: Student[];
}

interface Student {
  email: string;
  name: string;
  qualifyingArea1: string | null;
  qualifyingArea2: string | null;
}

interface SubArea {
  id: number;
  subarea: string;
  examiners?: Examiner[];
}

interface Examiner {
  id: number;
  suggestedExaminer: string[];
  examiner: string | null;
}

const ExaminerManagementPanel: React.FC<ExaminerManagementPanelProps> = ({ 
  selectedSemester,
  onNext,
  onBack
}) => {
  const queryClient = useQueryClient();
  const [selectedExaminer, setSelectedExaminer] = useState<string>("");
  const [selectedSubAreaId, setSelectedSubAreaId] = useState<number | null>(null);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [selectedSupervisors, setSelectedSupervisors] = useState<string[]>([]);
  const [examinerTabView, setExaminerTabView] = useState("supervisors");

  // Fetch supervisor data
  const { data: supervisorsData, isLoading: loadingSupervisors } = useQuery({
    queryKey: ["phd-supervisors"],
    queryFn: async () => {
      const response = await api.get("/phd/drcMember/getSupervisorsWithStudents");
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch sub-areas and examiner data
  const { data: subAreasData, isLoading: loadingSubAreas } = useQuery({
    queryKey: ["phd-sub-areas-examiners"],
    queryFn: async () => {
      const response = await api.get("/phd/drcMember/getSubAreasAndExaminer");
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
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

  // Mutation for updating examiner
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

  const handleSelectAllSupervisors = () => {
    if (!supervisorsData?.supervisors) return;
    
    if (selectedSupervisors.length === supervisorsData.supervisors.length) {
      setSelectedSupervisors([]);
    } else {
      setSelectedSupervisors(supervisorsData.supervisors.map((sup:any) => sup.email));
    }
  };

  const toggleSupervisorSelection = (email: string) => {
    setSelectedSupervisors(prev => 
      prev.includes(email) 
        ? prev.filter(e => e !== email) 
        : [...prev, email]
    );
  };

  const handleNotifySupervisors = () => {
    if (selectedSupervisors.length === 0) {
      toast.error("Please select at least one supervisor");
      return;
    }
    
    selectedSupervisors.forEach(supervisorEmail => {
      notifySupervisorMutation.mutate({
        supervisorEmail,
        deadline: deadline ? deadline.toISOString() : undefined
      });
    });
  };

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
    return <div>Loading examiner management data...</div>;
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
                {supervisorsData.supervisors.map((supervisor: Supervisor) => (
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
        
        <TabsContent value="examiners">
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2">PhD Sub-Areas and Examiners</h3>
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
              {subAreasData.subAreas.map((subArea: SubArea) => (
                <AccordionItem 
                  key={subArea.id} 
                  value={subArea.id.toString()}
                >
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
                                        <TableCell>{suggested}</TableCell>
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
                                    {updateExaminerMutation.isLoading 
                                      ? "Updating..." 
                                      : "Update Examiner"}
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

      <div className="mt-6 flex justify-between">
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Form Generation
        </Button>
        
        <Button onClick={onNext} className="bg-blue-600 hover:bg-blue-700">
          Next: Update Results <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

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
              <h4 className="mb-2 text-sm font-medium">Selected Supervisors:</h4>
              <ul className="max-h-32 overflow-y-auto rounded-md border p-2">
                {selectedSupervisors.map((email) => {
                  const supervisor = supervisorsData?.supervisors.find((s:any) => s.email === email);
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
              <Input
                type="date"
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : undefined;
                  setDeadline(date);
                }}
              />
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
    </div>
  );
};

export default ExaminerManagementPanel;
