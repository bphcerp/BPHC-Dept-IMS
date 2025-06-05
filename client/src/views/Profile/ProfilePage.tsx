// src/pages/ProfilePage.tsx (or wherever you keep your page components)
import { AppSidebar, type SidebarMenuGroup } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/Auth";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { LoadingSpinner } from "@/components/ui/spinner";
import Profile from "./UserProfile";
import { adminSchemas } from "lib";

interface ProfilePageProps {
  sidebarItems?: SidebarMenuGroup[];
}

const ProfilePage: React.FC<ProfilePageProps> = ({ sidebarItems }) => {
  const { authState } = useAuth();
  const userEmail = authState?.email;
  
const { data, isLoading, isError } = useQuery({
  queryKey: ["member", userEmail],
  queryFn: async () => {
    if (!userEmail) throw new Error("No email found for user");
    const response = await api.get<adminSchemas.MemberDetailsResponse>(
      "/admin/member/details",
      {
        params: { email: userEmail },
      }
    );
    return response.data;
  },
  enabled: !!userEmail,
});

if (isLoading) return <LoadingSpinner />;
if (isError || !data) return <div>Error loading profile</div>;

  return (
    <>
      <AppSidebar items={sidebarItems ?? []} />
      <div className="flex min-h-screen w-full flex-col">
        <div className="border-b bg-background p-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold">Profile Settings</h1>
          </div>
        </div>
        
        <div className="flex-1 p-6">
          <Profile 
            userName={data.name ?? ""} 
            userEmail={userEmail ?? ""}
          />
        </div>
      </div>
    </>
  );
};

export default ProfilePage;