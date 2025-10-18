import React from "react";
import { AppSidebar, type SidebarMenuGroup } from "@/components/AppSidebar";
import { ProfileHeader } from "./ProfileHeader";
import TabSwitcher from "./TabSwitcher";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios-instance";
import { LoadingSpinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import type { ProjectItem, PatentItem, PublicationItem } from "./TabSwitcher";

interface ProfileData {
  name?: string;
  email?: string;
  phone?: string | null;
  designation?: string | null;
  department?: string | null;
  projects?: unknown[];
  patents?: unknown[];
  publications?: unknown[];
  description?: string | null;
  education?: string | null;
  researchInterests?: string | null;
  courses?: string | null;
  linkedin?: string | null;
  orchidID?: string | null;
  scopusID?: string | null;
  googleScholar?: string | null;
  additionalLinks?: string | null;
}

interface ProfileImageData {
  profileImage: string | null;
}

interface ProfessorProfilePageProps {
  sidebarItems?: SidebarMenuGroup[];
}

const ProfessorProfilePage = ({ sidebarItems }: ProfessorProfilePageProps) => {
  const queryClient = useQueryClient();

  const { data: profile, isLoading: isLoadingProfile } = useQuery<ProfileData>({
    queryKey: ["my-profile"],
    queryFn: async () => {
      const res = await api.get<ProfileData>("/profile");
      return res.data;
    },
    refetchOnWindowFocus: false,
  });

  const { data: profileImageData, isLoading: isLoadingImage } = useQuery<ProfileImageData>({
    queryKey: ["my-profile-image"],
    queryFn: async () => {
      const res = await api.get<ProfileImageData>("/profile/profile-image");
      return res.data;
    },
    refetchOnWindowFocus: false,
  });

  const editMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      await api.put("/profile/edit", data);
    },
    onSuccess: () => {
      toast.success("Profile updated");
      void queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    },
    onError: () => toast.error("Failed to update profile"),
  });

  const imageUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("profileImage", file);
      await api.post("/profile/profile-image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
    onSuccess: () => {
      toast.success("Profile image updated");
      void queryClient.invalidateQueries({ queryKey: ["my-profile-image"] });
    },
    onError: () => toast.error("Failed to update profile image"),
  });

  const handleEditProfile = (payload: Record<string, unknown>) => {
    editMutation.mutate(payload);
  };

  const handleImageChange = (file: File) => {
    imageUploadMutation.mutate(file);
  };

  const isLoading = isLoadingProfile || isLoadingImage;

  return (
    <>
      <AppSidebar items={sidebarItems ?? []} />
      <div className="flex min-h-screen w-full flex-col">
        <div className="border-b bg-background p-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold">Profile</h1>
          </div>
        </div>

        <div className="flex-1 bg-muted/20 p-6">
          <div className="mx-auto max-w-6xl space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : (
              <>
                <ProfileHeader
                  name={profile?.name ?? ""}
                  email={profile?.email ?? ""}
                  designation={profile?.designation ?? undefined}
                  department={profile?.department ?? undefined}
                  description={profile?.description || undefined}
                  education={profile?.education ? [profile.education] : undefined}
                  researchInterests={profile?.researchInterests ? [profile.researchInterests] : undefined}
                  courses={profile?.courses ? [profile.courses] : undefined}
                  linkedin={profile?.linkedin || undefined}
                  orchidID={profile?.orchidID || undefined}
                  scopusID={profile?.scopusID || undefined}
                  googleScholar={profile?.googleScholar || undefined}
                  additionalLinks={profile?.additionalLinks ? [profile.additionalLinks] : undefined}
                  phone={profile?.phone || undefined}
                  imageUrl={profileImageData?.profileImage ?? null}
                  onEditProfile={handleEditProfile}
                  onImageChange={handleImageChange}
                />
                <TabSwitcher
                  projects={Array.isArray(profile?.projects) ? (profile.projects as ProjectItem[]) : []}
                  patents={Array.isArray(profile?.patents) ? (profile.patents as PatentItem[]) : []}
                  publications={Array.isArray(profile?.publications) ? (profile.publications as PublicationItem[]) : []}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfessorProfilePage;