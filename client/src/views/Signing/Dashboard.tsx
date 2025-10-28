import React, { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, Users, PenTool, Calendar, Type, Download, Send, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PDFViewer } from "@/components/signing/PDFViewer";
import { SignerManagement } from "@/components/signing/SignerManagement";
import { FieldToolbar } from "@/components/signing/FieldToolbar";
import { DocumentList } from "@/components/signing/DocumentList";
import { SignaturePad } from "@/components/signing/SignaturePad";

export interface SignatureField {
  id: string;
  type: "signature" | "date" | "text";
  position: { x: number; y: number };
  size: { width: number; height: number };
  page: number;
  assignedUserId?: string;
  value?: string;
  placeholder?: string;
}

export interface Signer {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string;
  status: "pending" | "signed" | "declined";
  signedAt?: Date;
}

export interface DocumentData {
  id?: string;
  title: string;
  fileUrl?: string;
  file?: File;
  status: "draft" | "sent" | "completed" | "cancelled";
  signers: Signer[];
  fields: SignatureField[];
  createdAt: Date;
  updatedAt: Date;
}

const SigningDashboard: React.FC = () => {
  const [currentDocument, setCurrentDocument] = useState<DocumentData | null>(null);
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [activeTab, setActiveTab] = useState("upload");
  const [isSignaturePadOpen, setIsSignaturePadOpen] = useState(false);
  const [currentSigningField, setCurrentSigningField] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.type === "application/pdf") {
      const newDocument: DocumentData = {
        id: Date.now().toString(), // Generate a simple ID
        title: file.name.replace(".pdf", ""),
        file,
        status: "draft",
        signers: [],
        fields: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setCurrentDocument(newDocument);
      setDocuments(prev => [...prev, newDocument]); // Auto-save to documents list
      setActiveTab("edit");
      toast.success("PDF uploaded successfully");
    } else {
      toast.error("Please upload a PDF file");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"]
    },
    multiple: false,
  });

  const handleSaveDocument = () => {
    if (currentDocument) {
      const updatedDoc = { 
        ...currentDocument, 
        id: currentDocument.id || Date.now().toString(),
        updatedAt: new Date() 
      };
      
      setDocuments(prev => {
        const existing = prev.find(doc => doc.id === updatedDoc.id);
        if (existing) {
          return prev.map(doc => doc.id === updatedDoc.id ? updatedDoc : doc);
        } else {
          return [...prev, updatedDoc];
        }
      });
      
      setCurrentDocument(updatedDoc);
      toast.success("Document saved successfully");
    }
  };

  const handleSendForSigning = () => {
    if (!currentDocument) {
      toast.error("No document selected");
      return;
    }

    if (currentDocument.signers.length === 0) {
      toast.error("Please add at least one signer");
      return;
    }

    if (currentDocument.fields.length === 0) {
      toast.error("Please add at least one signature field");
      return;
    }

    const unassignedFields = currentDocument.fields.filter(field => !field.assignedUserId);
    if (unassignedFields.length > 0) {
      toast.error("Please assign all fields to signers");
      return;
    }

    const updatedDoc = { 
      ...currentDocument, 
      status: "sent" as const,
      updatedAt: new Date() 
    };
    
    setDocuments(prev => 
      prev.map(doc => doc.id === updatedDoc.id ? updatedDoc : doc)
    );
    setCurrentDocument(updatedDoc);
    toast.success("Document sent for signing!");
  };

  const handleFieldAdd = (field: Omit<SignatureField, "id">) => {
    if (currentDocument) {
      const newField: SignatureField = {
        ...field,
        id: Date.now().toString(),
      };
      
      const updatedDoc = {
        ...currentDocument,
        fields: [...currentDocument.fields, newField],
        updatedAt: new Date(),
      };
      
      setCurrentDocument(updatedDoc);
    }
  };

  const handleFieldUpdate = (fieldId: string, updates: Partial<SignatureField>) => {
    if (currentDocument) {
      const updatedDoc = {
        ...currentDocument,
        fields: currentDocument.fields.map(field =>
          field.id === fieldId ? { ...field, ...updates } : field
        ),
        updatedAt: new Date(),
      };
      
      setCurrentDocument(updatedDoc);
    }
  };

  const handleFieldDelete = (fieldId: string) => {
    if (currentDocument) {
      const updatedDoc = {
        ...currentDocument,
        fields: currentDocument.fields.filter(field => field.id !== fieldId),
        updatedAt: new Date(),
      };
      
      setCurrentDocument(updatedDoc);
    }
  };

  const handleSignersUpdate = (signers: Signer[]) => {
    if (currentDocument) {
      const updatedDoc = {
        ...currentDocument,
        signers,
        updatedAt: new Date(),
      };
      
      setCurrentDocument(updatedDoc);
    }
  };

  const handleDocumentSelect = (document: DocumentData) => {
    setCurrentDocument(document);
    setActiveTab("edit");
  };

  const handleNewDocument = () => {
    setCurrentDocument(null);
    setActiveTab("upload");
  };

  const handleFieldSign = (fieldId: string) => {
    setCurrentSigningField(fieldId);
    setIsSignaturePadOpen(true);
  };

  const handleSignatureSave = (signatureDataUrl: string) => {
    if (currentDocument && currentSigningField) {
      const updatedDoc = {
        ...currentDocument,
        fields: currentDocument.fields.map(field =>
          field.id === currentSigningField ? { ...field, value: signatureDataUrl } : field
        ),
        updatedAt: new Date(),
      };
      
      setCurrentDocument(updatedDoc);
      
      // Update the document in the documents list if it exists
      setDocuments(prev => {
        const existing = prev.find(doc => doc.id === updatedDoc.id);
        if (existing) {
          return prev.map(doc => doc.id === updatedDoc.id ? updatedDoc : doc);
        }
        return prev;
      });
      
      toast.success("Signature added successfully");
    }
    setCurrentSigningField(null);
  };

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col">
        <header className="border-b p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">PDF Signing Dashboard</h1>
              <p className="text-muted-foreground">
                Upload, edit, and manage document signatures
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleNewDocument}>
                <Upload className="w-4 h-4 mr-2" />
                New Document
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload">Upload Document</TabsTrigger>
              <TabsTrigger value="edit" disabled={!currentDocument}>
                Edit & Sign
              </TabsTrigger>
              <TabsTrigger value="documents">My Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Upload PDF Document
                  </CardTitle>
                  <CardDescription>
                    Upload a PDF document to add signature fields and send for signing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                    }`}
                  >
                    <input {...getInputProps()} ref={fileInputRef} />
                    <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    {isDragActive ? (
                      <p className="text-lg">Drop the PDF here...</p>
                    ) : (
                      <div>
                        <p className="text-lg mb-2">
                          Drag & drop a PDF here, or click to select
                        </p>
                        <p className="text-sm text-muted-foreground mb-3">
                          Only PDF files are accepted
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Create a demo document for testing
                            const demoDocument: DocumentData = {
                              id: Date.now().toString(),
                              title: "Sample Document",
                              status: "draft",
                              signers: [],
                              fields: [],
                              createdAt: new Date(),
                              updatedAt: new Date(),
                            };
                            setCurrentDocument(demoDocument);
                            setDocuments(prev => [...prev, demoDocument]);
                            setActiveTab("edit");
                            toast.success("Demo document loaded");
                          }}
                        >
                          Try Demo Document
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="edit" className="mt-4 h-full">
              {currentDocument ? (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
                  <div className="lg:col-span-3">
                    <Card className="h-full">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>{currentDocument.title}</CardTitle>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">
                                {currentDocument.status}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {currentDocument.fields.length} fields
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {currentDocument.signers.length} signers
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={handleSaveDocument}>
                              Save
                            </Button>
                            {currentDocument.status === "draft" && (
                              <Button 
                                onClick={handleSendForSigning}
                                disabled={
                                  currentDocument.signers.length === 0 || 
                                  currentDocument.fields.length === 0 ||
                                  currentDocument.fields.some(field => !field.assignedUserId)
                                }
                              >
                                <Send className="w-4 h-4 mr-2" />
                                Send for Signing
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="h-full">
                        <PDFViewer
                          file={currentDocument.file}
                          fileUrl={currentDocument.fileUrl}
                          fields={currentDocument.fields}
                          onFieldUpdate={handleFieldUpdate}
                          onFieldDelete={handleFieldDelete}
                          onFieldSign={handleFieldSign}
                          readOnly={currentDocument.status !== "draft"}
                        />
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    <FieldToolbar
                      onFieldAdd={handleFieldAdd}
                      disabled={currentDocument.status !== "draft"}
                    />
                    
                    <SignerManagement
                      signers={currentDocument.signers}
                      onSignersUpdate={handleSignersUpdate}
                      fields={currentDocument.fields}
                      onFieldUpdate={handleFieldUpdate}
                      disabled={currentDocument.status !== "draft"}
                    />
                  </div>
                </div>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg mb-2">No document selected</p>
                    <Button onClick={() => setActiveTab("upload")}>
                      Upload Document
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="documents" className="mt-4">
              <DocumentList
                documents={documents}
                onDocumentSelect={handleDocumentSelect}
                onDocumentDelete={(id) => {
                  setDocuments(prev => prev.filter(doc => doc.id !== id));
                  if (currentDocument?.id === id) {
                    setCurrentDocument(null);
                  }
                  toast.success("Document deleted");
                }}
              />
            </TabsContent>
          </Tabs>
        </main>
      </div>
      
      <SignaturePad
        isOpen={isSignaturePadOpen}
        onClose={() => {
          setIsSignaturePadOpen(false);
          setCurrentSigningField(null);
        }}
        onSave={handleSignatureSave}
      />
    </div>
  );
};

export default SigningDashboard;
