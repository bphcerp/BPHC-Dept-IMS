import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { useState } from "react";
import { LoadingSpinner } from "@/components/ui/spinner";
import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";

import { Check, X, Filter, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

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
  status: boolean;
  citations: string;
  citationId: string;
  coAuthors: CoAuthor[];
};

type PublicationResponse = {
  publications: Publication[];
};

type SortOrder = "desc" | "asc";
type StatusFilter = "all" | "approved" | "rejected";

const PublicationsView = () => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const {
    data: authorId,
    isLoading: isLoadingAuthorId,
    isError: isAuthorIdError,
  } = useQuery({
    queryKey: ["authorId"],
    queryFn: async () => {
      const response = await api.get<{ authorId: string }>("/publications/id");
      return response.data.authorId;
    },
    onError: (e) => {
      setErrorMessage(
        isAxiosError(e)
          ? (e.response?.data as string)
          : "An error occurred while fetching author ID."
      );
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  const { isLoading: isLoadingPubs, isError: isPubsError } = useQuery({
    queryKey: ["publications", authorId],
    queryFn: async () => {
      if (!authorId) throw new Error("No authorId");
      const response = await api.get<PublicationResponse>(
        "/publications/user",
        {
          params: { authorId },
        }
      );
      setPublications(response.data.publications);
      return response.data;
    },
    enabled: !!authorId,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const editStatusMutation = useMutation({
    mutationFn: async (data: {
      citationId: string;
      authorId: string;
      status: boolean;
    }) => {
      await api.post("/publications/updateStatus", data);
    },
    onSuccess: () => {
      toast.success("Edited successfully");
    },
    onError: () => {
      toast.error("Error while updating status");
    },
  });

  function handleApproveClick(
    citationId: string,
    authorId: string,
    status: boolean
  ) {
    const updatedPublications = publications.map((pub) => {
      if (pub.citationId === citationId) {
        return { ...pub, status: status };
      }
      return pub;
    });
    setPublications(updatedPublications);
    editStatusMutation.mutate({ citationId, authorId, status });
  }

  const filteredPublications = publications
    .filter((pub) => {
      if (statusFilter === "all") return true;
      if (statusFilter === "approved") return pub.status === true;
      if (statusFilter === "rejected") return pub.status === false;
      return true;
    })
    .sort((a, b) => {
      const yearA = Number(a.year);
      const yearB = Number(b.year);
      return sortOrder === "desc" ? yearB - yearA : yearA - yearB;
    });

  const getActiveFilterCount = () => {
    let count = 0;
    if (sortOrder !== "desc") count++;
    if (statusFilter !== "all") count++;
    return count;
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-start gap-6 p-8">
      {isAuthorIdError || isPubsError ? (
        <p className="text-destructive">
          {errorMessage ?? "An error occurred while fetching publications"}
        </p>
      ) : isLoadingAuthorId || isLoadingPubs ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="flex w-full items-center justify-between">
            <h1 className="text-3xl font-bold text-primary">My Publications</h1>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filter
                  {getActiveFilterCount() > 0 && (
                    <Badge className="ml-1 flex h-5 w-5 items-center justify-center p-0">
                      {getActiveFilterCount()}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Filter Publications</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                    Sort by Year
                  </DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={sortOrder}
                    onValueChange={(value) => setSortOrder(value as SortOrder)}
                  >
                    <DropdownMenuRadioItem value="desc">
                      <ArrowUpDown className="mr-2 h-4 w-4 rotate-180" />
                      Newest first
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="asc">
                      <ArrowUpDown className="mr-2 h-4 w-4" />
                      Oldest first
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                    Filter by Status
                  </DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={statusFilter}
                    onValueChange={(value) =>
                      setStatusFilter(value as StatusFilter)
                    }
                  >
                    <DropdownMenuRadioItem value="all">
                      All publications
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="approved">
                      <Check className="mr-2 h-4 w-4 text-green-600" />
                      Approved only
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="rejected">
                      <X className="mr-2 h-4 w-4 text-red-600" />
                      Rejected only
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuGroup>

                {getActiveFilterCount() > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        setSortOrder("desc");
                        setStatusFilter("all");
                      }}
                    >
                      Reset filters
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="w-full space-y-6">
            {filteredPublications?.length ? (
              filteredPublications.map((pub, index) => {
                const authors = pub.coAuthors
                  ?.map((a) => a.authorName)
                  .join(", ");
                return (
                  <div key={pub.citationId} className="mb-6 border-b pb-4">
                    <p className="mb-2 text-justify text-base">
                      [{index + 1}] {authors && `${authors}, `}&quot;{pub.title}
                      ,&quot; <em>{pub.journal}</em>, vol. {pub.volume ?? "N/A"}
                      , no. {pub.issue ?? "N/A"}, {pub.year}.
                    </p>
                    <div className="mt-2 flex gap-2">
                      {pub.status === null ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleApproveClick(pub.citationId, authorId, true)
                            }
                          >
                            <Check className="mr-1 h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleApproveClick(
                                pub.citationId,
                                authorId,
                                false
                              )
                            }
                          >
                            <X className="mr-1 h-4 w-4" />
                            Reject
                          </Button>
                        </>
                      ) : pub.status === true ? (
                        <div className="flex items-center text-green-600">
                          <Check className="mr-1 h-4 w-4" />
                          <span>Approved</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-red-600">
                          <X className="mr-1 h-4 w-4" />
                          <span>Rejected</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <p>No publications found matching the current filters.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PublicationsView;
