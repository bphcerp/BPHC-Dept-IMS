import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { CheckCircle, FileWarning } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FilePreviewData {
  label: string;
  fileName: string;
  isNew: boolean;
}

interface FinalThesisPreviewProps {
  files: FilePreviewData[];
  comments: string;
  onSubmit?: () => void;
  isSubmitting?: boolean;
}

export const FinalThesisPreview: React.FC<FinalThesisPreviewProps> = ({
  files,
  comments,
  onSubmit,
  isSubmitting,
}) => {
  return (
    <div className="space-y-4 py-4">
      <Card>
        <CardHeader>
          <CardTitle>Documents to be Submitted</CardTitle>
          <CardDescription>
            This is a list of documents that will be included in your
            submission.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li
                key={index}
                className="flex items-center justify-between rounded-md border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">{file.label}</p>
                  <p className="text-muted-foreground">{file.fileName}</p>
                </div>
                {file.fileName !== "Not uploaded" ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <FileWarning className="h-5 w-5 text-yellow-500" />
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      {comments && (
        <Card>
          <CardHeader>
            <CardTitle>Comments for Supervisor</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {comments}
            </p>
          </CardContent>
        </Card>
      )}
      {onSubmit && (
        <Button onClick={onSubmit} disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Submitting..." : "Submit to Supervisor"}
        </Button>
      )}
    </div>
  );
};
