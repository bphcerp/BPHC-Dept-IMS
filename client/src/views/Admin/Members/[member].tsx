import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { UserDetails } from "@/components/admin/MemberDetails";
import { LoadingSpinner } from "@/components/ui/spinner";
interface UserData {
  email: string;
  type: string;
  name: string;
  [key: string]: string[] | number | boolean | string;
}

const MemberDetailsView: React.FC = () => {
  const { member } = useParams<{ member: string }>();
  // Fetch member details
  const { data, isLoading, isError } = useQuery<UserData>({
    queryKey: ["member", member],
    queryFn: async () => {
      if (!member) throw new Error("No member email provided");
      const response = await api.get<UserData>(`/admin/member/details`, {
        params: { email: member },
      });
      return response.data;
    },
    enabled: !!member,
  });

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
    <div className="flex min-h-screen w-full items-center bg-gray-100 p-8">
      <div className="mx-auto w-full max-w-2xl">
        {data && <UserDetails data={data} />}
      </div>
    </div>
  );
};

export default MemberDetailsView;
