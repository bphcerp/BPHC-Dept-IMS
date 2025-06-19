import type React from "react";
import { useState, useRef, useCallback } from "react";
import api from "@/lib/axios-instance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Upload, X, FileImage, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/Auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ReactCrop, { type Crop } from "react-image-crop";
import imageCompression from "browser-image-compression";
import "react-image-crop/dist/ReactCrop.css";

const TARGET_HEIGHT = 60;
const TARGET_WIDTH = 150;

const validateFile = (file: File): boolean => {
  if (!file.type.startsWith("image/")) {
    toast.error("Please select an image file");
    return false;
  }

  if (file.size > 8 * 1024 * 1024) {
    toast.error("Image must be less than 8MB");
    return false;
  }

  return true;
};

const Profile = () => {
  const { authState } = useAuth();
  const queryClient = useQueryClient();
  const [dragActive, setDragActive] = useState(false);
  const inputFileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const userEmail = authState!.email;

  const [showCropDialog, setShowCropDialog] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [crop, setCrop] = useState<Crop>({
    unit: "px",
    width: 150,
    height: 60,
    x: 0,
    y: 0,
  });
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null);

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
      formData.append("signature", file, file.name);
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

  const cropImage = useCallback(
    (image: HTMLImageElement, crop: Crop, fileName: string): Promise<File> => {
      const canvas = document.createElement("canvas");
      canvas.width = TARGET_WIDTH;
      canvas.height = TARGET_HEIGHT;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        ctx.drawImage(
          image,
          crop.x * scaleX,
          crop.y * scaleY,
          crop.width * scaleX,
          crop.height * scaleY,
          0,
          0,
          TARGET_WIDTH,
          TARGET_HEIGHT
        );
      }

      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error("Canvas is empty"));
            return;
          }
          resolve(new File([blob], fileName, { type: "image/png" }));
        }, "image/png");
      });
    },
    []
  );

  const processImage = useCallback(
    async (file: File, crop: Crop) => {
      if (!imgRef.current) return null;

      try {
        const croppedFile = await cropImage(imgRef.current, crop, file.name);
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: Math.max(TARGET_WIDTH, TARGET_HEIGHT),
          alwaysKeepResolution: true,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(croppedFile, options);
        return compressedFile;
      } catch (error) {
        console.error("Error processing image:", error);
        toast.error("Failed to process image");
        return null;
      }
    },
    [cropImage]
  );

  const uploadFile = (file: File) => {
    if (!validateFile(file)) return;

    const reader = new FileReader();
    reader.onload = () => {
      setOriginalImage(reader.result as string);
      setSelectedFile(file);
      setShowCropDialog(true);
      setCompletedCrop({
        unit: "px",
        width: TARGET_WIDTH,
        height: TARGET_HEIGHT,
        x: 0,
        y: 0,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleCropAndUpload = async () => {
    if (!selectedFile || !completedCrop) return;

    const processedFile = await processImage(selectedFile, completedCrop);
    if (processedFile) {
      updateMutation.mutate(processedFile);
      setShowCropDialog(false);
      setOriginalImage(null);
      setSelectedFile(null);
    }
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

  return (
    <div className="max-w-2xl space-y-4 p-2">
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
                    Supports: PNG, JPG, JPEG (max 10MB)
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

      <Dialog
        open={showCropDialog}
        onOpenChange={(open) => {
          if (!open) {
            setTimeout(() => {
              setOriginalImage(null);
              setSelectedFile(null);
              setCompletedCrop(null);
              setCrop({
                unit: "px",
                width: TARGET_WIDTH,
                height: TARGET_HEIGHT,
                x: 0,
                y: 0,
              });
              if (inputFileRef.current) {
                inputFileRef.current.value = "";
              }
            }, 150);
          }
          setShowCropDialog(open);
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Crop and Resize Signature (150x60 pixels)</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {originalImage && (
              <div className="flex justify-center">
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={TARGET_WIDTH / TARGET_HEIGHT}
                >
                  <img
                    ref={imgRef}
                    src={originalImage}
                    alt="Crop preview"
                    style={{ maxWidth: "100%", maxHeight: "400px" }}
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

export default Profile;
