import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ZoomIn, ZoomOut, RotateCw, Download } from "lucide-react";
import { SignatureField } from "@/views/Signing/Dashboard";

interface PDFViewerProps {
  file?: File;
  fileUrl?: string;
  fields: SignatureField[];
  onFieldUpdate: (fieldId: string, updates: Partial<SignatureField>) => void;
  onFieldDelete: (fieldId: string) => void;
  onFieldSign?: (fieldId: string) => void;
  readOnly?: boolean;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  file,
  fileUrl,
  fields,
  onFieldUpdate,
  onFieldDelete,
  onFieldSign,
  readOnly = false,
}) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [dragField, setDragField] = useState<{
    fieldId: string;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  } | null>(null);

  useEffect(() => {
    if (!file && !fileUrl) {
      setPdfUrl(null);
      return;
    }

    setIsLoading(true);
    
    // Handle file URL creation for local files
    if (file) {
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      setTimeout(() => {
        setIsLoading(false);
        setTotalPages(3); // Mock total pages for demo
        setError(null);
      }, 1000);
      
      return () => {
        URL.revokeObjectURL(url);
        setPdfUrl(null);
      };
    } else if (fileUrl) {
      setPdfUrl(fileUrl);
      setTimeout(() => {
        setIsLoading(false);
        setTotalPages(3); // Mock total pages for demo
        setError(null);
      }, 1000);
    }
  }, [file, fileUrl]);

  const handleFieldClick = (fieldId: string, event: React.MouseEvent) => {
    if (readOnly) return;
    event.stopPropagation();
    setSelectedField(selectedField === fieldId ? null : fieldId);
  };

  const handleFieldMouseDown = (fieldId: string, event: React.MouseEvent) => {
    if (readOnly) return;
    
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;

    setDragField({
      fieldId,
      startX: event.clientX,
      startY: event.clientY,
      initialX: field.position.x,
      initialY: field.position.y,
    });
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!dragField || readOnly) return;

    const deltaX = event.clientX - dragField.startX;
    const deltaY = event.clientY - dragField.startY;

    const newX = Math.max(0, Math.min(595 - 50, dragField.initialX + deltaX)); // Keep within PDF bounds
    const newY = Math.max(0, Math.min(842 - 50, dragField.initialY + deltaY)); // Keep within PDF bounds

    onFieldUpdate(dragField.fieldId, {
      position: { x: newX, y: newY },
    });
  };

  const handleMouseUp = () => {
    setDragField(null);
  };

  const handleFieldResize = (fieldId: string, newSize: { width: number; height: number }) => {
    if (readOnly) return;
    onFieldUpdate(fieldId, { size: newSize });
  };

  const handleFieldValueUpdate = (fieldId: string, value: string) => {
    if (readOnly) return;
    onFieldUpdate(fieldId, { value });
  };

  const getFieldTypeColor = (type: string) => {
    switch (type) {
      case "signature": return "bg-blue-500/20 border-blue-500";
      case "date": return "bg-green-500/20 border-green-500";
      case "text": return "bg-orange-500/20 border-orange-500";
      default: return "bg-gray-500/20 border-gray-500";
    }
  };

  const getFieldTypeLabel = (type: string) => {
    switch (type) {
      case "signature": return "Signature";
      case "date": return "Date";
      case "text": return "Text";
      default: return "Field";
    }
  };

  if (error) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-red-500 mb-2">Error loading PDF</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p>Loading PDF...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoom(Math.max(25, zoom - 25))}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium min-w-[60px] text-center">
            {zoom}%
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoom(Math.min(200, zoom + 25))}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div 
        ref={viewerRef}
        className="flex-1 relative bg-gray-100 overflow-auto"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={() => setSelectedField(null)}
      >
        {/* PDF Display Container */}
        <div className="relative mx-auto my-4">
          {pdfUrl ? (
            <div className="relative bg-white shadow-lg" style={{
              width: `${(595 * zoom) / 100}px`, 
              height: `${(842 * zoom) / 100}px`,
            }}>
              <iframe
                src={`${pdfUrl}#page=${currentPage}&zoom=${zoom}`}
                className="w-full h-full border-0"
                title="PDF Viewer"
              />
            </div>
          ) : (
            /* Fallback Mock PDF Display */
            <div 
              className="relative bg-white shadow-lg"
              style={{
                width: `${(595 * zoom) / 100}px`, // A4 width in pixels
                height: `${(842 * zoom) / 100}px`, // A4 height in pixels
              }}
            >
              {/* Mock PDF Content */}
              <div className="absolute inset-4 border border-gray-200">
                <div className="p-4 space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-full"></div>
                    <div className="h-4 bg-gray-100 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-100 rounded w-4/5"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-full"></div>
                    <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Signature Fields Overlay - Positioned absolutely over the PDF */}
        <div 
          className="absolute top-4 left-1/2 transform -translate-x-1/2"
          style={{
            width: `${(595 * zoom) / 100}px`, 
            height: `${(842 * zoom) / 100}px`,
            pointerEvents: 'none', // Allow interaction with fields but not the container
          }}
        >
          {fields
            .filter(field => field.page === currentPage)
            .map(field => (
              <div
                key={field.id}
                className={`absolute border-2 border-dashed cursor-move ${getFieldTypeColor(field.type)} ${
                  selectedField === field.id ? "ring-2 ring-primary" : ""
                }`}
                style={{
                  left: `${field.position.x}px`,
                  top: `${field.position.y}px`,
                  width: `${field.size.width}px`,
                  height: `${field.size.height}px`,
                  pointerEvents: 'auto', // Enable interaction with individual fields
                }}
                onClick={(e) => handleFieldClick(field.id, e)}
                onMouseDown={(e) => handleFieldMouseDown(field.id, e)}
              >
                <Badge
                  variant="secondary"
                  className="absolute -top-6 left-0 text-xs"
                >
                  {getFieldTypeLabel(field.type)}
                </Badge>
                
                {field.assignedUserId && (
                  <Badge
                    variant="outline"
                    className="absolute -top-6 right-0 text-xs"
                  >
                    Assigned
                  </Badge>
                )}

                <div className="flex items-center justify-center h-full text-xs font-medium">
                  {field.type === "signature" && field.value ? (
                    <img 
                      src={field.value} 
                      alt="Signature" 
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : field.type === "signature" && !field.value && onFieldSign ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onFieldSign(field.id);
                      }}
                      className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                    >
                      Sign Here
                    </button>
                  ) : field.type === "date" ? (
                    <input
                      type="date"
                      value={field.value || ""}
                      onChange={(e) => handleFieldValueUpdate(field.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full h-full text-xs text-center border-0 bg-transparent focus:outline-none focus:bg-white focus:border focus:border-green-500 rounded"
                      placeholder="Select date"
                      disabled={readOnly}
                    />
                  ) : field.type === "text" ? (
                    <input
                      type="text"
                      value={field.value || ""}
                      onChange={(e) => handleFieldValueUpdate(field.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full h-full text-xs text-center border-0 bg-transparent focus:outline-none focus:bg-white focus:border focus:border-orange-500 rounded px-1"
                      placeholder={field.placeholder || "Enter text"}
                      disabled={readOnly}
                    />
                  ) : (
                    <span className="opacity-60">
                      {field.placeholder || `${getFieldTypeLabel(field.type)} Field`}
                    </span>
                  )}
                </div>

                {/* Resize handles */}
                {selectedField === field.id && !readOnly && (
                  <>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary border border-white cursor-se-resize"></div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute -top-8 -right-8 h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onFieldDelete(field.id);
                      }}
                    >
                      ×
                    </Button>
                  </>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
