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
import { Eye, Plus, Send, Trash2 } from "lucide-react";
import { Badge } from "../ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Meeting {
  id: number;
  title: string;
  status: string;
  finalizedTime: string | null;
  organizerEmail: string;
  participantCount: number;
  responseCount: number;
}

interface MeetingDashboardProps {
  organizedMeetings: Meeting[];
  invitedMeetings: Meeting[];
  onRemind: (meetingId: number) => void;
  onDelete: (meetingId: number) => void;
  isReminding: boolean;
  isDeleting: boolean;
}

export const MeetingDashboard: React.FC<MeetingDashboardProps> = ({
  organizedMeetings,
  invitedMeetings,
  onRemind,
  onDelete,
  isReminding,
  isDeleting,
}) => {
  const navigate = useNavigate();

  const handleInviteeViewClick = (meeting: Meeting) => {
    if (meeting.status === "pending_responses") {
      navigate(`/meeting/respond/${meeting.id}`);
    } else {
      navigate(`/meeting/view/${meeting.id}`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge>Scheduled</Badge>;
      case "awaiting_finalization":
        return (
          <Badge className="border-yellow-200 bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80 dark:border-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300">
            Awaiting Finalization
          </Badge>
        );
      case "pending_responses":
        return <Badge variant="secondary">Pending Responses</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

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
              <TableHead>Responses</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {meetings.length > 0 ? (
              meetings.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.title}</TableCell>
                  <TableCell>{getStatusBadge(m.status)}</TableCell>
                  <TableCell>
                    {`${m.responseCount}/${m.participantCount}`}
                  </TableCell>
                  <TableCell className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        isOrganizer
                          ? navigate(`/meeting/view/${m.id}`)
                          : handleInviteeViewClick(m)
                      }
                    >
                      <Eye className="mr-2 h-4 w-4" /> View
                    </Button>
                    {isOrganizer && m.status === "pending_responses" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRemind(m.id)}
                        disabled={isReminding}
                      >
                        <Send className="mr-2 h-4 w-4" /> Remind
                      </Button>
                    )}
                    {isOrganizer && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={isDeleting}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action will cancel the meeting and notify all
                              participants. This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(m.id)}>
                              Yes, Cancel Meeting
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
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
