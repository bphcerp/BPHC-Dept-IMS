import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  FileText, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Trash2, 
  Send,
  PenTool,
  Calendar,
  Type
} from "lucide-react";
import { DocumentData } from "@/views/Signing/Dashboard";
import { formatDistanceToNow } from "date-fns";

interface DocumentListProps {
  documents: DocumentData[];
  onDocumentSelect: (document: DocumentData) => void;
  onDocumentDelete: (documentId: string) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onDocumentSelect,
  onDocumentDelete,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-gray-100 text-gray-800";
      case "sent": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft": return <PenTool className="w-3 h-3" />;
      case "sent": return <Send className="w-3 h-3" />;
      case "completed": return <CheckCircle className="w-3 h-3" />;
      case "cancelled": return <XCircle className="w-3 h-3" />;
      default: return <FileText className="w-3 h-3" />;
    }
  };

  const getFieldTypeIcon = (type: string) => {
    switch (type) {
      case "signature": return <PenTool className="w-3 h-3 text-blue-600" />;
      case "date": return <Calendar className="w-3 h-3 text-green-600" />;
      case "text": return <Type className="w-3 h-3 text-orange-600" />;
      default: return <FileText className="w-3 h-3" />;
    }
  };

  const getSigningProgress = (doc: DocumentData) => {
    const totalSigners = doc.signers.length;
    const signedCount = doc.signers.filter(s => s.status === "signed").length;
    return { total: totalSigners, signed: signedCount };
  };

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No documents yet</h3>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Documents</h2>
        </div>
        <Badge variant="outline">
          {documents.length} document{documents.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      <div className="grid gap-4">
        {documents.map(document => {
          const progress = getSigningProgress(document);
          
          return (
            <Card key={document.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FileText className="w-5 h-5" />
                      {document.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Badge className={getStatusColor(document.status)}>
                        {getStatusIcon(document.status)}
                        {document.status}
                      </Badge>
                      <span>•</span>
                      <span>
                        Updated {formatDistanceToNow(document.updatedAt, { addSuffix: true })}
                      </span>
                    </CardDescription>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDocumentSelect(document)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDocumentDelete(document.id!)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Document Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">{document.fields.length}</div>
                    <div className="text-xs text-muted-foreground">Fields</div>
                    <div className="flex justify-center gap-1">
                      {document.fields.slice(0, 3).map(field => (
                        <div key={field.id}>
                          {getFieldTypeIcon(field.type)}
                        </div>
                      ))}
                      {document.fields.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{document.fields.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">{document.signers.length}</div>
                    <div className="text-xs text-muted-foreground">Signers</div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">
                      {progress.total > 0 ? Math.round((progress.signed / progress.total) * 100) : 0}%
                    </div>
                    <div className="text-xs text-muted-foreground">Complete</div>
                    {progress.total > 0 && (
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-green-600 h-1.5 rounded-full transition-all"
                          style={{ width: `${(progress.signed / progress.total) * 100}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Signers List */}
                {document.signers.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Signers
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {document.signers.map(signer => (
                        <div
                          key={signer.id}
                          className="flex items-center gap-2 px-2 py-1 bg-muted rounded text-sm"
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {signer.name.split(" ").map(n => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span>{signer.name.split(" ")[0]}</span>
                          {signer.status === "signed" && (
                            <CheckCircle className="w-3 h-3 text-green-600" />
                          )}
                          {signer.status === "pending" && (
                            <Clock className="w-3 h-3 text-yellow-600" />
                          )}
                          {signer.status === "declined" && (
                            <XCircle className="w-3 h-3 text-red-600" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  {document.status === "draft" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDocumentSelect(document)}
                      >
                        <PenTool className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      {document.signers.length > 0 && document.fields.length > 0 && (
                        <Button
                          size="sm"
                          onClick={() => {
                            // This would trigger sending the document for signing
                            onDocumentSelect(document);
                          }}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Send for Signing
                        </Button>
                      )}
                    </>
                  )}
                  
                  {document.status === "sent" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDocumentSelect(document)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Track Progress
                    </Button>
                  )}
                  
                  {document.status === "completed" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // This would trigger PDF download
                        console.log("Download completed document");
                      }}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
