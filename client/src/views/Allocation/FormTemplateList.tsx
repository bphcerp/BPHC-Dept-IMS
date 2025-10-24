import { DataTable } from "@/components/shared/datatable/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AllocationFormTemplate } from "../../../../lib/src/types/allocationFormBuilder";
import api from "@/lib/axios-instance";
import { toast } from "sonner";
import { useAuth } from "@/hooks/Auth";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoadingSpinner } from "@/components/ui/spinner";
import { AxiosError } from "axios";

const FormTemplateList = () => {
  const { checkAccessAnyOne } = useAuth();
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
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

  const {
    mutate: deleteTemplateMutation,
    isLoading: isDeleteTemplateMutationLoading,
  } = useMutation({
    mutationKey: ["allocation-template", "delete"],
    mutationFn: (templateId: string) =>
      api
        .delete(`/allocation/builder/template/delete/${templateId}`)
        .then(() => {
          queryClient.invalidateQueries(["form-builder"]);
        })
        .catch((e) => {
          toast.error(
            ((e as AxiosError).response?.data as string) ??
              "Something went wrong"
          );
          console.error(
            `Something went wrong while deleting template ${templateId}`,
            e
          );
        }),
  });

  const columns: ColumnDef<AllocationFormTemplate>[] = [
    {
      accessorKey: "name",
      header: "Name",
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
      id: "actions",
      header: "Actions",
      accessorFn: () => "",
      cell: ({ row }) => {
        const formTemplate = row.original;
        return (
          <div className="flex space-x-2">
            <Button asChild>
              <Link to={`/allocation/templates/${formTemplate.id}`}>
                {" "}
                View{" "}
              </Link>
            </Button>
            {checkAccessAnyOne([
              "allocation:write",
              "allocation:builder:template:write",
            ]) && (
              <Button
                variant="destructive"
                disabled={isDeleteTemplateMutationLoading}
                onClick={() => deleteTemplateMutation(formTemplate.id)}
              >
                Delete {isDeleteTemplateMutationLoading && <LoadingSpinner />}
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-4">
      <h1 className="mb-4 text-2xl font-bold"> Form Templates </h1>
      {isLoading || !templates ? (
        <Skeleton className="h-10 w-full" />
      ) : (
        <DataTable
          columns={columns}
          data={templates}
          idColumn="id"
          additionalButtons={
            checkAccessAnyOne([
              "allocation:write",
              "allocation:builder:template:write",
            ]) ? (
              <Button asChild>
                <Link to="/allocation/templates/new">
                  {" "}
                  Create New Template{" "}
                </Link>
              </Button>
            ) : (
              <></>
            )
          }
        />
      )}
    </div>
  );
};

export default FormTemplateList;
