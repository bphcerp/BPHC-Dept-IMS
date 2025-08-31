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
import { Checkbox } from "@/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { courseSchema } from "../../../../lib/src/schemas/Allocation";
import { NewCourse } from "../../../../lib/src/types/allocation";

interface AddCourseFormProps {
  children: React.ReactNode;
  onCourseAdded: (newCourse: NewCourse) => void;
}

const AddCourseForm = ({ children, onCourseAdded }: AddCourseFormProps) => {
  const form = useForm<NewCourse>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      isCDC: false,
      hasLongPracticalSec: false,
    },
  });

  const onSubmit = async (values: NewCourse) => {
    console.log("New Course Values: ", values);
    const newCourse: NewCourse = {
      ...values,
      name: values.name.trim(),
      code: values.code.trim().toUpperCase(),
    };

    onCourseAdded(newCourse);
    form.reset();
  };

  const hasPracticalSection = form.watch("practicalSecCount") > 0;

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle> Add a New Course </DialogTitle>
          <DialogDescription>
            {" "}
            Fill in the details of the new course{" "}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex space-x-4">
              <div className="flex-1 space-y-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel> Course Code </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. CS F211" {...field} />
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
                      <FormLabel> Course Title </FormLabel>
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
                  name="units"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel> Credits </FormLabel>
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
                  name="isCDC"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          {" "}
                          Is this a Core Disciplinary Course (CDC)?
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex-1 space-y-4">
                <FormField
                  control={form.control}
                  name="lectureSecCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel> Lecture Sections </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter the number of lecture sections."
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
                  name="tutSecCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel> Tutorial Sections </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter the number of tutorial sections."
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
                  name="practicalSecCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel> Practical Sections </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter the number of practical sections."
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
                {hasPracticalSection && (
                  <FormField
                    control={form.control}
                    name="hasLongPracticalSec"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            {" "}
                            Is the Practical Section 3 hours long?
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>
            <Button type="submit"> Add Course </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
export { AddCourseForm };
