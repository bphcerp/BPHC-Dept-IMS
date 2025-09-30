import { DataTable } from "@/components/shared/datatable/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { AllocationFormTemplate } from "../../../../lib/src/types/allocationFormBuilder";
import api from "@/lib/axios-instance";
import { toast } from "sonner";
import { useAuth } from "@/hooks/Auth";
import { Skeleton } from "@/components/ui/skeleton";

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
        <Button asChild>
          <Link to={`/allocation/templates/${formTemplate.id}`}> View </Link>
        </Button>
      );
    },
  },
];

const FormTemplateList = () => {
  const [templates, setTemplates] = useState<AllocationFormTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const { checkAccessAnyOne } = useAuth();

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await api.get("/allocation/builder/template/getAll");
        setTemplates(response.data ?? []);
      } catch (error) {
        toast.error("Error in fetching templates!");
        console.error("Error in getting templates: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  return (
    <div className="p-4">
      <h1 className="mb-4 text-2xl font-bold"> Form Templates </h1>
      {loading ? (
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
