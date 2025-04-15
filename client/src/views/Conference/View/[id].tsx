import api from "@/lib/axios-instance";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { conferenceSchemas } from "lib";
import BackButton from "@/components/BackButton";
import { useAuth } from "@/hooks/Auth";
import { ViewApplication } from "@/components/conference/ViewApplication";

const ConferenceViewApplicationView = () => {
  const { id } = useParams<{ id: string }>();
  const { checkAccess } = useAuth();
  const canReviewAsMember = checkAccess(
    "conference:application:review-application-member"
  );
  const canReviewAsHod = checkAccess(
    "conference:application:review-application-hod"
  );
  const canReviewAsConvener = checkAccess(
    "conference:application:review-application-convener"
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["conference", "applications", parseInt(id!)],
    queryFn: async () => {
      if (!id) throw new Error("No application ID provided");
      return (
        await api.get<conferenceSchemas.ViewApplicationResponse>(
          `/conference/applications/view/${id}`
        )
      ).data;
    },
    enabled: !!id,
    refetchOnWindowFocus: false,
  });

  return (
    <div className="relative flex min-h-screen w-full flex-col gap-6 bg-gray-50 p-8">
      <BackButton />
      {isLoading && <p>Loading...</p>}
      {isError && <p>Error loading application</p>}
      {data && (
        <>
          <h2 className="self-start text-3xl">
            Application No. {data.application.id}
          </h2>
          <ViewApplication data={data} />
          {canReviewAsMember && data.application.state === "DRC Member" ? (
            <div></div>
          ) : null}
          {canReviewAsConvener && data.application.state === "DRC Convener" ? (
            <div></div>
          ) : null}
          {canReviewAsHod && data.application.state === "HoD" ? (
            <div></div>
          ) : null}
        </>
      )}
    </div>
  );
};

export default ConferenceViewApplicationView;
