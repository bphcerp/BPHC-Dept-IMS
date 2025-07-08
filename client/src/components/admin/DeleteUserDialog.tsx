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
import { adminSchemas } from "lib";
import { useNavigate } from "react-router-dom";

const DeleteUserDialog = ({ email }: { email: string }) => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const navigate = useNavigate();

  const deleteMutation = useMutation({
    mutationFn: (data: adminSchemas.DeleteMemberBody) => {
      return api.post("/admin/member/delete", data);
    },
    onSuccess: (_, email) => {
      toast.success("User deleted successfully");
      void queryClient.removeQueries(["member", email]);
      void queryClient.removeQueries(["members"]);
      void queryClient.removeQueries(["roles"]);
      setOpen(false);
      navigate("/admin");
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        const { response } = error;
        if (response?.status === 404) {
          toast.error("User does not exist");
        } else {
          toast.error("Failed to delete user");
        }
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="text-white">
          Delete User
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete User</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this user?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={() => deleteMutation.mutate({ email })}
            disabled={deleteMutation.isLoading}
          >
            {deleteMutation.isLoading ? "Deleting..." : "Confirm Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteUserDialog;
