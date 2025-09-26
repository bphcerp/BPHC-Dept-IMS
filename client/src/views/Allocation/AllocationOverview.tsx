import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Semester,
  semesterTypeMap,
} from "../../../../lib/src/types/allocation";
import { AllocationForm } from "../../../../lib/src/types/allocationFormBuilder";
import { useCallback, useEffect, useState } from "react";

export const AllocationOverview = () => {
  const queryClient = useQueryClient();
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);

  const { data: latestSemester, isLoading } = useQuery({
    queryKey: ["latest-semester"],
    queryFn: () =>
      api<Semester>("/allocation/semester/getLatest").then(({ data }) => data),
    refetchInterval: 1000 * 60 * 5,
  });

  // Fetch all available forms that can be linked
  const { data: forms, isLoading: isLoadingForms } = useQuery({
    queryKey: ["all-forms-for-linking"],
    queryFn: () =>
      api<AllocationForm[]>(
        "/allocation/builder/form/getAll?checkNewSemesterValidity=true"
      ).then(({ data }) => data),
  });

  const linkFormMutation = useMutation({
    mutationFn: ({ formId }: { formId: string }) =>
      api.post(`/allocation/semester/linkForm/${latestSemester?.id}`, {
        formId,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["latest-semester"] });
    },
  });

  const publishFormMutation = useMutation({
    mutationFn: ({ allocationDeadline }: { allocationDeadline: string }) =>
      api.post(`/allocation/semester/publish/${latestSemester?.id}`, {
        allocationDeadline,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["latest-semester"] });
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
    Field: PublishFormField,
    handleSubmit: handlePublishFormSubmit,
    Subscribe: PublishFormSubscribe,
  } = useForm({
    defaultValues: {
      allocationDeadline: "",
    },
    onSubmit: ({ value }) => {
      if (value.allocationDeadline && latestSemester?.form?.id) {
        publishFormMutation.mutate({
          allocationDeadline: value.allocationDeadline,
        });
      }
    },
  });

  const calculateTimeLeft = useCallback(() => {
    if (!latestSemester?.form?.allocationDeadline) return;

    const now = new Date().getTime();
    const end = new Date(latestSemester.form.allocationDeadline).getTime();
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
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateTimeLeft]);

  const getFormattedAY = (year: number) => `${year}-${year + 1}`;

  return !latestSemester ? (
    isLoading ? (
      <span>Loading...</span>
    ) : (
      <div className="flex h-full items-center justify-center">
        <div className="-mt-16 rounded-lg border-2 border-y-primary p-8 text-center">
          <p className="text-lg text-primary-foreground">
            No semesters added yet.
          </p>
        </div>
      </div>
    )
  ) : (
    <div className="courseAllocationOverviewRootContainer flex flex-col space-y-8 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">
          Course Load Allocation Overview
        </h1>
        <div className="flex space-x-2">
          {latestSemester.form &&
            latestSemester.allocationStatus === "notStarted" && (
              <Dialog
                open={isPublishDialogOpen}
                onOpenChange={setIsPublishDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button>Publish Allocation Form</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Publish Allocation Form</DialogTitle>
                    <DialogDescription>
                      Set a deadline for the allocation form submission. This
                      will notify all faculty members.
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
                    <PublishFormField name="allocationDeadline">
                      {(field) => (
                        <div className="flex items-center space-x-3">
                          <Label htmlFor={field.name}>
                            Allocation Form Deadline
                          </Label>
                          <Input
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            type="datetime-local"
                          />
                        </div>
                      )}
                    </PublishFormField>
                  </form>
                  <DialogFooter>
                    <PublishFormSubscribe
                      selector={(state) => [
                        state.values.allocationDeadline,
                        state.isValid,
                      ]}
                    >
                      {([allocationDeadline, isValid]) => (
                        <Button
                          type="submit"
                          form="publish-form"
                          disabled={
                            !isValid ||
                            !allocationDeadline ||
                            publishFormMutation.isLoading
                          }
                        >
                          {publishFormMutation.isLoading
                            ? "Publishing..."
                            : "Publish & Notify"}
                        </Button>
                      )}
                    </PublishFormSubscribe>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          {latestSemester.allocationStatus === "ongoing" && (
            <Button variant="secondary">Send Reminder</Button>
          )}
        </div>
      </header>
      <section className="allocationStatsPanel">
        <h2 className="mb-2 text-xl font-semibold text-primary">Stats</h2>
        {latestSemester.form ? (
          latestSemester.form.publishedDate ? (
            <div className="grid h-auto grid-cols-1 gap-6 md:grid-cols-2">
              {/* Time Remaining */}
              <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-2 shadow-lg transition hover:shadow-xl">
                <span className="text-sm text-gray-500">Time Remaining</span>
                <span className="mt-2 text-5xl font-extrabold text-primary">
                  {timeLeft ?? "--:--:--"}
                </span>
                <span className="mt-1 text-xs text-muted-foreground">
                  DD:HH:MM
                </span>
              </div>

              {/* Responses + Pending */}
              <div className="flex w-full flex-col rounded-2xl bg-white p-2 shadow-lg transition hover:shadow-xl">
                <span className="text-center text-sm text-gray-500">
                  Submission Overview
                </span>

                <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                  <div className="flex flex-col items-center">
                    <span className="text-3xl font-extrabold text-green-600">
                      {latestSemester.form.responses.length}
                    </span>
                    <span className="text-xs text-gray-500">Responded</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="text-3xl font-extrabold text-red-600">
                      5
                    </span>
                    <span className="text-xs text-gray-500">Pending</span>
                  </div>
                </div>

                <div className="mt-6 max-h-32 overflow-y-auto">
                  {latestSemester.form.responses.length ? (
                    <ol className="list-decimal space-y-1 px-5 text-sm">
                      {latestSemester.form.responses.map(
                        ({ submittedBy: { name } }, idx) => (
                          <li key={idx} className="text-gray-700">
                            {name}
                          </li>
                        )
                      )}
                    </ol>
                  ) : (
                    <span className="mt-2 block text-center text-gray-400">
                      No responses yet
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="rounded-xl border border-primary/30 bg-white p-8 text-center shadow-md">
                <p className="text-lg font-medium text-gray-600">
                  Form Not Published Yet
                </p>
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
                            No unlinked forms available.
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
              {latestSemester.form?.allocationDeadline ? (
                new Date(
                  latestSemester.form?.allocationDeadline
                ).toLocaleString("en-IN")
              ) : (
                <span className="text-secondary">Not Set</span>
              )}
            </span>
          </div>
          <div>
            <span>HoD:</span>{" "}
            <span>
              {latestSemester.hodAtStartOfSem?.name ?? (
                <span className="text-secondary">Not Set</span>
              )}
            </span>
          </div>
          <div>
            <span>DCA Convener:</span>{" "}
            <span>
              {latestSemester.dcaConvenerAtStartOfSem?.name ?? (
                <span className="text-secondary">Not Set</span>
              )}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
