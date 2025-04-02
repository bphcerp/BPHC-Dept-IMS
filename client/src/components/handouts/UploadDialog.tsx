import React, { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface UploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: () => void;
}

export const UploadDialog: React.FC<UploadDialogProps> = ({ isOpen, onClose, onUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white text-black border border-gray-300">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Upload Handout</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".pdf,.doc,.docx"
          />
          <Button 
            onClick={handleFileSelect}
            className="w-full bg-gray-100 hover:bg-gray-200 text-black border border-gray-300"
          >
            Select file from computer
          </Button>
          
          <Button 
            onClick={onUpload}
            className="w-full bg-gray-100 hover:bg-gray-200 text-black border border-gray-300"
          >
            Upload handout
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
