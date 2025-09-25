// client/src/views/Phd/DrcConvenor/SeminarScheduling.tsx
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

const SeminarScheduling: React.FC = () => {
  const queryClient = useQueryClient();
  const [venue, setVenue] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");

  const { data: slots, isLoading: isLoadingSlots } = useQuery({
    queryKey: ["seminar-slots"],
    queryFn: async () => {
      const res = await api.get("/phd/proposal/drcConvener/seminarSlots");
      return res.data;
    },
  });

  const createSlotsMutation = useMutation({
    mutationFn: (newSlots: {
      slots: { venue: string; startTime: string; endTime: string }[];
    }) => api.post("/phd/proposal/drcConvener/seminarSlots", newSlots),
    onSuccess: () => {
      toast.success("Seminar slots created successfully.");
      void queryClient.invalidateQueries({ queryKey: ["seminar-slots"] });
      setVenue("");
      setDate("");
    },
    onError: () => {
      toast.error(
        "Failed to create slots. They may conflict with existing slots."
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);
    if (start >= end) {
      toast.error("Start time must be before end time.");
      return;
    }

    const slotsToCreate = [];
    let current = start;
    while (current < end) {
      const next = new Date(current.getTime() + 30 * 60000); // 30 minutes
      slotsToCreate.push({
        venue,
        startTime: current.toISOString(),
        endTime: next.toISOString(),
      });
      current = next;
    }

    if (slotsToCreate.length > 0) {
      createSlotsMutation.mutate({ slots: slotsToCreate });
    }
  };

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="text-center">
        <h1 className="text-3xl font-bold">Seminar Slot Management</h1>
        <p className="mt-2 text-gray-600">
          Create and view available time slots for PhD proposal seminars.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Create New Seminar Slots</CardTitle>
          <CardDescription>
            Define a date, venue, and time range to generate 30-minute slots.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
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

      <Card>
        <CardHeader>
          <CardTitle>Existing Seminar Slots</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingSlots ? (
            <LoadingSpinner />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slots?.length > 0 ? (
                  slots.map((slot: any) => (
                    <TableRow key={slot.id}>
                      <TableCell>
                        {new Date(slot.startTime).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(slot.startTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        -
                        {new Date(slot.endTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>{slot.venue}</TableCell>
                      <TableCell>
                        {slot.isBooked ? (
                          <Badge>Booked by {slot.proposal.student.name}</Badge>
                        ) : (
                          <Badge variant="outline">Available</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      No slots created yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SeminarScheduling;
