// client/src/components/meeting/MeetingDetails.tsx
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Clock, X } from "lucide-react";

interface MeetingDetailsProps {
  meeting: any;
  // Corrected: onFinalize now accepts a single object
  onFinalize: (variables: { finalTimeSlotId: number; location: any }) => void;
  isOrganizer: boolean;
}

export const MeetingDetails: React.FC<MeetingDetailsProps> = ({
  meeting,
  onFinalize,
  isOrganizer,
}) => {
  const getAvailabilityIcon = (status: string) => {
    if (status === "best_available")
      return <Check className="text-green-600" />;
    if (status === "tentative") return <Clock className="text-yellow-600" />;
    return <X className="text-red-600" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{meeting.title}</CardTitle>
          <CardDescription>{meeting.purpose}</CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            <strong>Organizer:</strong> {meeting.organizerEmail}
          </p>
          <p>
            <strong>Status:</strong>{" "}
            <Badge>
              {meeting.finalizedTime ? "Scheduled" : "Pending Response"}
            </Badge>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Participants</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5">
            {meeting.participants.map((p: any) => (
              <li key={p.participantEmail}>{p.participantEmail}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Suggested Time Slots & Availability</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {meeting.timeSlots.map((slot: any) => (
            <div key={slot.id} className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold">
                  {new Date(slot.startTime).toLocaleString()}
                </p>
                {isOrganizer && !meeting.finalizedTime && (
                  // Corrected: Pass a single object to onFinalize
                  <Button
                    size="sm"
                    onClick={() =>
                      onFinalize({
                        finalTimeSlotId: slot.id,
                        location: { type: "google_meet" },
                      })
                    }
                  >
                    Select this time
                  </Button>
                )}
              </div>
              <div className="mt-2 space-y-1">
                {slot.availability.map((avail: any) => (
                  <div
                    key={avail.participantEmail}
                    className="flex items-center gap-2 text-sm"
                  >
                    {getAvailabilityIcon(avail.availability)}
                    <span>{avail.participantEmail}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
