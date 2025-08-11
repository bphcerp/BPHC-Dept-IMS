import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { useState,useMemo} from "react";
import { LoadingSpinner } from "@/components/ui/spinner";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {Toggle} from "@/components/ui/toggle"
import { Table, List } from "lucide-react";
import { DEPARTMENT_NAME } from "@/lib/constants";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/publications/DataTable";
import { permissions } from "lib";
import { useAuth } from "@/hooks/Auth";

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

enum PubView {
  Table = 0,
  Publication = 1
}

const AllPublications = () => {
  const queryClient = useQueryClient();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [view, setView] = useState<PubView>(PubView.Publication);
  const { checkAccess } = useAuth();

  const {
    data: publicationsData,
    isLoading: isLoadingPubs,
    isError: isPubsError,
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

  // Group publications by type
  // Group publications by type and sort them
  const groupedPublications = useMemo(() => {
    const groups =
      publicationsData?.publications?.reduce(
        (acc, pub) => {
          const type = pub.type || "Other";
          if (!acc[type]) {
            acc[type] = [];
          }
          acc[type].push(pub);
          return acc;
        },
        {} as Record<string, Publication[]>
      ) || {};

    Object.keys(groups).forEach((type) => {
      groups[type].sort((a, b) => Number(b.year) - Number(a.year));
    });

    return groups;
  }, [publicationsData]);

  const sortedTypes = useMemo(() => Object.keys(groupedPublications).sort(), [groupedPublications]);

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
      header: "Pub-Type"
    },
    {
      accessorKey: "journal",
      header: "Journal",
      meta : {
        filterType: "search"
      }
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
      meta : {
        filterType: "number-range"
      }
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
      meta : {
        filterType: "search"
      }
    }
  ];

  return (
    <div className="relative flex min-h-screen w-full flex-col items-start gap-6 p-8">
      <div className="flex w-full items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">All Publications</h1>
        <div className="flex items-center space-x-2">
        <Toggle 
        className="border-2 border-black data-[state=on]:bg-white"
        variant={"outline"} 
        onPressedChange={()=>setView((view == PubView.Publication) ? PubView.Table : PubView.Publication)}>
          {(view==PubView.Table) ? <Table/> : <List/>} 
        </Toggle>

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
            sortedTypes.map((type) => {
              const publications = groupedPublications[type];
              let publicationIndex = 0;

              // Calculate starting index for this type
              for (const prevType of sortedTypes) {
                if (prevType === type) break;
                publicationIndex += groupedPublications[prevType].length;
              }

              return (
                view==PubView.Publication ? 
                (<div key={type} className="space-y-4">
                  <h2 className="border-b border-border pb-2 text-2xl font-semibold text-primary">
                    {type}
                  </h2>
                  <div className="space-y-4">
                    {publications.map((pub, index) => {
                      const globalIndex = publicationIndex + index + 1;
                      return (
                        <p
                          className="mb-2 text-justify text-base leading-relaxed"
                          key={pub.citationId}
                        >
                          <span className="font-medium">[{globalIndex}]</span>{" "}
                          {pub.authorNames.replace(/,?\s*\.\.\.$/, "").trim()}
                          {", "} &quot;{pub.title}
                          ,&quot; <em>{pub.journal}</em>
                          {pub.volume && `, vol. ${pub.volume}`}
                          {pub.issue && `, no. ${pub.issue}`}, {pub.year}.
                        </p>
                      );
                    })}
                  </div>
                </div>
                ) :
                (
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
                                  link.download = `${DEPARTMENT_NAME} Department - Export Publications.xlsx`;
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
                  />
                )
              );
            })
          ) : (
            <p className="text-muted-foreground">No publications found.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AllPublications;
