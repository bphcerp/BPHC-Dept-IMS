import { Upload, CircleAlert, Check } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import api from "@/lib/axios-instance";

interface ToSubmitProps {
  courseName: string;
  daysLeft: number;
  ficDeadline: string;
  courseCode: string;
  requestId: string;
  ficEmail: string;
  documentsUploaded: boolean;
}

const ToSubmit = ({
  courseName,
  daysLeft,
  ficDeadline,
  courseCode,
  requestId,
  ficEmail,
  documentsUploaded,
}: ToSubmitProps) => {
  const [uploadedFiles, setUploadedFiles] = useState<{
    [key: string]: File | null;
  }>({
    midSemFile: null,
    midSemSolFile: null,
    compreFile: null,
    compreSolFile: null,
  });

  console.log(requestId)

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    key: string
  ) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setUploadedFiles((prev) => ({ ...prev, [key]: file }));
    }
  };

  const handleSubmit = async () => {
    const formData = new FormData();

    formData.append("requestId", requestId);

    formData.append("ficEmail", ficEmail);


    Object.entries(uploadedFiles).forEach(([key, file]) => {
        if (file) {
            console.log(`Appending file: ${key}, Name: ${file.name}`);
            formData.append(key, file);
        }
    });

    try {
        setUploading(true);
        setError(null);
        setSuccess(null);

        const response = await api.post("/qp/uploadFICDocuments", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });

        if (response.status === 200) {
            setSuccess("Documents uploaded successfully.");
        } else {
            setError("Failed to upload documents. Please try again.");
        }
    } catch (err) {
        console.error("Upload error:", err);
        setError("Error uploading documents. Please check your connection.");
    } finally {
        setUploading(false);
    }
};

  return (
    <div className="flex justify-between border-b-2 border-gray-200 p-4">
      <div className="flex items-center gap-3">
        {
          documentsUploaded?
          (
            <>
            <Check size="20" className="text-green-500" />
            </>
          ):(
            <CircleAlert size="20" className="text-red-500" />
          )
        }
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{courseName}</h1>
          <p>|</p>
          <p>{courseCode}</p>
          <p>|</p>
          <p>Deadline: {ficDeadline}</p>
          <p>|</p>
          <p>{daysLeft} days left</p>
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog>
        <DialogTrigger>
          <Upload size="20" className="cursor-pointer" />
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex justify-between pr-4">
              <DialogTitle className="text-xl font-bold">
                Upload Documents
              </DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-3">
            {Object.entries(uploadedFiles).map(([key, file], index) => (
              <div key={index} className="flex items-center gap-3">
                <p className="flex-1 capitalize">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </p>
                <input
                  type="file"
                  className="hidden"
                  id={`upload-${index}`}
                  onChange={(e) => handleFileChange(e, key)}
                />
                <label
                  htmlFor={`upload-${index}`}
                  className="flex cursor-pointer items-center gap-2 px-3 py-1"
                >
                  <Upload />
                  {file && (
                    <span className="text-sm text-green-600">{file.name}</span>
                  )}
                </label>
              </div>
            ))}
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          {success && <p className="text-sm text-green-500">{success}</p>}
          <Button onClick={handleSubmit} disabled={uploading}>
            {uploading ? "Uploading..." : "Submit"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ToSubmit;