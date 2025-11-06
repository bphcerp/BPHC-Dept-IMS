import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Dialog as UIDialog,
  DialogContent as UIDialogContent,
  DialogHeader as UIDialogHeader,
  DialogTitle as UIDialogTitle,
} from "@/components/ui/dialog";
import { useCallback, useEffect, useState, lazy, Suspense } from "react";

const MDEditor = lazy(() => import("@uiw/react-md-editor"));
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/lib/axios-instance";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  semesterTypeMap,
  SemesterWithStats,
} from "../../../../lib/src/types/allocation";
import { AllocationForm } from "../../../../lib/src/types/allocationFormBuilder";
import { useTheme } from "@/hooks/use-theme";
import {
  DEPARTMENT_NAME,
  DEPARTMENT_NAME_FULL,
  FRONTEND_URL,
} from "@/lib/constants";
import { AlertTriangle, CheckCircle, Info, Maximize2Icon } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { LoadingSpinner } from "@/components/ui/spinner";
import { AxiosError } from "axios";
import { Role } from "@/components/admin/RoleList";
import PushToTDDialog from "@/components/allocation/PushToTDDialog";
import { degreeTypes } from "../../../../lib/src/schemas/Allocation";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export const getFormattedAY = (year: number) => `${year}-${year + 1}`;

export const AllocationOverview = () => {
  const queryClient = useQueryClient();
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const [isFinishDialogOpen, setIsFinishDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [emailPreviewed, setEmailPreviewed] = useState(false);
  const editorTheme = useTheme();

  const { data: latestSemester } = useQuery({
    queryKey: ["allocation", "semester", "latest-full-stats"],
    queryFn: () =>
      api<SemesterWithStats>("/allocation/semester/getLatest?stats=true").then(
        ({ data }) => data
      ),
    staleTime: 1000 * 60 * 5,
  });

  const { data: roles } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const response = await api.get<Role[]>("/admin/role");
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
    enabled:
      !!latestSemester && latestSemester.allocationStatus === "notStarted",
  });

  // Fetch all available forms that can be linked
  const { data: forms, isLoading: isLoadingForms } = useQuery({
    queryKey: ["all-forms-for-linking"],
    queryFn: () =>
      api<AllocationForm[]>(
        "/allocation/builder/form/getAll?checkNewSemesterValidity=true"
      ).then(({ data }) => data),
    enabled:
      !!latestSemester && latestSemester.allocationStatus === "notStarted",
  });

  const linkFormMutation = useMutation({
    mutationFn: ({ formId }: { formId: string }) =>
      api.post(`/allocation/semester/linkForm/${latestSemester?.id}`, {
        formId,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["semester"] });
    },
  });

  const unlinkFormMutation = useMutation({
    mutationFn: () =>
      api.post(`/allocation/semester/unlinkForm/${latestSemester?.id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["semester"] });
    },
  });

  const remindMutation = useMutation({
    mutationFn: () =>
      api
        .post("/allocation/semester/remind")
        .then(() => toast.success("Reminder successfully sent"))
        .catch((e) => {
          console.error("Error while sending reminder", e);
          toast.error(
            ((e as AxiosError).response?.data as string) ??
              "Something went wrong"
          );
        }),
  });

  const endFormMutation = useMutation({
    mutationFn: () =>
      api
        .post("/allocation/semester/endForm")
        .then(() => {
          toast.success("Form successfully closed");
          queryClient.invalidateQueries(["semester"]);
        })
        .catch((e) => {
          console.error("Error while closing form", e);
          toast.error("Something went wrong");
        }),
  });
  

  const endSemesterMutation = useMutation({
    mutationFn: () =>
      api
        .post("/allocation/semester/end")
        .then(async () => {
          toast.success("Semester marked as completed successfully");
          queryClient.invalidateQueries(["allocation", "semester"]);
          setIsFinishDialogOpen(false);
        })
        .catch((e) => {
          console.error("Error while marking semester as complete", e);
          toast.error("Something went wrong");
        }),
  });

  const publishFormMutation = useMutation({
    mutationFn: ({
      formDeadline,
      emailBody,
      isPublishedToRoleId,
    }: {
      formDeadline: string;
      emailBody: string;
      isPublishedToRoleId: string;
    }) =>
      api.post(`/allocation/semester/publish/${latestSemester?.id}`, {
        formDeadline,
        emailBody,
        isPublishedToRoleId,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["semester"] });
      setIsPublishDialogOpen(false); // Close dialog on success
    },
  });

  const {
    Field: LinkFormField,
    handleSubmit: handleLinkFormSubmit,
    Subscribe: LinkFormSubscribe,
  } = useForm({
    defaultValues: {
      formId: "",
    },
    onSubmit: ({ value }) => {
      if (value.formId) {
        linkFormMutation.mutate(value);
      }
    },
  });

  const {
    state: emailFormState,
    Field: PublishFormField,
    handleSubmit: handlePublishFormSubmit,
    Subscribe: PublishFormSubscribe,
    setFieldValue: setPublishFormFieldValue,
    reset: resetPublishForm,
  } = useForm({
    defaultValues: {
      formDeadline: "",
      emailBody: "",
      isPublishedToRoleId: "",
    },
    onSubmit: ({ value }) => {
      if (
        value.formDeadline &&
        latestSemester?.form?.id &&
        value.isPublishedToRoleId
      ) {
        publishFormMutation.mutate(value);
      }
    },
  });

  const getEmailBody = (formDeadline: string) => `Dear Professor/Mr./Ms.,

Please fill your course options for the ${semesterTypeMap[latestSemester!.semesterType]} SEMESTER AY ${getFormattedAY(latestSemester!.year)}. Ignore this email if you have already filled your preferences.

You may access the portal using the following link: [${DEPARTMENT_NAME} IMS Allocation Form ${semesterTypeMap[latestSemester!.semesterType]} SEMESTER AY ${getFormattedAY(latestSemester!.year)}](${FRONTEND_URL}/allocation/submit)

**PLEASE FILL THE FORM BEFORE ${new Date(formDeadline).toLocaleString("en-IN", {
    timeZoneName: "short",
  })}**

<hr></hr>

<span style="color:blue">${DEPARTMENT_NAME} Office  
${DEPARTMENT_NAME_FULL ?? ""}  
Birla Institute of Technology and Science Pilani  
Hyderabad Campus<span>
`;

  const calculateTimeLeft = useCallback(() => {
    if (
      !latestSemester?.form?.formDeadline ||
      latestSemester.allocationStatus !== "formCollection"
    )
      return "00:00:00";

    const now = new Date().getTime();
    const end = new Date(latestSemester.form.formDeadline).getTime();
    const distance = end - now;

    if (distance <= 0) return "00:00:00";

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

    const pad = (num: number) => String(num).padStart(2, "0");
    return `${pad(days)}:${pad(hours)}:${pad(minutes)}`;
  }, [latestSemester]);

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    if (
      !!latestSemester &&
      latestSemester.allocationStatus !== "formCollection"
    )
      return;

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateTimeLeft]);

  return !latestSemester ? (
    <div className="flex h-full items-center justify-center">
      <div className="-mt-16 rounded-lg border-2 border-y-primary p-8 text-center">
        <p className="text-lg text-primary">No semesters added yet.</p>
      </div>
    </div>
  ) : (
    <div className="courseAllocationOverviewRootContainer flex flex-col space-y-8 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">Overview</h1>
        <div className="flex space-x-2">
          {latestSemester.form &&
            latestSemester.allocationStatus === "notStarted" && (
              <>
                <Button
                  onClick={() => unlinkFormMutation.mutate()}
                  variant="destructive"
                >
                  Unlink Form
                </Button>
                <Dialog
                  open={isPublishDialogOpen}
                  onOpenChange={(open) => {
                    if (!open) resetPublishForm();
                    setIsPublishDialogOpen(open);
                  }}
                >
                  <DialogTrigger asChild>
                    <Button>Publish Allocation Form</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Publish Allocation Form</DialogTitle>
                      <DialogDescription className="flex flex-col space-y-2">
                        <p>
                          Set a deadline for the allocation form submission and
                          select the role to which the form should be published.
                        </p>
                        <p>
                          An email will be sent to all the users with the role
                          selected.
                        </p>
                      </DialogDescription>
                    </DialogHeader>
                    <form
                      id="publish-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        void handlePublishFormSubmit();
                      }}
                    >
                      <div className="grid grid-rows-2 gap-4">
                        <PublishFormField name="formDeadline">
                          {(field) => (
                            <div className="flex items-center justify-between space-x-3">
                              <Label htmlFor={field.name}>
                                Allocation Form Deadline
                              </Label>
                              <Input
                                id={field.name}
                                name={field.name}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                className="w-52"
                                onChange={(e) => {
                                  field.handleChange(e.target.value);
                                  setEmailPreviewed(false);
                                  setPublishFormFieldValue(
                                    "emailBody",
                                    getEmailBody(e.target.value)
                                  );
                                }}
                                type="datetime-local"
                              />
                            </div>
                          )}
                        </PublishFormField>
                        <PublishFormField name="isPublishedToRoleId">
                          {(field) => (
                            <div className="flex items-center justify-between space-x-3">
                              <Label>Publish To Role</Label>
                              <Select
                                value={field.state.value}
                                onValueChange={(val) => field.handleChange(val)}
                              >
                                <SelectTrigger className="w-52">
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                  {roles?.map((role) => (
                                    <SelectItem
                                      key={role.id}
                                      value={role.id.toString()}
                                    >
                                      {role.roleName}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </PublishFormField>
                      </div>
                      <UIDialog
                        open={previewOpen}
                        modal
                        onOpenChange={(open) => {
                          setPreviewOpen(open);
                        }}
                      >
                        <UIDialogContent className="w-screen max-w-full">
                          <UIDialogHeader>
                            <UIDialogTitle>Edit Email</UIDialogTitle>
                          </UIDialogHeader>
                          <div className="py-2" data-color-mode={editorTheme}>
                            <PublishFormField name="emailBody">
                              {(field) => (
                                <div className="relative h-full">
                                  <Suspense
                                    fallback={
                                      <div className="w-full text-center">
                                        Loading editor...
                                      </div>
                                    }
                                  >
                                    <MDEditor
                                      value={field.state.value}
                                      onChange={(val) =>
                                        field.handleChange(val ?? "")
                                      }
                                      height={400}
                                      preview="live"
                                      commandsFilter={(command) =>
                                        command.name !== "fullscreen"
                                          ? command
                                          : false
                                      }
                                    />
                                  </Suspense>
                                </div>
                              )}
                            </PublishFormField>
                          </div>
                          <Button
                            className="mt-2"
                            onClick={() => {
                              setPreviewOpen(false);
                              setEmailPreviewed(true);
                            }}
                          >
                            Done
                          </Button>
                          <style>
                            {`
                      .wmde-markdown ul { list-style-type: disc; margin-left: 1.5rem; }
                      .wmde-markdown ol { list-style-type: decimal; margin-left: 1.5rem; }
                    `}
                          </style>
                        </UIDialogContent>
                      </UIDialog>
                    </form>
                    <DialogFooter>
                      <PublishFormSubscribe
                        selector={(state) => [
                          state.values.formDeadline,
                          state.values.isPublishedToRoleId,
                          state.isValid,
                        ]}
                      >
                        {([formDeadline, isPublishedToRoleId, isValid]) => (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              disabled={
                                !isValid ||
                                !formDeadline ||
                                !isPublishedToRoleId ||
                                publishFormMutation.isLoading
                              }
                              onClick={() => {
                                if (!previewOpen) setPreviewOpen(true);
                              }}
                            >
                              Preview Email
                            </Button>
                            <Button
                              type="submit"
                              form="publish-form"
                              disabled={
                                !isValid ||
                                !formDeadline ||
                                !isPublishedToRoleId ||
                                !emailFormState.values.emailBody ||
                                publishFormMutation.isLoading ||
                                !emailPreviewed
                              }
                            >
                              {publishFormMutation.isLoading
                                ? "Publishing..."
                                : "Publish & Notify"}
                            </Button>
                          </>
                        )}
                      </PublishFormSubscribe>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
          {latestSemester.allocationStatus === "formCollection" && (
            <>
              <Button
                variant="secondary"
                disabled={remindMutation.isLoading}
                onClick={() => remindMutation.mutate()}
              >
                Send Reminder
                {remindMutation.isLoading && <LoadingSpinner />}
              </Button>
              <Button
                variant="destructive"
                onClick={() => endFormMutation.mutate()}
              >
                End Responses Collection
              </Button>
            </>
          )}
          {latestSemester.allocationStatus === "inAllocation" && (
            <div className="flex space-x-2">
              <Button>
                <Link to="/allocation/summary">View Current Allocation</Link>
              </Button>
              <PushToTDDialog />
              <Dialog
                open={isFinishDialogOpen}
                onOpenChange={(open) => {
                  setIsFinishDialogOpen(open);
                }}
              >
                <DialogTrigger asChild>
                  <Button className="bg-green-600 text-white hover:bg-green-600/90">
                    Finish Allocation
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-5xl">
                  <DialogHeader>
                    <DialogTitle>Confirm Finish Allocation</DialogTitle>
                    <DialogDescription>
                      This operation will mark the allocation as completed and
                      trigger handout requests. Please review the status below
                      before proceeding.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid max-h-[60vh] grid-cols-1 gap-6 overflow-y-auto p-1">
                    {/* Stats summary cards */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      {degreeTypes.map((degree) => {
                        const stats = latestSemester.allocationStats?.[
                          degree
                        ] || {
                          notStarted: 0,
                          pending: 0,
                          completed: 0,
                        };
                        return (
                          <Card key={degree}>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-lg font-semibold text-primary">
                                {degree}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-1.5">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                  Not Started:
                                </span>
                                <span className="font-bold text-foreground">
                                  {stats.notStarted}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                  Pending:
                                </span>
                                <span className="font-bold text-orange-600">
                                  {stats.pending}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                  Allocated:
                                </span>
                                <span className="font-bold text-green-600">
                                  {stats.completed}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>

                    {/* Totals and confirmation message */}
                    {(() => {
                      const statsArr = degreeTypes.map(
                        (degree) =>
                          latestSemester.allocationStats?.[degree] || {
                            notStarted: 0,
                            pending: 0,
                          }
                      );
                      const totalNotStarted = statsArr.reduce(
                        (acc, s) => acc + (s.notStarted ?? 0),
                        0
                      );
                      const totalPending = statsArr.reduce(
                        (acc, s) => acc + (s.pending ?? 0),
                        0
                      );

                      if (totalNotStarted > 0 || totalPending > 0) {
                        return (
                          <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Warning</AlertTitle>
                            <AlertDescription>
                              There are{" "}
                              <span className="font-bold">
                                {totalNotStarted}
                              </span>{" "}
                              courses not started and{" "}
                              <span className="font-bold">{totalPending}</span>{" "}
                              courses pending allocation. Please ensure all
                              courses are properly allocated.
                            </AlertDescription>
                          </Alert>
                        );
                      }

                      return (
                        <Alert className="border-green-600 text-green-700 dark:border-green-500 dark:text-green-400">
                          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-500" />
                          <AlertTitle className="text-green-700 dark:text-green-400">
                            Allocation Complete
                          </AlertTitle>
                          <AlertDescription>
                            All courses marked for allocation have been
                            successfully allocated.
                          </AlertDescription>
                        </Alert>
                      );
                    })()}

                    {/* Handout creation notice */}
                    <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <AlertTitle className="text-blue-800 dark:text-blue-300">
                        Automatic Handout Creation
                      </AlertTitle>
                      <AlertDescription className="text-blue-700 dark:text-blue-300/90">
                        By confirming, the system will automatically initiate
                        handout request creation for all courses with an
                        Instructor-in-Charge (IC).
                      </AlertDescription>
                    </Alert>
                  </div>

                  <DialogFooter className="border-t pt-4">
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button
                      className="bg-green-600 text-white hover:bg-green-600/90"
                      disabled={endSemesterMutation.isLoading}
                      onClick={() => endSemesterMutation.mutate()}
                    >
                      {endSemesterMutation.isLoading
                        ? "Finishing..."
                        : "Confirm & Finish Allocation"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </header>
      <section className="allocationStatsPanel">
        <h2 className="mb-2 text-xl font-semibold text-primary">Stats</h2>
        {latestSemester.form ? (
          latestSemester.allocationStatus === "formCollection" ? (
            <div className="grid h-auto grid-cols-1 gap-6 md:grid-cols-2">
              {/* Time Remaining */}
              <div className="flex flex-col items-center justify-center space-y-5 rounded-2xl p-2 shadow-lg transition hover:shadow-xl">
                <span className="text-sm text-gray-500">Time Remaining</span>
                <span
                  className={`"mt-2 text-5xl font-extrabold ${timeLeft === "00:00:00" ? "text-red-600" : "text-primary"}`}
                >
                  {timeLeft ?? "--:--:--"}
                </span>
                <span className="mt-1 text-xs text-muted-foreground">
                  DD:HH:MM
                </span>
              </div>

              {/* Responses + Pending */}
              <div className="relative flex w-full flex-col justify-center rounded-2xl shadow-lg transition hover:shadow-xl">
                <span className="text-center text-sm text-gray-500">
                  Submission Overview
                </span>

                <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0"
                      >
                        <Maximize2Icon className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>

                    <DialogContent className="max-w-6xl">
                      <DialogHeader>
                        <DialogTitle>Response Overview</DialogTitle>
                      </DialogHeader>
                      <div className="grid grid-cols-2 gap-6">
                        {/* Responded List */}
                        <div className="border-r pr-4">
                          <h3 className="mb-2 font-semibold text-green-600">
                            Responded
                          </h3>
                          <ul className="h-64 space-y-2 overflow-y-auto text-sm">
                            {latestSemester.form.responses &&
                            latestSemester.form.responses.length ? (
                              latestSemester.form.responses.map(
                                ({ submittedBy }) => (
                                  <li
                                    key={submittedBy.email}
                                    className={`flex items-center justify-between rounded-md p-2 ${
                                      submittedBy.type.toLowerCase() ===
                                      "faculty"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-blue-100 text-blue-800"
                                    } transition-shadow hover:shadow-md`}
                                  >
                                    <span>
                                      {submittedBy.name ??
                                        `No Name - ${submittedBy.email}`}
                                    </span>
                                    <span className="text-xs font-semibold uppercase">
                                      {submittedBy.type}
                                    </span>
                                  </li>
                                )
                              )
                            ) : (
                              <p className="text-destructive">
                                No responses yet.
                              </p>
                            )}
                          </ul>
                        </div>

                        {/* Not Responded List */}
                        <div>
                          <h3 className="mb-2 font-semibold text-red-600">
                            Not Responded
                          </h3>
                          <ul className="h-64 space-y-2 overflow-y-auto text-sm">
                            {!!latestSemester.notResponded &&
                            latestSemester.notResponded.length > 0 ? (
                              latestSemester.notResponded.map((responder) => (
                                <li
                                  key={responder.email}
                                  className={`flex items-center justify-between rounded-md p-2 ${
                                    responder.type.toLowerCase() === "faculty"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  } transition-shadow hover:shadow-md`}
                                >
                                  <span>
                                    {responder.name ??
                                      `No Name - ${responder.email}`}
                                  </span>
                                  <span className="text-xs font-semibold uppercase">
                                    {responder.type}
                                  </span>
                                </li>
                              ))
                            ) : (
                              <p className="text-success">
                                Everyone has responded.
                              </p>
                            )}
                          </ul>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <div className="flex flex-col items-center">
                    <span className="text-3xl font-extrabold text-green-600">
                      {latestSemester.form.responses.length}
                    </span>
                    <span className="text-xs text-gray-500">Responded</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="text-3xl font-extrabold text-red-600">
                      {latestSemester.notResponded?.length ?? 0}
                    </span>
                    <span className="text-xs text-gray-500">Pending</span>
                  </div>
                </div>
              </div>
            </div>
          ) : !latestSemester.form.publishedDate ? (
            <div className="flex h-full items-center justify-center">
              <div className="rounded-xl border border-primary/30 bg-white p-8 text-center shadow-md">
                <p className="text-lg font-medium text-gray-600">
                  Form Not Published Yet
                </p>
              </div>
            </div>
          ) : (
            latestSemester.allocationStatus === 'inAllocation' ? <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {(["FD", "HD", "PhD"] as const).map((degree) => {
                const stats = latestSemester.allocationStats?.[degree];
                return (
                  <div
                    key={degree}
                    className="flex items-center justify-center space-x-4 rounded-2xl p-4 shadow-lg transition hover:shadow-xl"
                  >
                    <span className="text-lg font-semibold text-primary">
                      {degree}
                    </span>
                    <div className="flex flex-col items-center">
                      <span className="text-3xl font-extrabold text-gray-700">
                        {stats?.notStarted ?? 0}
                      </span>
                      <span className="text-xs text-gray-500">Not Started</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-3xl font-extrabold text-orange-600">
                        {stats?.pending ?? 0}
                      </span>
                      <span className="text-xs text-gray-500">Pending</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-3xl font-extrabold text-green-600">
                        {stats?.completed ?? 0}
                      </span>
                      <span className="text-xs text-gray-500">Allocated</span>
                    </div>
                  </div>
                );
              })}
            </div> :  <div className="flex h-full items-center justify-center">
              <div className="rounded-xl border border-primary/30 bg-white p-8 text-center shadow-md">
                <p className="text-lg font-medium text-gray-600">
                  Allocation Complete
                </p>
                <span className="text-sm font-bold">Semester is still active</span>
              </div>
            </div>
          )
        ) : (
          <div className="flex h-36 items-center justify-center">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void handleLinkFormSubmit();
              }}
              className="flex flex-col items-center justify-center space-y-4 rounded-lg border-2 border-y-primary p-12 text-center"
            >
              <p className="text-lg text-primary">No Form Linked</p>
              <div className="flex items-center space-x-2">
                <LinkFormSubscribe selector={(state) => state.values.formId}>
                  {(formId) => (
                    <Button type="submit" disabled={!formId}>
                      {linkFormMutation.isLoading ? "Linking..." : "Link Form"}
                    </Button>
                  )}
                </LinkFormSubscribe>
                <LinkFormField name="formId">
                  {(field) => (
                    <Select
                      onValueChange={field.handleChange}
                      value={field.state.value}
                    >
                      <SelectTrigger className="w-72">
                        <SelectValue placeholder="Choose a form to link" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingForms ? (
                          <div className="p-2 text-sm text-muted-foreground">
                            Loading forms...
                          </div>
                        ) : forms && forms.length > 0 ? (
                          forms.map((form) => (
                            <SelectItem key={form.id} value={form.id}>
                              {form.title} - (Template: {form.template.name})
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-sm text-muted-foreground">
                            No forms available.
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </LinkFormField>
              </div>
            </form>
          </div>
        )}
      </section>

      <section className="flex flex-col space-y-3">
        <h2 className="mb-2 text-xl font-semibold text-primary">
          Current Semester Details
        </h2>
        <h4 className="text-sm italic text-muted-foreground">
          * HoD and DCA Convener are automatically fetched from the TimeTable
          Division. This data reflects the semester information as of{" "}
          {new Date(latestSemester.createdAt).toLocaleDateString("en-IN")}
        </h4>
        {latestSemester.formId && (
          <div className="text-sm">
            <span>
              Using Form:{" "}
              <Button className="m-0 h-fit p-0 italic" variant="link">
                <Link to={`/allocation/forms/${latestSemester.formId}/preview`}>
                  {latestSemester.form.title}
                </Link>
              </Button>
            </span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4 text-base font-medium text-muted-foreground md:grid-cols-3">
          <div>
            <span>Semester:</span>{" "}
            <span>{semesterTypeMap[latestSemester.semesterType]}</span>
          </div>
          <div>
            <span>Academic Year:</span>{" "}
            <span>{getFormattedAY(latestSemester.year)}</span>
          </div>
          <div>
            <span>Allocation Started On:</span>{" "}
            <span>
              {latestSemester.form?.publishedDate ? (
                new Date(latestSemester.form?.publishedDate).toLocaleString(
                  "en-IN"
                )
              ) : (
                <span className="text-secondary">Not Set</span>
              )}
            </span>
          </div>
          <div>
            <span>Allocation Form Deadline:</span>{" "}
            <span>
              {latestSemester.form?.formDeadline ? (
                new Date(latestSemester.form?.formDeadline).toLocaleString(
                  "en-IN"
                )
              ) : (
                <span className="text-secondary">Not Set</span>
              )}
            </span>
          </div>
          <div>
            <span>HoD:</span>{" "}
            <span>
              {latestSemester.hodAtStartOfSem ? (
                (latestSemester.hodAtStartOfSem.name ??
                latestSemester.hodAtStartOfSem.email)
              ) : (
                <span className="text-secondary">Not Set</span>
              )}
            </span>
          </div>
          <div>
            <span>DCA Convener:</span>{" "}
            <span>
              {latestSemester.dcaConvenerAtStartOfSem ? (
                (latestSemester.dcaConvenerAtStartOfSem.name ??
                latestSemester.dcaConvenerAtStartOfSem.email)
              ) : (
                <span className="text-secondary">Not Set</span>
              )}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
