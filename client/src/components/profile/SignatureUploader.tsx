import type React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Upload, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { useImageUploader } from "@/hooks/useImageUploader";

const TARGET_HEIGHT = 60;
const TARGET_WIDTH = 150;
const MAX_FILE_SIZE = 8; // MB

interface SignatureUploaderProps {
  userEmail: string;
}

const SignatureUploader: React.FC<SignatureUploaderProps> = ({ userEmail }) => {
  const {
    data,
    isLoading,
    isError,
    dragActive,
    showCropDialog,
    originalImage,
    crop,
    completedCrop,
    inputFileRef,
    imgRef,
    canvasRef,
    updateMutation,
    deleteMutation,
    onFileChange,
    handleDrag,
    handleDrop,
    handleCropAndUpload,
    closeDialog,
    setCrop,
    setCompletedCrop,
  } = useImageUploader({
    userEmail,
    endpoint: "/profile/signature",
    queryKey: ["userSignature", userEmail],
    targetWidth: TARGET_WIDTH,
    targetHeight: TARGET_HEIGHT,
    maxFileSize: MAX_FILE_SIZE,
    formDataKey: "signature",
    successMessage: "Signature uploaded successfully",
    deleteSuccessMessage: "Signature removed successfully",
  });

  const SignatureSkeleton = () => (
    <div className="animate-pulse">
      <div className="h-24 w-48 rounded-lg bg-gray-200"></div>
    </div>
  );

  return (
    <div className="space-y-6">
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
                Supports: PNG, JPG, JPEG, WebP (max {MAX_FILE_SIZE}MB)
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

      <Dialog open={showCropDialog} onOpenChange={closeDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Crop Signature</DialogTitle>
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
            <Button variant="outline" onClick={() => closeDialog(false)}>
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

export default SignatureUploader;
