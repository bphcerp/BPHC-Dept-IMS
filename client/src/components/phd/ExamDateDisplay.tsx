import { Calendar, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ExamDateDisplayProps {
  examDate: string; // ISO date string
  title:string;
}

export default function ExamDateDisplay({
  examDate,
  title
}: ExamDateDisplayProps) {
  // Parse the ISO date string
  const date = new Date(examDate);

  // Format the date: e.g., "Friday, March 14, 2025"
  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Format the time: e.g., "2:41 PM"
  const formattedTime = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <Calendar className="mt-0.5 h-5 w-5 text-muted-foreground" />
          <div>
            <p className="font-medium">Date</p>
            <p className="text-muted-foreground">{formattedDate}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Clock className="mt-0.5 h-5 w-5 text-muted-foreground" />
          <div>
            <p className="font-medium">Time</p>
            <p className="text-muted-foreground">{formattedTime}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
