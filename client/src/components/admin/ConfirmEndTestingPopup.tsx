import { Card, CardContent } from "../ui/card";
import { Button } from "@/components/ui/button";

function ConfirmEndTestingPopup({
  value,
  setValue,
  callback,
}: {
  value: boolean;
  setValue: (val: boolean) => void;
  callback: () => void;
}) {
  return value ? (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40">
      <Card className="relative space-y-4 rounded-lg px-2 pt-6">
        <CardContent className="flex flex-col items-start justify-start gap-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-lg font-bold">
              Are you sure you want to finish testing?
            </h1>
            <h2 className="text-wrap">
              This action will terminate current testing roles and revert to
              your original settings.
            </h2>
          </div>
          <div className="flex flex-row gap-4">
            <Button type="submit" className="w-max" onClick={callback}>
              Finish Testing
            </Button>
            <Button
              type="submit"
              variant={"outline"}
              className="w-max"
              onClick={() => setValue(false)}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  ) : null;
}

export default ConfirmEndTestingPopup;
