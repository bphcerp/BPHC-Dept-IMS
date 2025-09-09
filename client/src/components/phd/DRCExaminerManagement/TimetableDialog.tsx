import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/spinner";
import api from "@/lib/axios-instance";
import { toast } from "sonner";
import { phdSchemas } from "lib";
import { Download, Save, Zap } from "lucide-react";
import StudentExamCard from "./StudentExamCard";

interface TimetableDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedExamId: number;
}

const TimetableDialog: React.FC<TimetableDialogProps> = ({
  isOpen,
  onClose,
  selectedExamId,
}) => {
  const queryClient = useQueryClient();
  const [timetable, setTimetable] = useState<phdSchemas.Timetable | null>(null);
  const [activeItem, setActiveItem] =
    useState<phdSchemas.TimetableSlotItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["timetable", selectedExamId],
    queryFn: async () => {
      const response = await api.get<{
        timetable: phdSchemas.Timetable;
        examinersWithDoubleDuty: string[];
      }>(`/phd/drcMember/timetable/${selectedExamId}`);
      return response.data;
    },
    enabled: !!selectedExamId && isOpen,
  });

  useEffect(() => {
    if (data) {
      setTimetable(data.timetable);
    }
  }, [data]);

  const optimizeMutation = useMutation({
    mutationFn: () =>
      api.post(`/phd/drcMember/optimizeTimetable/${selectedExamId}`),
    onSuccess: () => {
      toast.success("Timetable has been auto-generated.");
      void queryClient.invalidateQueries({
        queryKey: ["timetable", selectedExamId],
      });
    },
    onError: () => toast.error("Failed to generate timetable."),
  });

  const updateMutation = useMutation({
    mutationFn: (updatedTimetable: phdSchemas.UpdateTimetableBody) =>
      api.post(`/phd/drcMember/timetable/${selectedExamId}`, updatedTimetable),
    onSuccess: () => {
      toast.success("Timetable changes saved successfully.");
      void queryClient.invalidateQueries({
        queryKey: ["timetable", selectedExamId],
      });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Failed to save changes";
      toast.error(message);
      void queryClient.invalidateQueries({
        queryKey: ["timetable", selectedExamId],
      });
    },
  });

  const downloadPdfMutation = useMutation({
    mutationFn: () =>
      api.get(`/phd/drcMember/generateTimetablePdf/${selectedExamId}`, {
        responseType: "blob",
      }),
    onSuccess: (response) => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Timetable-Exam-${selectedExamId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success("Timetable PDF downloaded.");
    },
    onError: () => toast.error("Failed to download PDF."),
  });

  const sensors = useSensors(useSensor(PointerSensor));

  const findContainer = (id: string): keyof phdSchemas.Timetable | null => {
    if (!timetable) return null;
    if (
      timetable.slot1.some(
        (item) => `${item.studentEmail}|${item.qualifyingArea}` === id
      )
    )
      return "slot1";
    if (
      timetable.slot2.some(
        (item) => `${item.studentEmail}|${item.qualifyingArea}` === id
      )
    )
      return "slot2";
    if (
      timetable.unscheduled.some(
        (item) => `${item.studentEmail}|${item.qualifyingArea}` === id
      )
    )
      return "unscheduled";
    return null;
  };

  const handleDragStart = (event: any) => {
    setActiveItem(event.active.data.current as phdSchemas.TimetableSlotItem);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveItem(null);
    const { active, over } = event;

    if (!over || !timetable) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const activeContainer = findContainer(activeId);
    const overContainer =
      findContainer(overId) ||
      (Object.keys(timetable).includes(overId)
        ? (overId as keyof phdSchemas.Timetable)
        : null);

    if (
      !activeContainer ||
      !overContainer ||
      activeContainer === overContainer
    ) {
      return;
    }

    setTimetable((prev) => {
      if (!prev) return null;
      const newTimetable = JSON.parse(
        JSON.stringify(prev)
      ) as phdSchemas.Timetable;

      const sourceList = newTimetable[activeContainer];
      const itemIndex = sourceList.findIndex(
        (item) => `${item.studentEmail}|${item.qualifyingArea}` === activeId
      );
      if (itemIndex === -1) return prev;

      const [movedItem] = sourceList.splice(itemIndex, 1);
      const destinationList = newTimetable[overContainer];

      if (overContainer !== "unscheduled") {
        const studentAlreadyInSlot = destinationList.some(
          (item) => item.studentEmail === movedItem.studentEmail
        );
        if (studentAlreadyInSlot) {
          toast.error(`A student cannot have both exams in the same slot.`);
          return prev;
        }
      }

      movedItem.slotNumber =
        overContainer === "slot1" ? 1 : overContainer === "slot2" ? 2 : 0;
      destinationList.push(movedItem);

      return newTimetable;
    });
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex h-[90vh] max-w-7xl flex-col">
        <DialogHeader>
          <DialogTitle>Manage Exam Timetable</DialogTitle>
          <CardDescription>
            Drag and drop to schedule students. The system will prevent
            conflicts.
          </CardDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex flex-grow items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : timetable ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid flex-grow grid-cols-1 gap-4 overflow-y-auto md:grid-cols-3">
              <DroppableArea
                id="slot1"
                title="Slot 1"
                items={timetable.slot1}
              />
              <DroppableArea
                id="slot2"
                title="Slot 2"
                items={timetable.slot2}
              />
              <DroppableArea
                id="unscheduled"
                title="Unscheduled"
                items={timetable.unscheduled}
              />
            </div>
            {data?.examinersWithDoubleDuty &&
              data.examinersWithDoubleDuty.length > 0 && (
                <div className="mt-4 rounded-lg border bg-muted/50 p-4 text-sm">
                  <p className="font-semibold">Examiners with double duty:</p>
                  <p className="text-muted-foreground">
                    {data.examinersWithDoubleDuty.join(", ")}
                  </p>
                </div>
              )}
            <DragOverlay>
              {activeItem ? (
                <StudentExamCard
                  id={`${activeItem.studentEmail}|${activeItem.qualifyingArea}`}
                  item={activeItem}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          <p>No timetable data available.</p>
        )}
        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => optimizeMutation.mutate()}
            disabled={optimizeMutation.isLoading || updateMutation.isLoading}
          >
            <Zap className="mr-2 h-4 w-4" /> Auto-Generate
          </Button>
          <Button
            variant="outline"
            onClick={() => downloadPdfMutation.mutate()}
            disabled={downloadPdfMutation.isLoading}
          >
            <Download className="mr-2 h-4 w-4" /> Download PDF
          </Button>
          <Button
            onClick={() =>
              timetable &&
              updateMutation.mutate({
                timetable: {
                  slot1: timetable.slot1.map(
                    ({ id, student, ...rest }) => rest
                  ),
                  slot2: timetable.slot2.map(
                    ({ id, student, ...rest }) => rest
                  ),
                  unscheduled: timetable.unscheduled.map(
                    ({ id, student, ...rest }) => rest
                  ),
                },
              })
            }
            disabled={updateMutation.isLoading || optimizeMutation.isLoading}
          >
            <Save className="mr-2 h-4 w-4" /> Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const DroppableArea = ({
  id,
  title,
  items,
}: {
  id: string;
  title: string;
  items: phdSchemas.TimetableSlotItem[];
}) => {
  const { setNodeRef } = useDroppable({ id });
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent
        ref={setNodeRef}
        id={id}
        className="flex-grow rounded-b-lg bg-muted/20 p-2"
      >
        <SortableContext
          id={id}
          items={items.map((i) => `${i.studentEmail}|${i.qualifyingArea}`)}
          strategy={verticalListSortingStrategy}
        >
          {items.map((item) => (
            <StudentExamCard
              key={`${item.studentEmail}|${item.qualifyingArea}`}
              id={`${item.studentEmail}|${item.qualifyingArea}`}
              item={item}
            />
          ))}
          {items.length === 0 && (
            <div className="flex h-full items-center justify-center p-4 text-center text-muted-foreground">
              Drop here
            </div>
          )}
        </SortableContext>
      </CardContent>
    </Card>
  );
};

export default TimetableDialog;
