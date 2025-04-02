import React, { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ReUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onReUpload: () => void;
  revisionComments: string;
}

export const ReUploadDialog: React.FC<ReUploadDialogProps> = ({ 
  isOpen, 
  onClose, 
  onReUpload,
  revisionComments 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="text-black border border-gray-300 bg-white">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Re-Upload Handout</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          <div className="border border-gray-300 p-4 rounded-md bg-gray-100">
            <h3 className="mb-2 text-sm font-medium">Revision Comments</h3>
            <p className="text-sm text-gray-600">{revisionComments}</p>
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".pdf,.doc,.docx"
          />
          <Button 
            onClick={handleFileSelect}
            className="w-full bg-white hover:bg-gray-50 text-black border border-gray-300"
          >
            Select file from computer
          </Button>
          
          <Button 
            onClick={onReUpload}
            className="w-full bg-white hover:bg-gray-50 text-black border border-gray-300"
          >
            Re-upload handout
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
