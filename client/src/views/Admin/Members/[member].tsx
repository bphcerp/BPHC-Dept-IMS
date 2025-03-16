import type React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { UserDetails } from "@/components/admin/MemberDetails";
import { LoadingSpinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { adminSchemas } from "lib";

const MemberDetailsView: React.FC = () => {
  const { member } = useParams<{ member: string }>();
  const navigate = useNavigate();

  // Fetch member details
  const { data, isLoading, isError } =
    useQuery<adminSchemas.MemberDetailsResponse>({
      queryKey: ["member", member],
      queryFn: async () => {
        if (!member) throw new Error("No member email provided");
        const response = await api.get<adminSchemas.MemberDetailsResponse>(
          `/admin/member/details`,
          {
            params: { email: member },
          }
        );
        return response.data;
      },
      enabled: !!member,
    });

  const handleBack = () => {
    navigate(-1); // Navigate back to the previous page
  };

  // Render loading and error states
  if (isLoading)
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gray-100">
        <LoadingSpinner />
      </div>
    );

  if (isError)
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gray-100">
        <div>Error fetching member details</div>
      </div>
    );

  return (
    // Render member details
    <div className="relative flex min-h-screen w-full items-center bg-gray-100 p-8">
      <Button
        onClick={handleBack}
        variant="outline"
        className="absolute left-4 top-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      <div className="mx-auto w-full max-w-2xl">
        {data && <UserDetails data={data} />}
      </div>
    </div>
  );
};

export default MemberDetailsView;
