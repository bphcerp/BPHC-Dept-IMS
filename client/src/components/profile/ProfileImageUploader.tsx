import type React from "react";
import { useState, useRef, useCallback } from "react";
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
import { Upload, X, Loader2, Image } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import ReactCrop, { type Crop } from "react-image-crop";
import imageCompression from "browser-image-compression";
import "react-image-crop/dist/ReactCrop.css";

const TARGET_HEIGHT = 150;
const TARGET_WIDTH = 150;
const MAX_FILE_SIZE = 1; // MB

const validateFile = (file: File): boolean => {
  if (file.size > MAX_FILE_SIZE * 1024 * 1024) {
    toast.error(`File size should be less than ${MAX_FILE_SIZE}MB`);
    return false;
  }
  if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
    toast.error("Invalid file type. Only JPG, PNG are allowed");
    return false;
  }
  return true;
};

interface ProfileImageUploaderProps {
  email: string;
  profileImage: string | null;
  isProfileLoading: boolean;
  isProfileError: boolean;
}

const ProfileImageUploader: React.FC<ProfileImageUploaderProps> = ({
  email,
  profileImage,
  isProfileLoading,
  isProfileError,
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
  const inputProfileFileRef = useRef<HTMLInputElement>(null);

  const updateProfileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("email", email);
      await api.post("/user/profile-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      toast.success("Profile image updated successfully");
      void queryClient.invalidateQueries(["user-profile", email]);
      void queryClient.invalidateQueries(["member", email]);
      setShowCropDialog(false);
    },
    onError: () => {
      toast.error("Failed to update profile image");
    },
  });

  const deleteProfileMutation = useMutation({
    mutationFn: async () => {
      await api.delete("/user/profile-image", { data: { email } });
    },
    onSuccess: () => {
      toast.success("Profile image removed successfully");
      void queryClient.invalidateQueries(["user-profile", email]);
      void queryClient.invalidateQueries(["member", email]);
    },
    onError: () => {
      toast.error("Failed to remove profile image");
    },
  });

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    canvas.width = cropData.width * scaleX;
    canvas.height = cropData.height * scaleY;

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
      canvas.width,
      canvas.height
    );

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg")
    );
    if (!blob) return;

    const file = new File([blob], "profile.jpg", { type: "image/jpeg" });

    try {
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      });
      updateProfileMutation.mutate(compressedFile);
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

  return (
    <div className="space-y-6">
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
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
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
                Supports: PNG, JPG, JPEG (max {MAX_FILE_SIZE}MB)
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
        onChange={onFileChange}
        ref={inputProfileFileRef}
        className="hidden"
      />

      <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Crop Profile Image</DialogTitle>
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
              disabled={!completedCrop || updateProfileMutation.isLoading}
            >
              {updateProfileMutation.isLoading ? (
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
