import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { GoogleLogin } from "@react-oauth/google";
import api from "@/lib/axios-instance";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function PushToTDDialog() {
  const [open, setOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [pushMultiDept, setPushMultiDept] = useState(false);
  const [idToken, setIdToken] = useState<string | undefined>();
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  const resetState = () => {
    setAuthenticated(false);
    setPushMultiDept(false);
    setIdToken(undefined);
    setCountdown(null);
    if (countdownRef.current) {
      window.clearTimeout(countdownRef.current);
      countdownRef.current = null;
    }
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    if (!open) resetState();
  }, [open]);

  const mutation = useMutation({
    mutationFn: () =>
      api.post("/allocation/allocation/pushToTD", {
        sendMultiDepartmentCourses: pushMultiDept,
        idToken,
      }),
    onSuccess: () => {
      toast.success(
        "The allocation data has been shared with the Timetable Division."
      );
      setOpen(false);
      resetState();
    },
    onError: () => {
      toast.error("Unable to complete the request. Please try again.");
      setCountdown(null);
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    },
  });

  const startCountdown = (seconds = 10) => {
    if (countdownRef.current) return;
    setCountdown(seconds);
    intervalRef.current = window.setInterval(() => {
      setCountdown((c) => {
        if (typeof c !== "number") return c;
        if (c <= 1) {
          if (intervalRef.current) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (!open) return;
    if (authenticated && countdown === null) {
      startCountdown(10);
    }
  }, [authenticated, open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">Push to TD</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] max-w-6xl overflow-hidden sm:max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Push Allocation To the Timetable Division</DialogTitle>
          <DialogDescription>
            Sign in and confirm to send the current semester's allocation
            details to the Timetable Division.
          </DialogDescription>
        </DialogHeader>

        {!authenticated && (
          <div className="flex flex-col items-center gap-4 py-6">
            <GoogleLogin
              onSuccess={({ credential }) => {
                setAuthenticated(true);
                setIdToken(credential);
              }}
            />
            <p className="text-sm text-muted-foreground">
              Please sign in with your institute account to proceed.
            </p>
          </div>
        )}

        {authenticated && (
          <div
            className="flex flex-col gap-6 overflow-auto py-4"
            style={{ maxHeight: "calc(80vh - 8rem)" }}
          >
            <p className="text-base text-muted-foreground">
              This action will submit all finalised course allocations to the
              Timetable Division for scheduling. Courses without a Timetable
              Division course ID will not be sent.
            </p>

            <Card className="border-muted">
              <CardHeader>
                <CardTitle className="text-base">
                  Joint Course Handling
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Courses that are jointly offered with other departments are
                  not shared by default to avoid overwriting data submitted by
                  another department.
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  If the department alternates offering certain courses across
                  semesters (for example, one department offers a course this
                  semester and another offers it next semester), please enable
                  the option below so those courses are submitted. Leave it
                  unchecked only when a course is being offered by multiple
                  departments in the same semester.
                </p>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="pushMulti"
                    checked={pushMultiDept}
                    onCheckedChange={(v) => setPushMultiDept(Boolean(v))}
                  />
                  <Label
                    htmlFor="pushMulti"
                    className="text-sm leading-relaxed"
                  >
                    Include jointly offered courses when sharing the allocation.
                    <span className="mt-1 block text-xs text-destructive/80">
                      Enabling this may replace entries made by another
                      department.
                    </span>
                  </Label>
                </div>
              </CardContent>
            </Card>

            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-base text-destructive">
                  Important Warning
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <ol className="list-inside list-decimal space-y-2 text-sm text-muted-foreground">
                  <li>
                    Verify that all faculty and PhD scholar records match
                    between IMS and the Timetable Division,{" "}
                    <strong>especially any newly added members</strong>.
                  </li>
                  <li>
                    Ensure PSRN and ERP ID are set for all faculty and PhD
                    scholars in IMS.
                  </li>
                  <li className="text-base font-medium text-destructive">
                    Any mismatch will lead to incomplete data transmission.
                  </li>
                </ol>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-4">
              <p className="text-sm font-semibold text-destructive">
                Restricted Action
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Only the Department HoD and the DCA Convener (as registered in
                the Timetable Division) can push allocations.
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Admin access in IMS does not grant permission for this
                operation.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="sticky bottom-0 left-0 right-0 bg-white/60 py-3 backdrop-blur dark:bg-slate-900/60">
          {authenticated && (
            <div className="flex w-full items-center gap-2">
              <Button
                className="ml-auto"
                disabled={!authenticated || mutation.isLoading || !!countdown}
                onClick={() => {
                  mutation.mutate();
                }}
              >
                {mutation.isLoading
                  ? "Syncing..."
                  : countdown
                    ? `Wait ${countdown}s`
                    : "Confirm & Push"}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
