import type React from "react";
import { useState, useRef } from "react";
import api from "@/lib/axios-instance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, X, FileImage, Loader2, User, Image } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/Auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const validateFile = (file: File): boolean => {
  if (!file.type.startsWith("image/")) {
    toast.error("Please select an image file");
    return false;
  }

  if (file.size > 1 * 1024 * 1024) {
    toast.error("Image must be less than 1MB");
    return false;
  }

  return true;
};

const Profile = () => {
  const { authState } = useAuth();
  const queryClient = useQueryClient();
  const [dragActive, setDragActive] = useState(false);
  const inputFileRef = useRef<HTMLInputElement>(null);
  const userEmail = authState!.email;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["userSignature", userEmail],
    queryFn: async () => {
      const res = await api.get<{ signature: string | null }>(
        "/profile/signature"
      );
      return res.data.signature;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("signature", file);
      const res = await api.post<{ signature: string }>(
        "/profile/signature",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return res.data.signature;
    },
    onSuccess: (signature) => {
      queryClient.setQueryData(["userSignature", userEmail], signature);
      toast.success("Signature uploaded successfully");
    },
    onError: () => {
      toast.error("Failed to upload signature");
    },
    onSettled: () => {
      if (inputFileRef.current) inputFileRef.current.value = "";
    },
  });

  const deteleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete("/profile/signature", {
        data: { email: userEmail },
      });
    },
    onSuccess: () => {
      queryClient.setQueryData(["userSignature", userEmail], null);
      toast.success("Signature removed successfully");
    },
    onError: () => {
      toast.error("Failed to remove signature");
    },
  });

  const uploadFile = (file: File) => {
    if (!validateFile(file)) return;
    updateMutation.mutate(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const SignatureSkeleton = () => (
    <div className="animate-pulse">
      <div className="h-24 w-48 rounded-lg bg-gray-200"></div>
    </div>
  );

  // Profile Image State and Query
  const {
    data: profileImage,
    isLoading: isProfileLoading,
    isError: isProfileError,
  } = useQuery({
    queryKey: ["userProfileImage", userEmail],
    queryFn: async () => {
      const res = await api.get<{ profileImage: string | null }>(
        "/profile/profile-image"
      );
      return res.data.profileImage;
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("profileImage", file);
      const res = await api.post<{ profileImage: string }>(
        "/profile/profile-image",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return res.data.profileImage;
    },
    onSuccess: (profileImage) => {
      queryClient.setQueryData(["userProfileImage", userEmail], profileImage);
      toast.success("Profile image uploaded successfully");
    },
    onError: () => {
      toast.error("Failed to upload profile image");
    },
    onSettled: () => {
      if (inputProfileFileRef.current) inputProfileFileRef.current.value = "";
    },
  });

  const deleteProfileMutation = useMutation({
    mutationFn: async () => {
      await api.delete("/profile/profile-image", {
        data: { email: userEmail },
      });
    },
    onSuccess: () => {
      queryClient.setQueryData(["userProfileImage", userEmail], null);
      toast.success("Profile image removed successfully");
    },
    onError: () => {
      toast.error("Failed to remove profile image");
    },
  });

  const inputProfileFileRef = useRef<HTMLInputElement>(null);

  const uploadProfileFile = (file: File) => {
    if (!validateFile(file)) return;
    updateProfileMutation.mutate(file);
  };

  const onProfileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadProfileFile(file);
  };

  const handleProfileDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleProfileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadProfileFile(e.dataTransfer.files[0]);
    }
  };

  const ProfileImageSkeleton = () => (
    <div className="animate-pulse">
      <div className="h-24 w-24 rounded-full bg-gray-200"></div>
    </div>
  );

  return (
    <div className="max-w-2xl space-y-4 p-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Image
          </CardTitle>
          <p className="text-sm text-gray-600">
            Upload your profile image (displayed in your account)
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {isProfileLoading || updateProfileMutation.isLoading ? (
            <ProfileImageSkeleton />
          ) : isProfileError ? (
            <div>Failed to load profile image</div>
          ) : profileImage ? (
            <div className="space-y-4">
              <div>
                <div className="inline-block rounded-full border-2 border-gray-200 bg-gray-50 p-2">
                  <img
                    src={profileImage || "/placeholder-profile.svg"}
                    alt="Profile"
                    className="h-24 w-24 rounded-full object-cover"
                    onError={() => {
                      toast.error("Failed to load profile image");
                    }}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => inputProfileFileRef.current?.click()}
                  disabled={updateProfileMutation.isLoading}
                  className="flex items-center gap-2"
                >
                  {updateProfileMutation.isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Image className="h-4 w-4" />
                  )}
                  Replace Image
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteProfileMutation.mutate()}
                  disabled={deleteProfileMutation.isLoading}
                  className="flex items-center gap-2"
                >
                  {deleteProfileMutation.isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <div
              className={cn(
                "relative rounded-lg border-2 border-dashed p-8 text-center transition-colors",
                dragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400",
                updateProfileMutation.isLoading && "pointer-events-none opacity-50"
              )}
              onDragEnter={handleProfileDrag}
              onDragLeave={handleProfileDrag}
              onDragOver={handleProfileDrag}
              onDrop={handleProfileDrop}
            >
              <div className="space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  {updateProfileMutation.isLoading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
                  ) : (
                    <Image className="h-8 w-8 text-gray-600" />
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-gray-900">
                    Upload your profile image
                  </h3>
                  <p className="text-sm text-gray-600">
                    Drag and drop your profile image here, or click to browse
                  </p>
                  <p className="text-xs text-gray-500">
                    Supports: PNG, JPG, JPEG (max 1MB)
                  </p>
                </div>
                <Button
                  onClick={() => inputProfileFileRef.current?.click()}
                  disabled={updateProfileMutation.isLoading}
                  className="mt-4"
                >
                  {updateProfileMutation.isLoading ? "Uploading..." : "Choose File"}
                </Button>
              </div>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={onProfileFileChange}
            ref={inputProfileFileRef}
            className="hidden"
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileImage className="h-5 w-5" />
            Digital Signature
          </CardTitle>
          <p className="text-sm text-gray-600">
            Upload your digital signature for document signing
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading || updateMutation.isLoading ? (
            <SignatureSkeleton />
          ) : isError ? (
            <div>Failed to load signature image</div>
          ) : data ? (
            <div className="space-y-4">
              <div>
                <div className="inline-block rounded-lg border-2 border-gray-200 bg-gray-50 p-4">
                  <img
                    src={data || "/placeholder.svg"}
                    alt="Digital Signature"
                    className="max-h-24 max-w-full object-contain"
                    onError={() => {
                      toast.error("Failed to load signature image");
                    }}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => inputFileRef.current?.click()}
                  disabled={updateMutation.isLoading}
                  className="flex items-center gap-2"
                >
                  {updateMutation.isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Replace Signature
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deteleteMutation.mutate()}
                  disabled={deteleteMutation.isLoading}
                  className="flex items-center gap-2"
                >
                  {deteleteMutation.isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            /* Upload Area */
            <div
              className={cn(
                "relative rounded-lg border-2 border-dashed p-8 text-center transition-colors",
                dragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400",
                updateMutation.isLoading && "pointer-events-none opacity-50"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  {updateMutation.isLoading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
                  ) : (
                    <Upload className="h-8 w-8 text-gray-600" />
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-gray-900">
                    Upload your signature
                  </h3>
                  <p className="text-sm text-gray-600">
                    Drag and drop your signature image here, or click to browse
                  </p>
                  <p className="text-xs text-gray-500">
                    Supports: PNG, JPG, JPEG (max 1MB)
                  </p>
                </div>

                <Button
                  onClick={() => inputFileRef.current?.click()}
                  disabled={updateMutation.isLoading}
                  className="mt-4"
                >
                  {updateMutation.isLoading ? "Uploading..." : "Choose File"}
                </Button>
              </div>
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            onChange={onFileChange}
            ref={inputFileRef}
            className="hidden"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
