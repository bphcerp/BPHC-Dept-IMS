import { DataTable } from "@/components/shared/datatable/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
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
      <Link to={`/allocation/templates/${row.original.template.id}`}>
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
            <Link to={`/allocation/forms/${row.original.id}`}> View </Link>
          </Button>
          <Button asChild>
            <Link to={`/allocation/forms/${row.original.id}/responses`}>
              View Responses
            </Link>
          </Button>
          <Button asChild>
            <Link to={`/allocation/forms/${row.original.id}/submit`}>
              Submit Response
            </Link>
          </Button>
        </div>
      );
    },
  },
];

const FormList = () => {
  const [forms, setForms] = useState<AllocationForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<AllocationFormTemplate[]>([]);

  const { checkAccessAnyOne } = useAuth();

  const fetchTemplates = async () => {
    try {
      const response = await api.get("/allocation/builder/template/getAll");
      setTemplates(response.data ?? []);
    } catch (error) {
      toast.error("Error in fetching templates!");
      console.error("Error in getting templates: ", error);
    }
  };

  const fetchForms = async () => {
    try {
      const response = await api.get("/allocation/builder/form/getAll");
      setForms(response.data ?? []);
    } catch (error) {
      toast.error("Error in fetching forms!");
      console.error("Error in getting forms: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
    fetchTemplates();
  }, []);

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      title: "",
      description: "",
      templateId: "",
    } as NewAllocationForm,
  });

  const onSubmit = async (data: NewAllocationForm, publish: boolean) => {
    api
      .post("/allocation/builder/form/create", {
        ...data,
        isPublished: publish,
      })
      .then(() => {
        toast.success("Form created successfully!");
        fetchForms();
        reset();
      })
      .catch((error) => {
        toast.error("Failed to create form.");
        console.error("Error creating form:", error);
      });
  };

  if (loading) {
    return <div> Loading... </div>;
  }

  return (
    <div className="p-4">
      <h1 className="mb-4 text-2xl font-bold"> Forms </h1>
      {loading ? (
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
                          onClick={handleSubmit((data) =>
                            onSubmit(data, false)
                          )}
                        >
                          Create
                        </Button>
                        <Button
                          type="button"
                          onClick={handleSubmit((data) => onSubmit(data, true))}
                        >
                          Create & Publish
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
