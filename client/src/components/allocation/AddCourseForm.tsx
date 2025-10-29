import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { courseSchema } from "../../../../lib/src/schemas/Allocation";
import { NewCourse } from "../../../../lib/src/types/allocation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/axios-instance";
import { TTD_DEPARTMENT_NAME } from "@/lib/constants";

interface AddCourseFormProps {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCourseAdded: () => void;
}

const AddCourseForm = ({
  children,
  open,
  onOpenChange,
  onCourseAdded,
}: AddCourseFormProps) => {
  const form = useForm<NewCourse>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      offeredAs: "CDC",
      markedForAllocation: true,
    },
  });

  const queryClient = useQueryClient();

  const { mutate: addCourse, isLoading } = useMutation({
    mutationFn: async (newCourse: NewCourse) =>
      await api.post("/allocation/course/create", newCourse),
    onSuccess: (data) => {
      if (data?.data?.success) {
        toast.success("Course added successfully!");
        queryClient.invalidateQueries(["allocation", "courses"]);
        onCourseAdded();
        form.reset();
      } else {
        toast.error(data?.data?.message || "An unexpected error occurred.");
      }
    },
    onError: (error) => {
      console.error("Error adding course:", error);
      toast.error("An error occurred while adding the course.");
    },
  });

  const onSubmit = (values: NewCourse) => {
    const newCourse: NewCourse = {
      ...values,
      name: values.name.trim(),
      code: values.code.trim().toUpperCase(),
    };
    addCourse(newCourse);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add a New Course</DialogTitle>
          <DialogDescription>
            Fill in the details of the new course
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Code</FormLabel>
                      <FormControl>
                        <Input placeholder={`e.g. ${TTD_DEPARTMENT_NAME} F211`} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Data Structures and Algorithms"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="totalUnits"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Credits</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter the number of credits."
                          {...field}
                          onChange={(event) =>
                            field.onChange(+event.target.value)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="offeredAs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Offered As</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CDC">CDC</SelectItem>
                            <SelectItem value="DEL">DEL</SelectItem>
                            <SelectItem value="HEL">HEL</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="lectureUnits"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lecture Units</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter the number of lecture units."
                          {...field}
                          onChange={(event) =>
                            field.onChange(+event.target.value)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="practicalUnits"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Practical Units</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter the number of practical units."
                          {...field}
                          onChange={(event) =>
                            field.onChange(+event.target.value)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="timetableCourseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timetable Division Comp Code</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter the computer code"
                          {...field}
                          onChange={(event) =>
                            field.onChange(+event.target.value)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="offeredTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Offered To</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FD">FD</SelectItem>
                            <SelectItem value="HD">HD</SelectItem>
                            <SelectItem value="PhD">PhD</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading} className="w-32">
                {isLoading ? "Adding..." : "Add Course"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export { AddCourseForm };
