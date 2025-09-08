"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { useState } from "react";
import { LoadingSpinner } from "@/components/ui/spinner";
import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { publicationsSchemas } from "lib";
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
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";

type SortOrder = "desc" | "asc";
type StatusFilter = "all" | "approved" | "rejected";

const PublicationsView = () => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [approveComment, setApproveComment] = useState<string>("");
  const [rejectComment, setRejectComment] = useState<string>("");
  const [publications, setPublications] = useState<publicationsSchemas.PublicationWithMeta[]>([]);
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [yearRangeFilter, setYearRangeFilter] = useState<{
    min: number | null;
    max: number | null;
  }>({
    min: null,
    max: null,
  });

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
      const response = await api.get<publicationsSchemas.PublicationWithMetaResponse>(
        "/publications/user",
        {
          params: { authorId },
        }
      );
      setPublications(response.data);
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
      comments: string | null;
    }) => {
      await api.post("/publications/updateStatus", data);
    },
    onSuccess: () => {
      toast.success("Status updated successfully");
      setApproveComment("");
      setRejectComment("");
    },
    onError: (error) => {
      console.error("Error updating status:", error);
      toast.error("Error while updating status");
    },
  });

  function handleApproveClick(
    citationId: string,
    authorId: string,
    status: boolean,
    comments?: string
  ) {
    const updatedPublications = publications.map((pub) => {
      if (pub.citationId === citationId) {
        return { ...pub, status: status };
      }
      return pub;
    });
    setPublications(updatedPublications);

    const requestData = {
      citationId,
      authorId,
      status,
      ...(comments && comments.trim() !== ""
        ? { comments: comments.trim() }
        : { comments: null }),
    };

    editStatusMutation.mutate(requestData);
  }

  const filteredPublications = publications
    .filter((pub) => {
      // Status filter
      if (statusFilter === "all") return true;
      if (statusFilter === "approved") return pub.status === true;
      if (statusFilter === "rejected") return pub.status === false;
      return true;
    })
    .filter((pub) => {
      // Year range filter
      const pubYear = Number(pub.year);
      if (yearRangeFilter.min !== null && pubYear < yearRangeFilter.min)
        return false;
      if (yearRangeFilter.max !== null && pubYear > yearRangeFilter.max)
        return false;
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
    if (yearRangeFilter.min !== null) count++;
    if (yearRangeFilter.max !== null) count++;
    return count;
  };

  const exportToExcel = () => {
    const data = filteredPublications.map((pub) => ({
      Title: pub.title,
      Type: pub.type,
      Journal: pub.journal,
      Volume: pub.volume ?? "",
      Issue: pub.issue ?? "",
      Month: pub.month ?? "-",
      Year: pub.year,
      Link: pub.link,
      Status: pub.status ? "Approved" : "Rejected",
      Citations: pub.citations,
      CitationID: pub.citationId,
      CoAuthors: pub.coAuthors
        .map((ca) => `${ca.authorName} (ID: ${ca.authorId})`)
        .join(", "),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Publications");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, "publications.xlsx");
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
            <h1 className="whitespace-nowrap text-3xl font-bold text-primary">
              My Publications
            </h1>
            <div className="row flex w-full justify-end gap-4">
              <Button variant="outline" size="sm" onClick={exportToExcel}>
                Download as Excel
              </Button>
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
                      onValueChange={(value) =>
                        setSortOrder(value as SortOrder)
                      }
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

                  <DropdownMenuSeparator />

                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                      Filter by Year Range
                    </DropdownMenuLabel>
                    <div className="px-2 py-1.5">
                      <div className="mb-2 flex items-center gap-2">
                        <label htmlFor="min-year" className="text-xs">
                          From:
                        </label>
                        <input
                          id="min-year"
                          type="number"
                          placeholder="Min year"
                          className="w-full rounded-md border px-2 py-1 text-sm"
                          value={yearRangeFilter.min || ""}
                          onChange={(e) => {
                            const value = e.target.value
                              ? Number(e.target.value)
                              : null;
                            setYearRangeFilter((prev) => ({
                              ...prev,
                              min: value,
                            }));
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label htmlFor="max-year" className="text-xs">
                          To:
                        </label>
                        <input
                          id="max-year"
                          type="number"
                          placeholder="Max year"
                          className="w-full rounded-md border px-2 py-1 text-sm"
                          value={yearRangeFilter.max || ""}
                          onChange={(e) => {
                            const value = e.target.value
                              ? Number(e.target.value)
                              : null;
                            setYearRangeFilter((prev) => ({
                              ...prev,
                              max: value,
                            }));
                          }}
                        />
                      </div>
                    </div>
                  </DropdownMenuGroup>

                  {getActiveFilterCount() > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          setSortOrder("desc");
                          setStatusFilter("all");
                          setYearRangeFilter({ min: null, max: null });
                        }}
                      >
                        Reset filters
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="w-full space-y-6">
            {filteredPublications?.length ? (
              filteredPublications.map((pub, index) => {
                return (
                  <div key={pub.citationId} className="mb-6 border-b pb-4">
                    <p className="mb-2 text-justify text-base">
                      [{index + 1}]{" "}
                      {pub.authorNames
                        .replace(/,?\s*\.\.\.$/, "")
                        .trim()}
                      {", "} &quot;{pub.title}
                      ,&quot; <em>{pub.journal}</em>
                      {pub.volume && `, vol. ${pub.volume}`}
                      {pub.issue && `, no. ${pub.issue}`}, {pub.month ? `${pub.month} ,` : '' }{pub.year}.
                    </p>
                    <div className="row mt-2 flex gap-2">
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

                          {/* Approve with comments dialog */}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setApproveComment("");
                                }}
                              >
                                <Check className="mr-1 h-4 w-4" />
                                Approve with comments
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                              <DialogHeader>
                                <DialogTitle>Approve with Comments</DialogTitle>
                                <DialogDescription>
                                  Add comments for this approval. These will be
                                  visible to the admin.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4">
                                <Input
                                  type="text"
                                  placeholder="Add your approval comments..."
                                  value={approveComment}
                                  onChange={(e) =>
                                    setApproveComment(e.target.value)
                                  }
                                  className="w-full"
                                />
                              </div>
                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button variant="outline">Cancel</Button>
                                </DialogClose>
                                <DialogClose asChild>
                                  <Button
                                    type="submit"
                                    onClick={() => {
                                      if (approveComment.trim() === "") {
                                        toast.error(
                                          "Please add comments before approving."
                                        );
                                        return;
                                      }
                                      handleApproveClick(
                                        pub.citationId,
                                        authorId,
                                        true,
                                        approveComment
                                      );
                                    }}
                                  >
                                    Approve with Comments
                                  </Button>
                                </DialogClose>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          {/* Reject with comments dialog */}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setRejectComment("");
                                }}
                              >
                                <X className="mr-1 h-4 w-4" />
                                Reject with comments
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                              <DialogHeader>
                                <DialogTitle>Reject with Comments</DialogTitle>
                                <DialogDescription>
                                  Add comments explaining why this publication
                                  is being rejected. These will be visible to
                                  the admin.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4">
                                <Input
                                  type="text"
                                  placeholder="Add your rejection comments..."
                                  value={rejectComment}
                                  onChange={(e) =>
                                    setRejectComment(e.target.value)
                                  }
                                  className="w-full"
                                />
                              </div>
                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button variant="outline">Cancel</Button>
                                </DialogClose>
                                <DialogClose asChild>
                                  <Button
                                    type="submit"
                                    variant="destructive"
                                    onClick={() => {
                                      if (rejectComment.trim() === "") {
                                        toast.error(
                                          "Please add comments before rejecting."
                                        );
                                        return;
                                      }
                                      handleApproveClick(
                                        pub.citationId,
                                        authorId,
                                        false,
                                        rejectComment
                                      );
                                    }}
                                  >
                                    Reject with Comments
                                  </Button>
                                </DialogClose>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
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
