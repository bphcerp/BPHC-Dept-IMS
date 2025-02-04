import { FC } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/axios-instance";
import { isAxiosError } from "axios";

interface DeactivateUserDialogProps {
    email: string;
}

export const DeactivateUserDialog: FC<DeactivateUserDialogProps> = ({
    email,
}) => {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();

    const deactivateMutation = useMutation({
        mutationFn: (email: string) => {
            return api.post("/admin/member/deactivate", { email });
        },
        onSuccess: (_, email) => {
            toast.success("User deactivated successfully");
            void queryClient.refetchQueries(["member", email]);
            setOpen(false);
        },
        onError: (error) => {
            if (isAxiosError(error)) {
                const { response } = error;
                if (response?.status === 404) {
                    toast.error("User does not exist");
                } else {
                    toast.error("Failed to deactivate user");
                }
            }
        },
    });

    const handleDeactivate = () => {
        deactivateMutation.mutate(email);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="destructive" className="text-white">
                    Deactivate User
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Deactivate User</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to deactivate this user? 
                        This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button
                        variant="destructive"
                        onClick={handleDeactivate}
                        disabled={deactivateMutation.isLoading}
                    >
                        {deactivateMutation.isLoading ? "Deactivating..." : "Confirm Deactivate"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default DeactivateUserDialog;
