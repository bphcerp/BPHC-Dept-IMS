import { Button } from "@/components/ui/button";
import {
  DialogHeader,
  DialogFooter,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import useReviewApplicationMutation from "@/hooks/Conference/use-review-application";

const ReviewApplicationDialog = ({
  applId,
  status,
  dialogOpen,
  setDialogOpen,
}: {
  applId: number;
  status: boolean;
  dialogOpen: boolean;
  setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const reviewApplicationMutation = useReviewApplicationMutation();

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{status ? "Accept" : "Reject"} Application</DialogTitle>
          <DialogDescription>
            Are you sure you want to {status ? "accept" : "reject"} this
            application?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setDialogOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant={status ? "default" : "destructive"}
            onClick={() => {
              reviewApplicationMutation.mutate(
                {
                  applId,
                  status,
                },
                {
                  onSuccess: () => {
                    setDialogOpen(false);
                  },
                }
              );
            }}
          >
            {status ? "Accept" : "Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewApplicationDialog;
