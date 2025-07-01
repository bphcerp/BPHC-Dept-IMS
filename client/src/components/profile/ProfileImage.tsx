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
import { Upload, Loader2, User, Image, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import ReactCrop, { type Crop } from "react-image-crop";
import imageCompression from "browser-image-compression";
import "react-image-crop/dist/ReactCrop.css";

const TARGET_HEIGHT = 256;
const TARGET_WIDTH = 256;
const MAX_FILE_SIZE = 1; // MB

const validateFile = (file: File): boolean => {
  if (file.size > MAX_FILE_SIZE * 1024 * 1024) {
    toast.error(`File size should be less than ${MAX_FILE_SIZE}MB`);
    return false;
  }
  if (!file.type.startsWith("image/")) {
    toast.error("Please select an image file");
    return false;
  }
  return true;
};

interface ProfileImageProps {
  email: string;
  src: string | null;
  endpoint: string;
  queryKey: (string | null | undefined)[];
}

const ProfileImage: React.FC<ProfileImageProps> = ({
  email,
  src,
  endpoint,
  queryKey,
}) => {
  const queryClient = useQueryClient();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputFileRef = useRef<HTMLInputElement>(null);

  const updateMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await api.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Profile image updated successfully");
      void queryClient.invalidateQueries({ queryKey });
      setShowCropDialog(false);
      setOriginalImage(null);
    },
    onError: (error) => {
      console.error("Error uploading image:", error);
      toast.error("Failed to update profile image. Please try again.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(endpoint);
    },
    onSuccess: () => {
      toast.success("Profile image removed successfully");
      void queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      console.error("Error deleting image:", error);
      toast.error("Failed to remove profile image. Please try again.");
    },
  });

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (validateFile(file)) {
      setCrop(undefined);
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setOriginalImage(reader.result as string);
        setShowCropDialog(true);
      });
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
      if (validateFile(e.dataTransfer.files[0])) {
        setCrop(undefined);
        const reader = new FileReader();
        reader.addEventListener("load", () => {
          setOriginalImage(reader.result as string);
          setShowCropDialog(true);
        });
        reader.readAsDataURL(e.dataTransfer.files[0]);
      }
    }
  };

  const handleCropAndUpload = useCallback(async () => {
    if (!completedCrop || !imgRef.current || !canvasRef.current) {
      toast.error("Could not process image. Please try again.");
      return;
    }

    const image = imgRef.current;
    const canvas = canvasRef.current;
    const crop = completedCrop;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      toast.error("Could not process image. Please try again.");
      return;
    }

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY
    );

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.9)
    );

    if (!blob) {
      toast.error("Failed to create image blob.");
      return;
    }

    try {
      const compressedFile = await imageCompression(blob as File, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: TARGET_WIDTH,
        useWebWorker: true,
      });

      const formData = new FormData();
      formData.append("profileImage", compressedFile);
      formData.append("email", email);
      updateMutation.mutate(formData);
    } catch (error) {
      console.error("Image compression error:", error);
      toast.error("Failed to compress image.");
    }
  }, [completedCrop, updateMutation, email]);

  const Skeleton = () => (
    <div className="animate-pulse">
      <div className="h-24 w-24 rounded-full bg-gray-200"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      {src ? (
        <div className="space-y-4">
          <div>
            <div className="inline-block rounded-full border-2 border-gray-200 bg-gray-50 p-2">
              <img
                src={src}
                alt="Profile"
                className="h-24 w-24 rounded-full object-cover"
                onError={() => toast.error("Failed to load profile image")}
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
        </div>
      ) : (
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
                  aspect={1}
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

export default ProfileImage;
