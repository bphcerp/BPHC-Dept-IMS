import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { useState } from "react";
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
    },
    onError: () => {
      setErrorMessage("Failed to update publications");
    },
  });

  function handleUpdatePublications() {
    updatePublicationsMutation.mutate();
  }

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
            <LoadingSpinner className="h-4 w-4" />
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
        <div className="w-full space-y-6">
          {publicationsData?.publications?.length ? (
            publicationsData.publications
              .sort((a, b) => Number(b.year) - Number(a.year))
              .map((pub, index) => {
                return (
                  <p
                    key={pub.citationId}
                    className="mb-4 text-justify text-base"
                  >
                    [{index + 1}] {pub.authorNames} {", "}&quot;{pub.title}
                    ,&quot; <em>{pub.journal}</em>, vol. {pub.volume ?? "N/A"},
                    no. {pub.issue ?? "N/A"}, {pub.year}.
                  </p>
                );
              })
          ) : (
            <p>No publications found.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AllPublications;
