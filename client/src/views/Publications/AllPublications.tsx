import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { useState } from "react";
import { LoadingSpinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";

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

  const handleUpdatePublications = async () => {
    await api.post("/publications/updatePublications");
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-start gap-6 p-8">
      <div className="flex w-full items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">All Publications</h1>
        <Button onClick={handleUpdatePublications} className="ml-auto">
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
                const authors = pub.coAuthors
                  ?.map((a) => a.authorName)
                  .join(", ");
                return (
                  <p
                    key={pub.citationId}
                    className="mb-4 text-justify text-base"
                  >
                    [{index + 1}] {authors && `${authors}, `}"{pub.title},"{" "}
                    <em>{pub.journal}</em>, vol. {pub.volume ?? "N/A"}, no.{" "}
                    {pub.issue ?? "N/A"}, {pub.year}.
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
