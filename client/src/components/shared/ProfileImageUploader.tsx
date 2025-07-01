import type React from "react";
import { useState, useRef } from "react";
import api from "@/lib/axios-instance";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { X, Loader2, Image } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ReactCrop, { type Crop } from "react-image-crop";
import imageCompression from "browser-image-compression";
import "react-image-crop/dist/ReactCrop.css";

const TARGET_HEIGHT = 256;
const TARGET_WIDTH = 256;
const MAX_FILE_SIZE = 1; // MB

const validateFile = (file: File): boolean => {
  if (file.size > MAX_FILE_SIZE * 1024 * 1024 * 4) {
    toast.error(`File size should be less than ${MAX_FILE_SIZE * 4}MB`);
    return false;
  }
  if (!file.type.startsWith("image/")) {
    toast.error("Please select an image file");
    return false;
  }
  return true;
};

interface ProfileImageUploaderProps {
  email: string;
  isAdmin?: boolean;
  disabled?: boolean;
}

const ProfileImageUploader: React.FC<ProfileImageUploaderProps> = ({
  email,
  isAdmin = false,
  disabled = false,
}) => {
  const queryClient = useQueryClient();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    width: 50,
    height: 50,
    x: 25,
    y: 25,
  });
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputFileRef = useRef<HTMLInputElement>(null);

  const endpoint = isAdmin
    ? "/admin/member/profile-image"
    : "/profile/profile-image";

  const {
    data: profileImage,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["userProfileImage", email],
    queryFn: async () => {
      const params = isAdmin ? { email } : {};
      const res = await api.get<{ profileImage: string | null }>(endpoint, {
        params,
      });
      return res.data.profileImage;
    },
    enabled: !!email,
  });

  const updateMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("profileImage", file);
      if (isAdmin) {
        formData.append("email", email);
      }
      const res = await api.post<{ profileImage: string }>(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data.profileImage;
    },
    onSuccess: () => {
      toast.success("Profile image updated successfully");
      void queryClient.invalidateQueries({
        queryKey: ["userProfileImage", email],
      });
      if (isAdmin) {
        void queryClient.invalidateQueries({ queryKey: ["member", email] });
      }
      setShowCropDialog(false);
      setOriginalImage(null);
    },
    onError: () => {
      toast.error("Failed to update profile image");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const data = isAdmin ? { email } : {};
      await api.delete(endpoint, { data });
    },
    onSuccess: () => {
      toast.success("Profile image removed successfully");
      void queryClient.invalidateQueries({
        queryKey: ["userProfileImage", email],
      });
      if (isAdmin) {
        void queryClient.invalidateQueries({ queryKey: ["member", email] });
      }
    },
    onError: () => {
      toast.error("Failed to remove profile image");
    },
  });

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const file = e.target.files?.[0];
    if (!file) return;
    if (validateFile(file)) {
      const reader = new FileReader();
      reader.onload = () => {
        setOriginalImage(reader.result as string);
        setShowCropDialog(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        const reader = new FileReader();
        reader.onload = () => {
          setOriginalImage(reader.result as string);
          setShowCropDialog(true);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleCropAndUpload = async () => {
    if (!completedCrop || !imgRef.current || !canvasRef.current) return;

    const image = imgRef.current;
    const canvas = canvasRef.current;
    const cropData = completedCrop;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = TARGET_WIDTH;
    canvas.height = TARGET_HEIGHT;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(
      image,
      cropData.x * scaleX,
      cropData.y * scaleY,
      cropData.width * scaleX,
      cropData.height * scaleY,
      0,
      0,
      TARGET_WIDTH,
      TARGET_HEIGHT
    );

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg")
    );
    if (!blob) return;

    const file = new File([blob], "profile.jpg", { type: "image/jpeg" });

    try {
      const compressedFile = await imageCompression(file, {
        maxSizeMB: MAX_FILE_SIZE,
        maxWidthOrHeight: Math.max(TARGET_WIDTH, TARGET_HEIGHT),
        useWebWorker: true,
      });
      updateMutation.mutate(compressedFile);
    } catch (error) {
      console.error("Image compression error:", error);
      toast.error("Failed to compress image.");
    }
  };

  const ProfileImageSkeleton = () => (
    <div className="animate-pulse">
      <div className="h-24 w-24 rounded-full bg-gray-200"></div>
    </div>
  );

  if (isLoading) return <ProfileImageSkeleton />;
  if (isError) return <div>Failed to load profile image</div>;

  return (
    <div className="space-y-6">
      {profileImage ? (
        <div className="space-y-4">
          <div>
            <div className="inline-block rounded-full border-2 border-gray-200 bg-gray-50 p-2">
              <img
                src={profileImage}
                alt="Profile"
                className="h-24 w-24 rounded-full object-cover"
                onError={() => {
                  toast.error("Failed to load profile image");
                }}
              />
            </div>
          </div>
          {!disabled && (
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
                  <Image className="h-4 w-4" />
                )}
                Replace Image
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isLoading}
                className="flex items-center gap-2"
              >
                {deleteMutation.isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                Remove
              </Button>
            </div>
          )}
        </div>
      ) : !disabled ? (
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
                <Image className="h-8 w-8 text-gray-600" />
              )}
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-900">
                Upload profile image
              </h3>
              <p className="text-sm text-gray-600">
                Drag and drop your profile image here, or click to browse
              </p>
              <p className="text-xs text-gray-500">
                Supports: PNG, JPG, JPEG (max {MAX_FILE_SIZE}MB)
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
      ) : (
        <div className="text-center text-gray-500">No profile image</div>
      )}

      {!disabled && (
        <input
          type="file"
          accept="image/*"
          onChange={onFileChange}
          ref={inputFileRef}
          className="hidden"
        />
      )}

      <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Crop Profile Image)</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {originalImage && (
              <div className="flex justify-center">
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={TARGET_WIDTH / TARGET_HEIGHT}
                  circularCrop
                >
                  <img
                    ref={imgRef}
                    src={originalImage}
                    alt="Crop preview"
                    style={{ maxHeight: "70vh" }}
                  />
                </ReactCrop>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCropDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleCropAndUpload()}
              disabled={!completedCrop || updateMutation.isLoading}
            >
              {updateMutation.isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Crop & Upload"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
};

export default ProfileImageUploader;
