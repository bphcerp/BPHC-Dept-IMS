import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export interface Student {
  name: string;
  email: string;
  erpId?: string;
  supervisor?: string;
  proposalDocuments?: {
    id: number;
    fieldName: string;
    fileName: string;
    fileUrl: string;
    uploadedAt: string;
  }[] | null;
}

interface ProposalDocumentsModalProps {
  student: Student;
  onClose: () => void;
  documentBatch?: {
    documents: Student['proposalDocuments'];
    uploadedAt: string;
  };
  onReview?: () => void;
}

// Custom function to format time difference
const formatTimeDifference = (dateString: string) => {
  const uploadDate = new Date(dateString);
  const currentDate = new Date();
  const diffInSeconds = Math.floor((currentDate.getTime() - uploadDate.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''} ago`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
};

const ProposalDocumentsModal: React.FC<ProposalDocumentsModalProps> = ({ 
  student, 
  onClose,
  documentBatch,
  onReview
}) => {
  // If no specific document batch is provided, use the first batch
  const documentsToShow = documentBatch?.documents || 
    (student.proposalDocuments ? [student.proposalDocuments[0]] : []);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Proposal Documents for {student.name}
          </DialogTitle>
          <DialogDescription>
            Uploaded Proposal Documents with Supervisor: {student.supervisor || 'N/A'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {documentsToShow && documentsToShow.length > 0 ? (
            <Card className="w-full">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold">
                    Proposal Documents
                  </h3>
                  <span className="text-sm text-gray-500">
                    Uploaded {formatTimeDifference(documentsToShow[0].uploadedAt)}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {documentsToShow.map((doc) => (
                    <div 
                      key={doc.id} 
                      className="border rounded-lg p-3 hover:bg-gray-50 transition"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-sm">
                          {doc.fieldName}
                        </span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => window.open(doc.fileUrl, '_blank')}
                      >
                        Open Document
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <p className="text-center text-gray-500">
              No proposal documents available
            </p>
          )}

          {onReview && (
            <div className="flex justify-end space-x-2 mt-4">
              <Button 
                variant="destructive"
                onClick={() => onReview()}
              >
                Review Proposal
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProposalDocumentsModal;