import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { useState, useMemo } from "react";
import { LoadingSpinner } from "@/components/ui/spinner";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Toggle } from "@/components/ui/toggle"
import { Table, List } from "lucide-react";
import { DEPARTMENT_NAME } from "@/lib/constants";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/datatable/DataTable";
import { permissions } from "lib";
import { useAuth } from "@/hooks/Auth";
import { publicationsSchemas } from "lib";
import { Collapsible } from "@/components/ui/collapsible";

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
    queryKey: ["publications", "all"],
    queryFn: async () => {
      
      return {
        all: (await api.get<publicationsSchemas.PublicationResponse>("/publications/all/")).data,
        ...(await api.get<publicationsSchemas.ValidatedResponse>("/publications/all/validated")).data
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const updatePublicationsMutation = useMutation({
    mutationFn: async () => {
      await api.post("/publications/updatePublications");
    },
    onSuccess: () => {
      setErrorMessage(null);
      toast.success("Publications updated successfully");
      void queryClient.invalidateQueries({ queryKey: ["publications/all"] });
      void queryClient.invalidateQueries({ queryKey: ["publications/edit"] });
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
      publicationsData?.all.reduce(
        (acc, pub) => {
          const type = pub.type ?? "Other";
          if (!acc[type]) {
            acc[type] = [];
          }
          acc[type].push(pub);
          return acc;
        },
        {} as Record<string, publicationsSchemas.Publication[]>
      ) || {};

    Object.keys(groups).forEach((type) => {
      groups[type].sort((a, b) => Number(b.year) - Number(a.year));
    });

    return groups;
  }, [publicationsData]);

  const sortedTypes = useMemo(() => Object.keys(groupedPublications).sort(), [groupedPublications]);

  const resColumns: ColumnDef<publicationsSchemas.ReseargencePublication>[] = [
    {
      accessorFn: () => "S.No",
      header: "S.No",
      cell: ({ row }) => row.index + 1,
    },
    {
      accessorKey: 'publicationTitle',
      header: 'Title',
      cell: (info) => <div>{info.getValue() as string}</div>,
      minSize: 1000,
      meta : {
        filterType: "search"
      }
    },
    {
      accessorKey: 'pubId',
      header: 'Publication ID',
    },
    {
      accessorKey: 'authors',
      header: 'Authors'
    },
    {
      accessorKey: 'homeAuthors',
      header: 'Home Authors',
      meta : {
        filterType: "search"
      }
    },
    {
      accessorKey: 'homeAuthorDepartment',
      header: 'Home Author Dept.',
      meta : {
        filterType: "search"
      }
    },
    {
      accessorKey: 'homeAuthorInstitute',
      header: 'Home Author Institute',
      meta : {
        filterType: "search"
      }
    },
    {
      accessorKey: 'scs',
      header: 'SCS',
    },
    {
      accessorKey: 'wos',
      header: 'WOS',
    },
    {
      accessorKey: 'sci',
      header: 'SCI',
      meta : {
        filterType: "multiselect"
      }
    },
    {
      accessorKey: 'sourcePublication',
      header: 'Source Publication',
      meta : {
        filterType: "search"
      }
    },
    {
      accessorKey: 'level',
      header: 'Level',
      meta : {
        filterType: "dropdown"
      }
    },
    {
      accessorKey: 'type',
      header: 'Article Type',
      meta : {
        filterType: "multiselect"
      }
    },
    {
      accessorKey: 'year',
      header: 'Year',
      meta : {
        filterType: "number-range"
      }
    },
    {
      accessorKey: 'month',
      header: 'Month',
      meta : {
        filterType: "multiselect"
      }
    },
    {
      accessorKey: 'homeAuthorLocation',
      header: 'Home Author Location',
      meta : {
        filterType: "multiselect"
      }
    },
    {
      accessorKey: 'volNo',
      header: 'Vol. No.',
    },
    {
      accessorKey: 'issNo',
      header: 'Iss. No.',
    },
    {
      accessorKey: 'bPage',
      header: 'B Page',
    },
    {
      accessorKey: 'ePage',
      header: 'E Page',
    },
    {
      accessorKey: 'snip',
      header: 'SNIP',
      meta : {
        filterType: "number-range"
      }
    },
    {
      accessorKey: 'sjr',
      header: 'SJR',
      meta : {
        filterType: "number-range"
      }
    },
    {
      accessorKey: 'if',
      header: 'IF',
      meta : {
        filterType: "number-range"
      }
    },
    {
      accessorKey: 'citeScore',
      header: 'Cite Score',
      meta : {
        filterType: "number-range"
      }
    },
    {
      accessorKey: 'qRankscs',
      header: 'Q Rank(SCS)',
    },
    {
      accessorKey: 'qRankwos',
      header: 'Q Rank(WOS)',
    },
    {
      accessorKey: 'pIssn',
      header: 'P ISSN',
    },
    {
      accessorKey: 'eIssn',
      header: 'E ISSN',
    },
    {
      accessorKey: 'pIsbn',
      header: 'P ISBN',
    },
    {
      accessorKey: 'eIsbn',
      header: 'E ISBN',
    },
    {
      accessorKey: 'link',
      header: 'Link',
    }
  ];

   const pubColumns: ColumnDef<publicationsSchemas.Publication>[] = [
    {
      accessorFn: () => "S.No",
      header: "S.No",
      cell: ({ row }) => row.index + 1,
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: (info) => <div>{info.getValue() as string}</div>,
      meta : {
        filterType: "search"
      }
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
      accessorKey: "month",
      header: "Month",
      meta : {
        filterType: "multiselect"
      }
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
            onPressedChange={() => setView((view == PubView.Publication) ? PubView.Table : PubView.Publication)}>
            {(view == PubView.Table) ? <Table /> : <List />}
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

        view == PubView.Publication ?
          (
            <div className="w-full space-y-8">
              {publicationsData?.all?.length ? (
                sortedTypes.map((type) => {
                  const publications = groupedPublications[type];
                  let publicationIndex = 0;

                  // Calculate starting index for this type
                  for (const prevType of sortedTypes) {
                    if (prevType === type) break;
                    publicationIndex += groupedPublications[prevType].length;
                  }

                  return (
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
                              <a href={pub.link??undefined} target="_blank">
                                {pub.authorNames.replace(/,?\s*\.\.\.$/, "").trim()}
                                {", "} &quot;{pub.title}
                                ,&quot; <em>{pub.journal}</em>
                                {pub.volume && `, vol. ${pub.volume}`}
                                {pub.issue && `, no. ${pub.issue}`}, {pub.month ? `${pub.month} ,` : ''}{pub.year}.
                              </a>
                            </p>
                          );
                        })}
                      </div>
                    </div>
                    )
                  );
                })
              ) : (
                <p className="text-muted-foreground">No publications found.</p>
              )}
            </div>
          ) :
          (
            <div className="space-y-4 w-full overflow-x-auto">
              <Collapsible title={
                <h2 className="border-border pb-2 text-2xl font-semibold text-primary">
                    Validated
                </h2>
              }>
              <DataTable<publicationsSchemas.ReseargencePublication>
                data={publicationsData.validated}
                columns={resColumns}
                mainSearchColumn="authors"
              />
              </Collapsible>
              <Collapsible title={
                <h2 className="border-border pb-2 text-2xl font-semibold text-primary">
                    Not Validated
                </h2>
              }>
              <DataTable<publicationsSchemas.Publication>
                data={publicationsData.nonValidated}
                idColumn="citationId"
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
                    } : undefined
                }
                columns={pubColumns}
                mainSearchColumn="authorNames"
              />
              </Collapsible>
            </div>
          )
      )}
    </div>
  );
};

export default AllPublications;
