import type React from "react";
import { Button } from "@/components/ui/button";
import { conferenceSchemas } from "lib";
import { CardContent, CardFooter } from "@/components/ui/card";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";

const ConferenceApplyView: React.FC = () => {
  const form = useForm<conferenceSchemas.CreateApplicationBody>({
    resolver: zodResolver(conferenceSchemas.createApplicationBodySchema),
  });

  const onSubmit: SubmitHandler<conferenceSchemas.CreateApplicationBody> = (
    formData
  ) => {
    console.log(formData);
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center p-8">
      <Form {...form}>
        <form
          onSubmit={(e) => {
            void form.handleSubmit(onSubmit)(e);
          }}
          className="w-full max-w-5xl"
        >
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {(
                [
                  "purpose",
                  "contentTitle",
                  "eventName",
                  "venue",
                  "organizedBy",
                  "description",
                ] as const
              ).map((fieldName) => {
                return (
                  <FormField
                    key={fieldName}
                    control={form.control}
                    name={fieldName}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {fieldName.replace(/([A-Z]+)/g, " $1").toUpperCase()}
                        </FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                );
              })}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="submit">Save</Button>
            <Button variant="outline">Cancel</Button>
          </CardFooter>
        </form>
      </Form>
    </div>
  );
};

export default ConferenceApplyView;
