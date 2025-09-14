// client/src/components/meeting/MeetingDashboard.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { Eye, Plus } from "lucide-react";
import { Badge } from "../ui/badge";

interface Meeting {
  id: number;
  title: string;
  finalizedTime: string | null;
  organizerEmail: string;
}

interface MeetingDashboardProps {
  organizedMeetings: Meeting[];
  invitedMeetings: Meeting[];
}

export const MeetingDashboard: React.FC<MeetingDashboardProps> = ({
  organizedMeetings,
  invitedMeetings,
}) => {
  const navigate = useNavigate();

  const renderTable = (
    title: string,
    meetings: Meeting[],
    isOrganizer: boolean
  ) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {meetings.length > 0 ? (
              meetings.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.title}</TableCell>
                  <TableCell>
                    <Badge variant={m.finalizedTime ? "default" : "secondary"}>
                      {m.finalizedTime ? "Scheduled" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigate(
                          isOrganizer
                            ? `/meeting/view/${m.id}`
                            : `/meeting/respond/${m.id}`
                        )
                      }
                    >
                      <Eye className="mr-2 h-4 w-4" /> View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  No meetings found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meeting Dashboard</h1>
          <p className="text-muted-foreground">
            Organize and view your meetings.
          </p>
        </div>
        <Button onClick={() => navigate("/meeting/create")}>
          <Plus className="mr-2 h-4 w-4" /> Create Meeting
        </Button>
      </div>
      {renderTable("Meetings You've Organized", organizedMeetings, true)}
      {renderTable("Meetings You're Invited To", invitedMeetings, false)}
    </div>
  );
};
