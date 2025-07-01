import { useState, useRef, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/axios-instance";
import imageCompression from "browser-image-compression";
import type { Crop } from "react-image-crop";

interface UseImageUploaderProps {
  userEmail: string;
  endpoint: string;
  queryKey: string[];
  targetWidth: number;
  targetHeight: number;
  maxFileSize: number; // in MB
  formDataKey: string;
  successMessage: string;
  deleteSuccessMessage: string;
  isAdmin?: boolean;
  adminQueryKeys?: string[][];
}

const validateFile = (file: File, maxFileSize: number): boolean => {
  if (!file.type.startsWith("image/")) {
    toast.error("Please select an image file");
    return false;
  }

  if (file.size > maxFileSize * 1024 * 1024) {
    toast.error(`Image must be less than ${maxFileSize}MB`);
    return false;
  }

  return true;
};

export const useImageUploader = ({
  userEmail,
  endpoint,
  queryKey,
  targetWidth,
  targetHeight,
  maxFileSize,
  formDataKey,
  successMessage,
  deleteSuccessMessage,
  isAdmin = false,
  adminQueryKeys = [],
}: UseImageUploaderProps) => {
  const queryClient = useQueryClient();
  const [dragActive, setDragActive] = useState(false);
  const inputFileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [showCropDialog, setShowCropDialog] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [crop, setCrop] = useState<Crop>({
    unit: "px",
    width: targetWidth,
    height: targetHeight,
    x: 0,
    y: 0,
  });
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = isAdmin ? { email: userEmail } : {};
      const res = await api.get<{ [key: string]: string | null }>(endpoint, {
        params,
      });
      return res.data[formDataKey];
    },
    enabled: !!userEmail,
  });

  const updateMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append(formDataKey, file, file.name);
      if (isAdmin) {
        formData.append("email", userEmail);
      }
      const res = await api.post<{ [key: string]: string }>(
        endpoint,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return (
        res.data[formDataKey] || res.data.signature || res.data.profileImage
      );
    },
    onSuccess: (result) => {
      queryClient.setQueryData(queryKey, result);
      toast.success(successMessage);
      if (isAdmin) {
        adminQueryKeys.forEach((key) => {
          void queryClient.invalidateQueries({ queryKey: key });
        });
      }
    },
    onError: () => {
      toast.error(`Failed to upload ${formDataKey}`);
    },
    onSettled: () => {
      if (inputFileRef.current) inputFileRef.current.value = "";
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const data = isAdmin ? { email: userEmail } : { email: userEmail };
      await api.delete(endpoint, { data });
    },
    onSuccess: () => {
      queryClient.setQueryData(queryKey, null);
      toast.success(deleteSuccessMessage);
      if (isAdmin) {
        adminQueryKeys.forEach((key) => {
          void queryClient.invalidateQueries({ queryKey: key });
        });
      }
    },
    onError: () => {
      toast.error(`Failed to remove ${formDataKey}`);
    },
  });

  const cropImage = useCallback(
    (image: HTMLImageElement, crop: Crop, fileName: string): Promise<File> => {
      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
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
          targetWidth,
          targetHeight
        );
      }

      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Canvas is empty"));
              return;
            }
            const fileType =
              formDataKey === "signature" ? "image/webp" : "image/jpeg";
            resolve(new File([blob], fileName, { type: fileType }));
          },
          formDataKey === "signature" ? "image/webp" : "image/jpeg"
        );
      });
    },
    [targetWidth, targetHeight, formDataKey]
  );

  const processImage = useCallback(
    async (file: File, crop: Crop) => {
      if (!imgRef.current) return null;

      try {
        const croppedFile = await cropImage(imgRef.current, crop, file.name);
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: Math.max(targetWidth, targetHeight),
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
    [cropImage, targetWidth, targetHeight]
  );

  const uploadFile = (file: File) => {
    if (!validateFile(file, maxFileSize)) return;

    const reader = new FileReader();
    reader.onload = () => {
      setOriginalImage(reader.result as string);
      setSelectedFile(file);
      setShowCropDialog(true);
      setCompletedCrop({
        unit: "px",
        width: targetWidth,
        height: targetHeight,
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

  const closeDialog = (open: boolean) => {
    if (!open) {
      setTimeout(() => {
        setOriginalImage(null);
        setSelectedFile(null);
        setCompletedCrop(null);
        setCrop({
          unit: "px",
          width: targetWidth,
          height: targetHeight,
          x: 0,
          y: 0,
        });
        if (inputFileRef.current) {
          inputFileRef.current.value = "";
        }
      }, 150);
    }
    setShowCropDialog(open);
  };

  return {
    // Data
    data,
    isLoading,
    isError,
    error,

    // State
    dragActive,
    showCropDialog,
    originalImage,
    crop,
    completedCrop,

    // Refs
    inputFileRef,
    imgRef,
    canvasRef,

    // Mutations
    updateMutation,
    deleteMutation,

    // Handlers
    onFileChange,
    handleDrag,
    handleDrop,
    handleCropAndUpload,
    closeDialog,
    setCrop,
    setCompletedCrop,

    // Config
    targetWidth,
    targetHeight,
    maxFileSize,
  };
};
