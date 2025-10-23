import { DataTable } from "@/components/shared/datatable/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  AllocationForm,
  AllocationFormTemplate,
  NewAllocationForm,
} from "../../../../lib/src/types/allocationFormBuilder";
import api from "@/lib/axios-instance";
import { toast } from "sonner";
import { useAuth } from "@/hooks/Auth";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { LoadingSpinner } from "@/components/ui/spinner";

const FormList = () => {
  const { checkAccessAnyOne } = useAuth();
  const queryClient = useQueryClient();

  const { data: templates, isLoading: isTemplateQueryLoading } = useQuery({
    queryKey: ["form-builder", "templates"],
    queryFn: async () =>
      api<AllocationFormTemplate[]>("/allocation/builder/template/getAll")
        .then(({ data }) => data)
        .catch((e) => {
          toast.error("Error in fetching templates!");
          console.error("Error in getting templates: ", e);
          return [];
        }),
  });

  const { data: forms, isLoading: isFormQueryLoading } = useQuery({
    queryKey: ["form-builder", "forms"],
    queryFn: async () =>
      api<AllocationForm[]>("/allocation/builder/form/getAll")
        .then(({ data }) => data)
        .catch((e) => {
          toast.error("Error in fetching forms!");
          console.error("Error in getting forms: ", e);
          return [];
        }),
  });

  const { mutate: deleteFormMutation, isLoading: isDeleteFormMutationLoading } =
    useMutation({
      mutationKey: ["allocation-form", "delete"],
      mutationFn: (formId: string) =>
        api
          .delete(`/allocation/builder/form/delete/${formId}`)
          .then(() => {
            queryClient.invalidateQueries(["allocation-forms"]);
          })
          .catch((e) => {
            toast.error(
              ((e as AxiosError).response?.data as string) ??
                "Something went wrong"
            );
            console.error(
              `Something went wrong while deleting form ${formId}`,
              e
            );
          }),
    });

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      title: "",
      description: "",
      templateId: "",
    } as NewAllocationForm,
  });

  const onSubmit = async (data: NewAllocationForm) => {
    api
      .post("/allocation/builder/form/create", data)
      .then(() => {
        toast.success("Form created successfully!");
        queryClient.invalidateQueries(["form-builder", "forms"]);
        reset();
      })
      .catch((error) => {
        toast.error("Failed to create form.");
        console.error("Error creating form:", error);
      });
  };

  const columns: ColumnDef<AllocationForm>[] = [
    {
      accessorKey: "title",
      header: "Title",
    },
    {
      accessorKey: "description",
      header: "Description",
    },
    {
      accessorKey: "createdBy.name",
      header: "Created By: ",
    },
    {
      accessorKey: "template.name",
      header: "Template Used ",
      cell: ({ row }) => (
        <Link
          className="text-primary hover:underline"
          to={`/allocation/templates/${row.original.template.id}`}
        >
          {row.original.template.name}
        </Link>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      accessorFn: () => "",
      cell: ({ row }) => {
        return (
          <div className="flex flex-row gap-2">
            <Button asChild>
              <Link to={`/allocation/forms/${row.original.id}/preview`}>
                {" "}
                View{" "}
              </Link>
            </Button>
            <Button asChild>
              <Link to={`/allocation/forms/${row.original.id}/responses`}>
                View Responses
              </Link>
            </Button>
            {checkAccessAnyOne([
              "allocation:write",
              "allocation:builder:form:write",
            ]) && (
              <Button
                variant="destructive"
                disabled={isDeleteFormMutationLoading}
                onClick={() => deleteFormMutation(row.original.id)}
              >
                Delete {isDeleteFormMutationLoading && <LoadingSpinner />}
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-4">
      <h1 className="mb-4 text-2xl font-bold"> Forms </h1>
      {isTemplateQueryLoading || isFormQueryLoading || !templates || !forms ? (
        <Skeleton className="h-10 w-full" />
      ) : (
        <DataTable
          columns={columns}
          data={forms}
          idColumn="id"
          additionalButtons={
            checkAccessAnyOne([
              "allocation:write",
              "allocation:builder:form:write",
            ]) ? (
              <Dialog>
                <DialogTrigger asChild>
                  <Button>Create New Form</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Form</DialogTitle>
                  </DialogHeader>
                  <form>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title">Form Title</Label>
                        <Controller
                          name="title"
                          control={control}
                          rules={{
                            required: true,
                          }}
                          render={({ field }) => (
                            <Input
                              {...field}
                              id="title"
                              placeholder="Enter form name"
                            />
                          )}
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Controller
                          name="description"
                          control={control}
                          rules={{
                            required: true,
                          }}
                          render={({ field }) => (
                            <Input
                              {...field}
                              id="description"
                              placeholder="Enter description"
                            />
                          )}
                        />
                      </div>
                      <div>
                        <Label htmlFor="templateId">Template</Label>
                        <Controller
                          name="templateId"
                          rules={{
                            required: true,
                          }}
                          control={control}
                          render={({ field }) => (
                            <Select {...field} onValueChange={field.onChange}>
                              <SelectTrigger id="templateId">
                                <SelectValue placeholder="Select a template" />
                              </SelectTrigger>
                              <SelectContent>
                                {templates.map((template) => (
                                  <SelectItem
                                    key={template.id}
                                    value={template.id}
                                  >
                                    {template.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={handleSubmit(onSubmit)}
                        >
                          Create
                        </Button>
                      </div>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            ) : (
              <></>
            )
          }
        />
      )}
    </div>
  );
};

export default FormList;
