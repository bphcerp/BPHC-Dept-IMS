import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { useState } from "react";
import { LoadingSpinner } from "@/components/ui/spinner";
import { isAxiosError } from "axios";

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

const PublicationsView = () => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const {
    data: publicationsData,
    isLoading: isLoadingPubs,
    isError: isPubsError,
  } = useQuery({
    queryKey: ["publications", authorId],
    queryFn: async () => {
      if (!authorId) throw new Error("No authorId");
      const response = await api.get<PublicationResponse>(
        "/publications/user",
        {
          params: { authorId },
        }
      );
      return response.data;
    },
    enabled: !!authorId,
    retry: false,
    refetchOnWindowFocus: false,
  });

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
          <h1 className="text-3xl font-bold text-primary">My Publications</h1>
          <div className="space-y-6">
            {publicationsData?.publications?.length
              ? publicationsData.publications.map((pub, index) => (
                  <div
                    key={pub.citationId}
                    className="space-y-1 rounded-xl border bg-white p-6 text-sm shadow-sm"
                  >
                    <h2 className="text-2xl font-semibold">
                      {index + 1}. {pub.title}
                    </h2>
                    <p>
                      <strong>Type:</strong> {pub.type}
                    </p>
                    <p>
                      <strong>Journal:</strong> {pub.journal}
                    </p>
                    <p>
                      <strong>Volume:</strong> {pub.volume ?? "N/A"} |{" "}
                      <strong>Issue:</strong> {pub.issue ?? "N/A"}
                    </p>
                    <p>
                      <strong>Year:</strong> {pub.year}
                    </p>
                    <p>
                      <strong>Link:</strong>{" "}
                      <a
                        href={pub.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        View on Google Scholar
                      </a>
                    </p>
                    <p>
                      <strong>Citations:</strong> {pub.citations}
                    </p>
                    <p>
                      <strong>Citation ID:</strong> {pub.citationId}
                    </p>
                    <p>
                      <strong>Author Names:</strong> {pub.authorNames}
                    </p>
                    <div>
                      <strong>Author IDs:</strong>
                      {pub.coAuthors.length ? (
                        <ul className="ml-6 list-disc">
                          {pub.coAuthors.map((coAuthor) => (
                            <li key={coAuthor.authorId}>
                              {coAuthor.authorName} ({coAuthor.authorId})
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="ml-2">None</p>
                      )}
                    </div>
                  </div>
                ))
              : "No publications found."}
          </div>
        </>
      )}
    </div>
  );
};

export default PublicationsView;
