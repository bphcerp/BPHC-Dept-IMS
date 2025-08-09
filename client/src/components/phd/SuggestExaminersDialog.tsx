import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { LoadingSpinner } from "../ui/spinner";

const suggestionSchema = z.object({
  subArea1Examiners: z
    .array(z.string().email("Invalid email").min(1, "Email cannot be empty"))
    .min(1, "At least one examiner is required for Area 1")
    .max(4, "Maximum of 4 examiners for Area 1"),
  subArea2Examiners: z
    .array(z.string().email("Invalid email").min(1, "Email cannot be empty"))
    .min(1, "At least one examiner is required for Area 2")
    .max(4, "Maximum of 4 examiners for Area 2"),
});

type SuggestionFormData = z.infer<typeof suggestionSchema>;

interface PendingSuggestion {
  suggestionRequestId: number;
  studentName: string;
  qualifyingArea1: string;
  qualifyingArea2: string;
  examEventName: string;
}

interface SuggestExaminersDialogProps {
  suggestion: PendingSuggestion | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SuggestExaminersDialog: React.FC<SuggestExaminersDialogProps> = ({
  suggestion,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const form = useForm<SuggestionFormData>({
    resolver: zodResolver(suggestionSchema),
    defaultValues: {
      subArea1Examiners: [""],
      subArea2Examiners: [""],
    },
  });

  const {
    fields: area1Fields,
    append: appendArea1,
    remove: removeArea1,
  } = useFieldArray({
    control: form.control,
    name: "subArea1Examiners",
  });

  const {
    fields: area2Fields,
    append: appendArea2,
    remove: removeArea2,
  } = useFieldArray({
    control: form.control,
    name: "subArea2Examiners",
  });

  const submitMutation = useMutation({
    mutationFn: async (data: SuggestionFormData) => {
      if (!suggestion) throw new Error("No suggestion selected");
      await api.post("/phd/supervisor/suggestions", {
        suggestionRequestId: suggestion.suggestionRequestId,
        subArea1Examiners: data.subArea1Examiners.filter(
          (email) => email.trim() !== "",
        ),
        subArea2Examiners: data.subArea2Examiners.filter(
          (email) => email.trim() !== "",
        ),
      });
    },
    onSuccess: () => {
      toast.success("Examiner suggestions submitted successfully");
      form.reset();
      onSuccess();
    },
    onError: () => {
      toast.error("Failed to submit examiner suggestions");
    },
  });

  const onSubmit = (data: SuggestionFormData) => {
    submitMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  if (!suggestion) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            Suggest Examiners for {suggestion.studentName}
          </DialogTitle>
        </DialogHeader>
        <div className="mb-4 rounded-lg bg-muted p-4">
          <div className="text-sm">
            <strong>Exam Event:</strong> {suggestion.examEventName}
          </div>
          <div className="mt-1 text-sm">
            <strong>Student:</strong> {suggestion.studentName}
          </div>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Area 1 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel className="text-base font-medium">
                  Examiners for {suggestion.qualifyingArea1}
                </FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendArea1("")}
                  disabled={area1Fields.length >= 4}
                >
                  <Plus className="mr-1 h-4 w-4" /> Add Examiner
                </Button>
              </div>
              {area1Fields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <FormField
                    control={form.control}
                    name={`subArea1Examiners.${index}`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            placeholder="examiner@university.edu"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {area1Fields.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeArea1(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Area 2 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel className="text-base font-medium">
                  Examiners for {suggestion.qualifyingArea2}
                </FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendArea2("")}
                  disabled={area2Fields.length >= 4}
                >
                  <Plus className="mr-1 h-4 w-4" /> Add Examiner
                </Button>
              </div>
              {area2Fields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <FormField
                    control={form.control}
                    name={`subArea2Examiners.${index}`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            placeholder="examiner@university.edu"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {area2Fields.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeArea2(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitMutation.isLoading}>
                {submitMutation.isLoading && <LoadingSpinner className="mr-2" />}
                Submit Suggestions
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};