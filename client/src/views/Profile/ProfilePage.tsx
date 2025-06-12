// src/pages/ProfilePage.tsx (or wherever you keep your page components)
import { AppSidebar, type SidebarMenuGroup } from "@/components/AppSidebar";
import Profile from "@/components/profile/UserProfile";

interface ProfilePageProps {
  sidebarItems?: SidebarMenuGroup[];
}

const ProfilePage = ({ sidebarItems }: ProfilePageProps) => {
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
          <Profile />
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
