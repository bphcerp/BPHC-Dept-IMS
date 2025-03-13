import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/spinner";

export default function FileUploader() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const allowedExtensions = [".pdf", ".docx"];
      const fileExtension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
      if (!allowedExtensions.includes(fileExtension)) {
        alert("Only PDF and DOCX files are allowed.");
        return;
      }
      setSelectedFile(file);
      console.log("Selected File:", file);
    }
  };

  return (
    <div className="flex flex-col items-start">
      <Button type="button" variant="outline" onClick={handleButtonClick} disabled={isSubmitting}>
        {isSubmitting ? <LoadingSpinner className="h-5 w-5" /> : "SUBMIT FILE"}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx"
        className="hidden"
        onChange={handleFileChange}
      />
      {selectedFile && (
        <p className="mt-2 text-sm text-gray-600">Selected File: {selectedFile.name}</p>
      )}
    </div>
  );
}
