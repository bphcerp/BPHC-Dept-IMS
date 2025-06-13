import { conferenceSchemas } from "lib";
import { ProgressStatus } from "./StateProgressBar";
import { cn } from "@/lib/utils";
import { FileIcon } from "lucide-react";
import { useMemo } from "react";
import { Separator } from "../ui/separator";

interface FieldProps {
  label: string;
  value?: string | number;
  file?: {
    originalName: string;
    filePath: string;
  };
}

const FieldDisplay = ({ label, value, file }: FieldProps) => {
  return (
    <div className="flex justify-evenly rounded-lg border p-4 shadow-sm">
      <div className="flex min-w-28 flex-1 flex-col gap-2">
        <strong className="text-base font-semibold text-muted-foreground">
          {conferenceSchemas.fieldsToFrontend[
            label as keyof typeof conferenceSchemas.fieldsToFrontend
          ] ?? label.replace(/([A-Z])/g, " $1")}
        </strong>
        <div
          className={cn(
            "relative flex gap-2 overflow-clip overflow-ellipsis rounded-md border bg-gray-100 p-2",
            file ? "cursor-pointer pl-10 hover:bg-muted/50" : undefined
          )}
          onClick={() => {
            if (file) {
              window.open(file.filePath, "_blank");
            }
          }}
        >
          {file && <FileIcon className="absolute left-2" />}
          {(value &&
          conferenceSchemas.dateFieldNames.includes(
            label as (typeof conferenceSchemas.dateFieldNames)[number]
          )
            ? new Date(value).toLocaleDateString()
            : value || (file ? file.originalName : "N/A")) ?? "N/A"}
        </div>
      </div>
    </div>
  );
};

export const ViewApplication = ({
  data,
}: {
  data: conferenceSchemas.ViewApplicationResponse;
}) => {
  const isPending = useMemo(
    () =>
      data
        ? conferenceSchemas.states.indexOf(data.application.state) < 4
        : false,
    [data]
  );

  return (
    <div className="flex flex-col gap-4">
      <ProgressStatus
        currentStage={data.application.state}
        currentStatus={isPending ? "pending" : "accepted"}
      />
      {[
        ...conferenceSchemas.textFieldNames,
        ...conferenceSchemas.dateFieldNames,
      ].map((k) =>
        data.application[k] ? (
          <FieldDisplay key={k} label={k} value={data.application[k]} />
        ) : null
      )}
      <Separator />
      <div>Reimbursement expectations</div>
      {data.application.reimbursements.map(({ key, amount }) => (
        <FieldDisplay key={key} label={key} value={amount} />
      ))}
      {!data.application.reimbursements.length ? (
        <span className="text-muted-foreground">
          No reimbursement expectations
        </span>
      ) : null}
      <Separator />
      <div>Enclosures</div>
      {conferenceSchemas.fileFieldNames.map((k) =>
        data.application[k] ? (
          <FieldDisplay key={k} label={k} file={data.application[k].file} />
        ) : null
      )}
      {!conferenceSchemas.fileFieldNames.filter((k) => data.application[k])
        .length ? (
        <span className="text-muted-foreground">No enclosures</span>
      ) : null}
    </div>
  );
};
