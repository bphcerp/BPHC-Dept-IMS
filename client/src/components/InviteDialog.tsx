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
import api from "@/lib/axios-instance";
import { SubmitHandler, useForm } from "react-hook-form";
import {z} from 'zod';

const schema = z.object({
  email: z.string().email(),
})

type FormFields = z.infer<typeof schema>;
export function InviteDialog() {

  const {
    register,
    handleSubmit,
    setError,
    formState: {errors, isSubmitting },
  } = useForm<FormFields>();

  const onSubmit: SubmitHandler<FormFields> = async(data) => {
    try{
      api.post("/admin/member/invite", data);
    }
    catch (error){
      setError("root", {
        message: "This email is already taken",
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Add New Member</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add a New Member</DialogTitle>
          <DialogDescription>
            Enter the email id of the person you want to invite
          </DialogDescription>
        </DialogHeader>
        <form id="emailform" onSubmit={handleSubmit(onSubmit)}>
          <Input
            {...register("email",{
              required: "enter an email",
              validate: (value) => {
                if (!value.includes("@hyderabad.bits-pilani.ac.in")){
                  return "email must be from BITS Hyderabad";
                }
                return true;
              }
            })}
            id="emailid"
            type="email"
            name="email"
            placeholder="name@hyderabad.bits-pilani.ac.in"
            className="col-span-3"
          />
          {errors.email && <div className="text-red-500">{errors.email.message}</div>}
        </form>
        <DialogFooter>
          <Button disabled={isSubmitting} form="emailform" type="submit">
            Invite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
