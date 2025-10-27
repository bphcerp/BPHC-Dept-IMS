// client/src/views/Phd/DrcConvenor/SeminarScheduling.tsx
import React, { useState, useEffect } from "react"; // Added useEffect
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import BackButton from "@/components/BackButton";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Edit, Trash2 } from "lucide-react";
import { phdSchemas } from "lib";
import ProposalSemesterSelector from "@/components/phd/proposal/ProposalSemesterSelector"; // Import selector

// Interfaces remain the same
interface SeminarSlot {
  id: number;
  venue: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  proposal: {
    student: {
      name: string | null;
      email: string;
    };
  } | null;
}

interface ManualSlot {
  id: number; // Proposal ID
  seminarDate: string | null;
  seminarTime: string | null;
  seminarVenue: string | null;
  student: {
    name: string | null;
    email: string;
  };
  supervisor: {
    name: string | null;
    email: string;
  } | null;
}

interface SlotQueryResponse {
  bookedSlots: SeminarSlot[];
  manuallyScheduled: ManualSlot[];
}

interface EditingSlotState extends Partial<SeminarSlot> {
  startTimeStr?: string;
  endTimeStr?: string;
}

// Interface for proposal semester data (needed for selector initialization)
interface ProposalSemesterInfo {
  id: number;
  semesterId: number;
  studentSubmissionDate: string;
  semester: {
    year: string;
    semesterNumber: number;
  };
}

const SeminarScheduling: React.FC = () => {
  // State for proposal cycle selection
  const [selectedProposalSemesterId, setSelectedProposalSemesterId] = useState<
    number | null
  >(null);

  // State for creating slots
  const [venue, setVenue] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [duration, setDuration] = useState("60");

  // State for selecting slots to delete
  const [selectedSlotIds, setSelectedSlotIds] = useState<number[]>([]);

  // State for editing a slot
  const [editingSlot, setEditingSlot] = useState<EditingSlotState | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Fetch proposal semesters to initialize the selector
  const { data: proposalSemesters } = useQuery<ProposalSemesterInfo[]>({
    queryKey: ["proposal-semesters"], // Use the same key as the selector component
    queryFn: async () => {
      const response = await api.get("/phd/proposal/getProposalSemesters");
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 mins
  });

  // Effect to set the initial selected proposal semester ID to the latest one
  useEffect(() => {
    if (
      proposalSemesters &&
      proposalSemesters.length > 0 &&
      selectedProposalSemesterId === null
    ) {
      setSelectedProposalSemesterId(proposalSemesters[0].id); // Select the first (latest)
    }
  }, [proposalSemesters, selectedProposalSemesterId]);

  // Fetch existing slots based on selected proposal semester
  const {
    data,
    isLoading: isLoadingSlots,
    refetch,
  } = useQuery<SlotQueryResponse>({
    // Include selectedProposalSemesterId in the query key
    queryKey: ["seminar-slots-all", selectedProposalSemesterId],
    queryFn: async () => {
      if (selectedProposalSemesterId === null)
        return { bookedSlots: [], manuallyScheduled: [] }; // Don't fetch if no semester selected
      // Pass the ID as a query parameter
      const res = await api.get(
        `/phd/proposal/drcConvener/seminarSlots?proposalSemesterId=${selectedProposalSemesterId}`
      );
      return res.data;
    },
    // Only run the query when a proposal semester ID is selected
    enabled: selectedProposalSemesterId !== null,
  });

  // --- Mutations (create, delete, edit) remain the same ---
  const createSlotsMutation = useMutation({
    mutationFn: (newSlotsData: phdSchemas.CreateSeminarSlotsBody) =>
      api.post("/phd/proposal/drcConvener/seminarSlots", newSlotsData),
    onSuccess: (response: { data: { message: string } }) => {
      toast.success(
        response.data.message || "Seminar slots created successfully."
      );
      void refetch();
      setVenue("");
      setStartDate("");
      setEndDate("");
      setStartTime("09:00");
      setEndTime("17:00");
      setDuration("60"); // Reset form
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create slots.");
    },
  });

  const deleteSlotsMutation = useMutation({
    mutationFn: (slotIds: number[]) =>
      api.delete("/phd/proposal/drcConvener/seminarSlots", {
        data: { slotIds },
      }),
    onSuccess: () => {
      toast.success("Selected unbooked slots deleted.");
      setSelectedSlotIds([]);
      void refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete slots.");
    },
  });

  const editSlotMutation = useMutation({
    mutationFn: ({
      slotId,
      data,
    }: {
      slotId: number;
      data: phdSchemas.EditSeminarSlotBody;
    }) => api.put(`/phd/proposal/drcConvener/seminarSlots/${slotId}`, data),
    onSuccess: () => {
      toast.success("Slot updated successfully.");
      setIsEditDialogOpen(false);
      setEditingSlot(null);
      void refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update slot.");
    },
  });

  // --- Handlers (handleSubmitCreate, handleDeleteSelected, handleOpenEditDialog, handleSaveChanges, handleSelectSlot, handleSelectAll) remain the same ---
  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: phdSchemas.CreateSeminarSlotsBody = {
      venue,
      startDate,
      endDate,
      startTime,
      endTime,
      durationMinutes: parseInt(duration),
    };
    const validation = phdSchemas.createSeminarSlotsSchema.safeParse(payload);
    if (!validation.success) {
      toast.error(validation.error.errors[0]?.message || "Invalid input.");
      return;
    }
    createSlotsMutation.mutate(validation.data);
  };

  const handleDeleteSelected = () => {
    if (selectedSlotIds.length === 0) {
      toast.info("No slots selected for deletion.");
      return;
    }
    deleteSlotsMutation.mutate(selectedSlotIds);
  };

  const handleOpenEditDialog = (slot: SeminarSlot) => {
    setEditingSlot({
      ...slot,
      startTimeStr: slot.startTime
        ? new Date(
            new Date(slot.startTime).getTime() -
              new Date().getTimezoneOffset() * 60000
          )
            .toISOString()
            .slice(0, 16)
        : "",
      endTimeStr: slot.endTime
        ? new Date(
            new Date(slot.endTime).getTime() -
              new Date().getTimezoneOffset() * 60000
          )
            .toISOString()
            .slice(0, 16)
        : "",
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveChanges = () => {
    if (!editingSlot || !editingSlot.id) return;
    const payload: phdSchemas.EditSeminarSlotBody = {};
    if (
      editingSlot.venue &&
      editingSlot.venue !==
        data?.bookedSlots.find((s) => s.id === editingSlot.id)?.venue
    )
      payload.venue = editingSlot.venue;
    if (editingSlot.startTimeStr) {
      const newStartTime = new Date(editingSlot.startTimeStr).toISOString();
      if (
        newStartTime !==
        data?.bookedSlots.find((s) => s.id === editingSlot.id)?.startTime
      )
        payload.startTime = newStartTime;
    }
    if (editingSlot.endTimeStr) {
      const newEndTime = new Date(editingSlot.endTimeStr).toISOString();
      if (
        newEndTime !==
        data?.bookedSlots.find((s) => s.id === editingSlot.id)?.endTime
      )
        payload.endTime = newEndTime;
    }

    const validation = phdSchemas.editSeminarSlotBodySchema.safeParse(payload);
    if (!validation.success) {
      toast.error(validation.error.errors[0]?.message || "Invalid edit data.");
      return;
    }
    if (Object.keys(validation.data).length === 0) {
      toast.info("No changes detected.");
      setIsEditDialogOpen(false);
      setEditingSlot(null);
      return;
    }

    editSlotMutation.mutate({ slotId: editingSlot.id, data: validation.data });
  };

  const handleSelectSlot = (id: number, checked: boolean) => {
    setSelectedSlotIds((prev) =>
      checked ? [...prev, id] : prev.filter((slotId) => slotId !== id)
    );
  };

  const handleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      const unbookedIds =
        data?.bookedSlots.filter((s) => !s.isBooked).map((s) => s.id) ?? [];
      setSelectedSlotIds(unbookedIds);
    } else {
      setSelectedSlotIds([]);
    }
  };

  // Calculate checkbox state based on *currently displayed* data
  const allUnbookedSlots = data?.bookedSlots.filter((s) => !s.isBooked) ?? [];
  const isAllSelected: boolean | "indeterminate" =
    allUnbookedSlots.length === 0
      ? false
      : selectedSlotIds.length === allUnbookedSlots.length
        ? true
        : selectedSlotIds.length > 0
          ? "indeterminate"
          : false;

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="text-center">
        <h1 className="text-3xl font-bold">Seminar Slot Management</h1>
        <p className="mt-2 text-gray-600">
          Create, view, edit, and delete available time slots for PhD proposal
          seminars for the selected proposal cycle.
        </p>
      </div>

      {/* Proposal Cycle Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Proposal Cycle</CardTitle>
          <CardDescription>
            Manage seminar slots relevant to a specific proposal submission
            cycle.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProposalSemesterSelector
            selectedSemesterId={selectedProposalSemesterId}
            onSemesterChange={(id) => {
              setSelectedProposalSemesterId(id);
              setSelectedSlotIds([]); // Clear selection when cycle changes
            }}
            className="max-w-md" // Optional: constrain width
          />
        </CardContent>
      </Card>

      {/* Create Slots Card (remains the same structure) */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Seminar Slots</CardTitle>
          <CardDescription>
            Define a date range, venue, time range, and duration to generate
            slots.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitCreate} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div>
                <Label htmlFor="venue">Venue</Label>
                <Input
                  id="venue"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  min={startDate}
                />
              </div>
              <div>
                <Label htmlFor="startTime">Daily Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="endTime">Daily End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="duration">Slot Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  min="15"
                  max="180"
                  step="15"
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={createSlotsMutation.isLoading}>
              {createSlotsMutation.isLoading && (
                <LoadingSpinner className="mr-2 h-4 w-4" />
              )}
              Generate Slots
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* System Booked/Available Slots Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>System-Managed Slots for Selected Cycle</CardTitle>
            <CardDescription>
              Slots created via this tool within the selected semester. Unbooked
              slots can be edited or deleted.
            </CardDescription>
          </div>
          <Button
            variant="destructive"
            onClick={handleDeleteSelected}
            disabled={
              selectedSlotIds.length === 0 || deleteSlotsMutation.isLoading
            }
            size="sm"
          >
            {deleteSlotsMutation.isLoading ? (
              <LoadingSpinner className="mr-2 h-4 w-4" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Delete Selected ({selectedSlotIds.length})
          </Button>
        </CardHeader>
        <CardContent>
          {isLoadingSlots ? (
            <div className="flex justify-center p-8">
              <LoadingSpinner />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      disabled={allUnbookedSlots.length === 0}
                    />
                  </TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Status / Booked By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.bookedSlots && data.bookedSlots.length > 0 ? (
                  data.bookedSlots.map((slot) => (
                    <TableRow key={slot.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedSlotIds.includes(slot.id)}
                          onCheckedChange={(checked) =>
                            handleSelectSlot(slot.id, checked as boolean)
                          }
                          disabled={slot.isBooked}
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(slot.startTime).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(slot.startTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        -{" "}
                        {new Date(slot.endTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>{slot.venue}</TableCell>
                      <TableCell>
                        {slot.isBooked && slot.proposal ? (
                          <Badge>Booked by {slot.proposal.student.name}</Badge>
                        ) : (
                          <Badge variant="outline">Available</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!slot.isBooked && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEditDialog(slot)}
                            title="Edit Slot"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No system-created slots found for this cycle.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Manually Scheduled Card */}
      <Card>
        <CardHeader>
          <CardTitle>Manually Scheduled Seminars in Selected Cycle</CardTitle>
          <CardDescription>
            Proposals where supervisors set a custom date and time within this
            semester.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingSlots ? (
            <div className="flex justify-center p-8">
              <LoadingSpinner />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Supervisor</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Venue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.manuallyScheduled &&
                data.manuallyScheduled.length > 0 ? (
                  data.manuallyScheduled.map((slot) => (
                    <TableRow key={slot.id}>
                      <TableCell>
                        <Link
                          to={`/phd/drc-convenor/proposal-management/${slot.id}`}
                          className="text-primary hover:underline"
                        >
                          {slot.student.name || slot.student.email}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {slot.supervisor?.name ||
                          slot.supervisor?.email ||
                          "N/A"}
                      </TableCell>
                      <TableCell>
                        {slot.seminarDate
                          ? new Date(slot.seminarDate).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>{slot.seminarTime || "N/A"}</TableCell>
                      <TableCell>{slot.seminarVenue || "N/A"}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No manually scheduled seminars found for this cycle.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Slot Dialog (remains the same structure) */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) setEditingSlot(null);
          setIsEditDialogOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Seminar Slot</DialogTitle>
            <DialogDescription>
              Modify the details for this unbooked slot.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-venue">Venue</Label>
              <Input
                id="edit-venue"
                value={editingSlot?.venue || ""}
                onChange={(e) =>
                  setEditingSlot((prev) =>
                    prev ? { ...prev, venue: e.target.value } : null
                  )
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-startTime">Start Time</Label>
              <Input
                id="edit-startTime"
                type="datetime-local"
                value={editingSlot?.startTimeStr || ""}
                onChange={(e) =>
                  setEditingSlot((prev) =>
                    prev ? { ...prev, startTimeStr: e.target.value } : null
                  )
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-endTime">End Time</Label>
              <Input
                id="edit-endTime"
                type="datetime-local"
                value={editingSlot?.endTimeStr || ""}
                onChange={(e) =>
                  setEditingSlot((prev) =>
                    prev ? { ...prev, endTimeStr: e.target.value } : null
                  )
                }
                min={editingSlot?.startTimeStr}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingSlot(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveChanges}
              disabled={editSlotMutation.isLoading}
            >
              {editSlotMutation.isLoading && (
                <LoadingSpinner className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SeminarScheduling;
