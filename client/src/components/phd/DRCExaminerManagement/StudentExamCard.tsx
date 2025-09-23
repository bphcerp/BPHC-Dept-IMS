import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { Card, CardContent } from "@/components/ui/card";
import { GripVertical } from "lucide-react";
import type { phdSchemas } from "lib";

interface StudentExamCardProps {
  item: phdSchemas.TimetableSlotItem;
  id: string;
}

const StudentExamCard: React.FC<StudentExamCardProps> = ({ item, id }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: id,
    data: item,
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: isDragging ? 100 : 'auto',
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="mb-2 touch-none bg-white p-2 shadow-sm"
    >
      <CardContent className="flex items-center p-0">
        <span {...listeners} {...attributes} className="cursor-grab px-2">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
        </span>
        <div className="ml-2 flex-grow">
          <p className="font-medium">{item.student.name || item.studentEmail}</p>
          <p className="text-sm text-muted-foreground">{item.qualifyingArea}</p>
          <p className="text-xs text-muted-foreground">{item.examinerEmail}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentExamCard;