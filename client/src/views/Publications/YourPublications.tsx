import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { useState } from "react";
import { LoadingSpinner } from "@/components/ui/spinner";

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
  const [authorId, setAuthorId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    isLoading: isLoadingAuthorId,
    isError: isAuthorIdError,
  } = useQuery({
    queryKey: ["authorId"],
    queryFn: async () => {
      const response = await api.get<{ authorId: string }>("/publications/id");
      return response.data;
    },
    onSuccess: (data) => {
      setAuthorId(data.authorId);
    },
    onError: () => {
      setErrorMessage("Author ID not found. Please update your profile to set your Author ID.");
    },
    staleTime: 5 * 60 * 1000,
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
      const response = await api.get<PublicationResponse>("/publications/user", {
        params: { authorId },
      });
      return response.data;
    },
    enabled: !!authorId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  if (isLoadingAuthorId || isLoadingPubs) return <LoadingSpinner />;

  if (errorMessage) return <p className="text-red-500">{errorMessage}</p>;

  if (publicationsData && publicationsData.publications.length === 0) {
    return <p>No publications found in the database.</p>;
  }

  if (isAuthorIdError || isPubsError) {
    return <p className="text-red-500">An error occurred while loading publications.</p>;
  }

  return (
    <div className="mx-auto max-w-5xl p-10">
      <h1 className="mb-6 text-3xl font-bold text-primary">My Publications</h1>
      <div className="space-y-6">
        {publicationsData?.publications.map((pub, index) => (
          <div
            key={pub.citationId}
            className="rounded-xl border p-6 shadow-sm bg-white space-y-1 text-sm"
          >
            <h2 className="text-2xl font-semibold">{index+1}. {pub.title}</h2>
            <p><strong>Type:</strong> {pub.type}</p>
            <p><strong>Journal:</strong> {pub.journal}</p>
            <p>
              <strong>Volume:</strong> {pub.volume ?? "N/A"} | <strong>Issue:</strong> {pub.issue ?? "N/A"}
            </p>
            <p><strong>Year:</strong> {pub.year}</p>
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
            <p><strong>Citations:</strong> {pub.citations}</p>
            <p><strong>Citation ID:</strong> {pub.citationId}</p>
            <p><strong>Author Names:</strong> {pub.authorNames}</p>
            <div>
              <strong>Author IDs:</strong>
              {pub.coAuthors.length ? (
                <ul className="list-disc ml-6">
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
        ))}
      </div>
    </div>
  );
};

export default PublicationsView;
