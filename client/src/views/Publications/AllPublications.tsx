import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { useState,useMemo} from "react";
import { LoadingSpinner } from "@/components/ui/spinner";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";


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

const AllPublications = () => {
  const queryClient = useQueryClient();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
            sortedTypes.map((type) => {
              const publications = groupedPublications[type];
              let publicationIndex = 0;

              // Calculate starting index for this type
              for (const prevType of sortedTypes) {
                if (prevType === type) break;
                publicationIndex += groupedPublications[prevType].length;
              }

              return (
                <div key={type} className="space-y-4">
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
