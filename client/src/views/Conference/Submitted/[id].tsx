import api from "@/lib/axios-instance";
import { useQuery } from "@tanstack/react-query";

import { useParams } from "react-router-dom";

const ConferenceSubmittedApplicationView = () => {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["conference", "submittedApplications"],
    queryFn: async () => {
      if (!id) throw new Error("No application ID provided");
      return (
        await api.get<object>(`/conference/viewOwnApplicationDetails/${id}`)
      ).data;
    },
    enabled: !!id,
  });

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center gap-6 bg-background-faded p-8">
      <h2 className="self-start text-3xl font-normal">View Application</h2>
      {isLoading && <p>Loading...</p>}
      {isError && <p>Error loading applications</p>}
      <p className="whitespace-pre text-left font-mono">
        {Object.entries(data ?? {}).length && JSON.stringify(data, null, 4)}
      </p>
    </div>
  );
};

export default ConferenceSubmittedApplicationView;
