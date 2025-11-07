// TODO: fetch HoD and Convener details from the server

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { NewSemester } from "../../../../lib/src/types/allocation";
import { semesterSchema } from "../../../../lib/src/schemas/Allocation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/axios-instance";
import { AxiosError } from "axios";
import { useNavigate } from "react-router-dom";

const RegisterNewSemester = () => {
  const form = useForm({
    resolver: zodResolver(semesterSchema),
    defaultValues: {
      semesterType: "1",
      allocationStatus: "notStarted",
      year: new Date().getFullYear(),
      startDate: "",
      endDate: "",
    } as NewSemester,
  });

  const navigate = useNavigate();

  const { mutate: addSemester, isLoading } = useMutation({
    mutationFn: (newSemester: NewSemester) =>
      api.post("/allocation/semester/create", newSemester),
    onSuccess: () => {
      toast.success("Semester added successfully!");
      form.reset();
      navigate(-1);
    },
    onError: (error) => {
      console.error("Error adding semester:", error);
      toast.error(
        ((error as AxiosError).response?.data as string) ??
          "An error occurred while adding the semester."
      );
    },
  });

  const onSubmit = (values: NewSemester) => addSemester(values);

  return (
    <div className="registerNewSemesterContainer flex flex-col space-y-8 p-4">
      <h1 className="text-3xl font-bold text-primary">Register New Semester</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <h2 className="mb-2 text-xl font-semibold text-primary">
            Semester Details
          </h2>
          <section className="semesterDetails grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Year</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="semesterType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Semester Type</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Odd</SelectItem>
                        <SelectItem value="2">Even</SelectItem>
                        <SelectItem value="3">Summer</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>
          <h4 className="text-sm italic text-muted-foreground">
            * HoD and DCA Convener are automatically fetched from the TimeTable
            Division
          </h4>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Register Semester"}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default RegisterNewSemester;
