import { Upload, CircleAlert } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ToSubmitProps {
  course: string;
  deadline: string;
}

const ToSubmit = ({ course, deadline }: ToSubmitProps) => {
  const [uploadedFiles, setUploadedFiles] = useState<{
    [key: string]: File | null;
  }>({
    "Mid Sem": null,
    "Mid Sem Solutions": null,
    Compre: null,
    "Compre Solutions": null,
  });

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    item: string
  ) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setUploadedFiles((prev) => ({ ...prev, [item]: file }));
    }
  };

  const handleSubmit = () => {
    const formData = new FormData();

    Object.keys(uploadedFiles).forEach((key) => {
      if (uploadedFiles[key]) {
        formData.append(key, uploadedFiles[key]);
      }
    });

    // ✅ Log FormData contents before sending to the backend
    for (const [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }
  };

  return (
    <div className="flex justify-between border-b-2 border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <CircleAlert size="35" fill="red" color="white" />
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{course}</h1>
          <p>|</p>
          <p>Deadline: {deadline}</p>
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
              <DialogTitle className="text-xl font-bold">Upload</DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-3">
            {Object.keys(uploadedFiles).map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <p className="flex-1">{item}</p>
                <input
                  type="file"
                  className="hidden"
                  id={`upload-${index}`}
                  onChange={(e) => handleFileChange(e, item)}
                />
                <label
                  htmlFor={`upload-${index}`}
                  className="flex cursor-pointer items-center gap-2 px-3 py-1"
                >
                  <Upload />
                  {uploadedFiles[item] && (
                    <span className="text-sm text-green-600">
                      {uploadedFiles[item]?.name}
                    </span>
                  )}
                </label>
              </div>
            ))}
          </div>
          <Button onClick={handleSubmit}>Submit</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ToSubmit;
