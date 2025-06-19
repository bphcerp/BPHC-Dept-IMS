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
          ] ?? label}
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

  const totalReimbursement = useMemo(
    () =>
      data.application.reimbursements.reduce(
        (sum, { amount }) => sum + parseFloat(amount || "0"),
        0
      ),
    [data.application.reimbursements]
  );

  const totalFunding = useMemo(
    () =>
      data.application.fundingSplit?.reduce(
        (sum, { amount }) => sum + parseFloat(amount || "0"),
        0
      ) || 0,
    [data.application.fundingSplit]
  );

  const dateRange = useMemo(() => {
    const fromDate = new Date(data.application.dateFrom).toLocaleDateString();
    const toDate = new Date(data.application.dateTo).toLocaleDateString();
    return fromDate === toDate ? fromDate : `${fromDate} - ${toDate}`;
  }, [data.application.dateFrom, data.application.dateTo]);

  return (
    <div className="flex flex-col gap-4">
      <ProgressStatus
        currentStage={data.application.state}
        currentStatus={isPending ? "pending" : "accepted"}
      />
      {conferenceSchemas.textFieldNames.map((k) =>
        data.application[k] && !["dateFrom", "dateTo"].includes(k) ? (
          <FieldDisplay key={k} label={k} value={data.application[k]} />
        ) : null
      )}
      <FieldDisplay key="date" label="Date" value={dateRange} />
      <Separator />
      <div className="flex items-center justify-between">
        <span>Reimbursement expectations</span>
        <span className="text-sm font-medium">
          Total: ₹{totalReimbursement.toFixed(2)}
        </span>
      </div>
      {data.application.reimbursements.map(({ key, amount }) => (
        <FieldDisplay
          key={key}
          label={key}
          value={parseFloat(amount).toFixed(2)}
        />
      ))}
      {!data.application.reimbursements.length ? (
        <span className="text-muted-foreground">
          No reimbursement expectations
        </span>
      ) : null}
      {data.application.fundingSplit?.length ? (
        <>
          <Separator />
          <div className="flex items-center justify-between">
            <span>Funding Split</span>
            <span className="text-sm font-medium">
              Total: ₹{totalFunding.toFixed(2)}
            </span>
          </div>
        </>
      ) : null}
      {data.application.fundingSplit?.map(({ source, amount }) => (
        <FieldDisplay
          key={source}
          label={source}
          value={parseFloat(amount).toFixed(2)}
        />
      ))}
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
