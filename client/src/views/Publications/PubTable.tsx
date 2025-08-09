import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { useState } from "react";
import { LoadingSpinner } from "@/components/ui/spinner";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/hooks/Auth";
import { DEPARTMENT_NAME } from "@/lib/constants";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/publications/DataTable";
import { permissions } from "lib";

type CoAuthor = {
  authorId: string;
  authorName: string;
};

type Publication = {
  title: string;
  type: string;
  journal: string;
  volume: string | null;
  issue: string | null;
  year: string;
  link: string;
  citations: string;
  citationId: string;
  authorNames: string;
  coAuthors: CoAuthor[];
};

type PublicationResponse = {
  publications: Publication[];
};

const PubTable = () => {
  const queryClient = useQueryClient();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Publication[]>([]);

  const { checkAccess } = useAuth();
  const {
    isLoading: isLoadingPubs,
    isError: isPubsError,
    data: publicationsData,
  } = useQuery({
    queryKey: ["publications/all"],
    queryFn: async () => {
      const response = await api.get<PublicationResponse>("/publications/all");
      return response.data;
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  const updatePublicationsMutation = useMutation({
    mutationFn: async () => {
      await api.post("/publications/updatePublications");
    },
    onSuccess: () => {
      setErrorMessage(null);
      toast.success("Publications updated successfully");
      void queryClient.invalidateQueries({ queryKey: ["publications/all"] });
    },
    onError: () => {
      setErrorMessage("Failed to update publications");
    },
  });

  function handleUpdatePublications() {
    updatePublicationsMutation.mutate();
  }

const columns: ColumnDef<Publication>[] = [
  {
    accessorFn: () => "S.No",
    header: "S.No",
    cell: ({ row }) => row.index + 1,
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: (info) => <div>{info.getValue() as string}</div>,
  },
  {
    accessorKey: "type",
    header: "Pub-Type",
  },
  {
    accessorKey: "journal",
    header: "Journal",
  },
  {
    accessorKey: "volume",
    header: "Volume",
  },
  {
    accessorKey: "issue",
    header: "Issue",
  },
  {
    accessorKey: "year",
    header: "Year",
  },
  {
    accessorKey: "link",
    header: "Link",
    cell: (info) => (
      <a href={info.getValue() as string} className="font-bold text-blue-500">
        Link
      </a>
    ),
  },
  {
    accessorKey: "citations",
    header: "Citations",
  },
  {
    accessorKey: "citationId",
    header: "Citation ID",
  },
  {
    accessorKey: "authorNames",
    header: "Author Names",
  }
];

  return (
    <div className="relative flex min-h-screen w-full flex-col items-start gap-6 p-8">
      <div className="flex w-full items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">All Publications</h1>
        <Button
          onClick={handleUpdatePublications}
          className="ml-auto flex items-center gap-2"
          disabled={updatePublicationsMutation.isLoading}
        >
          {updatePublicationsMutation.isLoading && (
            <LoadingSpinner
              className="h-4 w-4"
              role="status"
              aria-label="Loading"
            />
          )}
          Update Publications
        </Button>
      </div>

      {isPubsError ? (
        <p className="text-destructive">
          {errorMessage ?? "An error occurred while fetching publications"}
        </p>
      ) : isLoadingPubs ? (
        <LoadingSpinner />
      ) : (
        <div className="w-full space-y-8">
          {publicationsData?.publications?.length ? (
            <DataTable<Publication>
          data={publicationsData.publications}
          exportFunction={
            checkAccess(permissions["/publications/export"])
              ? (citIDs, columnsVisible) => {
                  if (!citIDs || !citIDs.length)
                    return toast.warning("No data to export");

                  api
                    .post(
                      "/publications/export",
                      { citIDs, columnsVisible },
                      { responseType: "blob" }
                    )
                    .then((response) => {
                      const blob = new Blob([response.data], {
                        type: response.headers["content-type"],
                      });
                      const link = document.createElement("a");
                      link.href = URL.createObjectURL(blob);
                      link.download = `${DEPARTMENT_NAME} Department - Export Inventory.xlsx`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(link.href);
                      toast.success("File downloaded successfully!");
                    })
                    .catch((error) => {
                      console.error("Error:", error);
                      toast.error("Failed to download file");
                    });
                }
              : undefined
          }
          columns={columns}
          mainSearchColumn="title"
          setSelected={setSelectedItems}
        />
          ) : (
            <p className="text-muted-foreground">No publications found.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default PubTable;
