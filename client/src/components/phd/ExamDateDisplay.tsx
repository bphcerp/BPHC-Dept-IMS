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
            <p className="text-muted-foreground">{examDate}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
