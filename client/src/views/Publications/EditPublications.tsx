import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { useState } from "react";
import { LoadingSpinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Edit2, Save, X } from "lucide-react";

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
  comments?: string | null;
};

import { z } from "zod";

const PublicationSchema = z.object({
  citationId: z.string(),
  title: z.string(),
  type: z.string().nullable(),
  status: z.boolean().nullable(),
  journal: z.string().nullable(),
  volume: z.string().nullable(),
  issue: z.string().nullable(),
  year: z.string().nullable(),
  link: z.string().nullable(),
  citations: z.string().nullable(),
  authorNames: z.string().nullable(),
  comments: z.string().nullable(),
});

type PublicationResponse = {
  publications: Publication[];
};

type EditingPublication = Publication & {
  isEditing?: boolean;
};

const AllPublications = () => {
  const [editingPublications, setEditingPublications] = useState<
    Record<string, EditingPublication>
  >({});
  const queryClient = useQueryClient();

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

  const updatePublicationMutation = useMutation({
    mutationFn: async (publication: Publication) => {
      const filteredPublication = PublicationSchema.parse(publication);

      const response = await api.patch("/publications/edit", {
        publication: filteredPublication,
      });

      return response.data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["publications/all"] });
      toast.success("Publication updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update publication");
      console.error("Update error:", error);
    },
  });

  const handleEdit = (publication: Publication) => {
    setEditingPublications({
      ...editingPublications,
      [publication.citationId]: { ...publication, isEditing: true },
    });
  };

  const handleCancelEdit = (citationId: string) => {
    const newEditingPublications = { ...editingPublications };
    delete newEditingPublications[citationId];
    setEditingPublications(newEditingPublications);
  };

  const handleSave = (citationId: string) => {
    const publicationToUpdate = editingPublications[citationId];
    if (publicationToUpdate) {
      updatePublicationMutation.mutate(publicationToUpdate);
      handleCancelEdit(citationId);
    }
  };

  const handleChange = (
    citationId: string,
    field: keyof Publication,
    value: string
  ) => {
    setEditingPublications({
      ...editingPublications,
      [citationId]: {
        ...editingPublications[citationId],
        [field]: value,
      },
    });
  };

  const sortedPublications = publicationsData?.publications
    ? [...publicationsData.publications].sort(
        (a, b) => Number(b.year) - Number(a.year)
      )
    : [];

  return (
    <div className="relative flex min-h-screen w-full flex-col items-start gap-6 p-8">
      <h1 className="text-3xl font-bold text-primary">All Publications</h1>

      {isPubsError ? (
        <p className="text-destructive">
          An error occurred while fetching publications.
        </p>
      ) : isLoadingPubs ? (
        <LoadingSpinner />
      ) : (
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Authors</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Journal</TableHead>
                <TableHead>Volume</TableHead>
                <TableHead>Issue</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Comments</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPublications.length > 0 ? (
                sortedPublications.map((publication) => {
                  const isEditing =
                    !!editingPublications[publication.citationId];
                  const editingPublication = isEditing
                    ? editingPublications[publication.citationId]
                    : publication;

                  return (
                    <TableRow key={publication.citationId}>
                      <TableCell className="font-medium">
                        {isEditing ? (
                          <Input
                            value={editingPublication.authorNames}
                            onChange={(e) =>
                              handleChange(
                                publication.citationId,
                                "authorNames",
                                e.target.value
                              )
                            }
                            className="w-full"
                          />
                        ) : (
                          publication.authorNames
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editingPublication.title}
                            onChange={(e) =>
                              handleChange(
                                publication.citationId,
                                "title",
                                e.target.value
                              )
                            }
                            className="w-full"
                          />
                        ) : (
                          publication.title
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editingPublication.journal}
                            onChange={(e) =>
                              handleChange(
                                publication.citationId,
                                "journal",
                                e.target.value
                              )
                            }
                            className="w-full"
                          />
                        ) : (
                          <em>{publication.journal}</em>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editingPublication.volume || ""}
                            onChange={(e) =>
                              handleChange(
                                publication.citationId,
                                "volume",
                                e.target.value
                              )
                            }
                            className="w-full"
                          />
                        ) : (
                          publication.volume || "N/A"
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editingPublication.issue || ""}
                            onChange={(e) =>
                              handleChange(
                                publication.citationId,
                                "issue",
                                e.target.value
                              )
                            }
                            className="w-full"
                          />
                        ) : (
                          publication.issue || "N/A"
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editingPublication.year}
                            onChange={(e) =>
                              handleChange(
                                publication.citationId,
                                "year",
                                e.target.value
                              )
                            }
                            className="w-full"
                          />
                        ) : (
                          publication.year
                        )}
                      </TableCell>
                      <TableCell>
                        {publication.comments ? publication.comments : "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        {isEditing ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleSave(publication.citationId)}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                handleCancelEdit(publication.citationId)
                              }
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(publication)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    No publications found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AllPublications;
