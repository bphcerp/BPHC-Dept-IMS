import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Clock, 
  FileText, 
  Search, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Calendar,
  User,
  Filter
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PendingSignature {
  id: string;
  documentTitle: string;
  requesterName: string;
  requesterEmail: string;
  requestedAt: Date;
  dueDate?: Date;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "viewed" | "signed" | "declined";
  fieldType: "signature" | "date" | "text";
  description?: string;
}

const PendingSignatures: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("pending");

  // Mock data for pending signatures
  const mockSignatures: PendingSignature[] = [
    {
      id: "1",
      documentTitle: "Employment Agreement - John Doe",
      requesterName: "HR Department",
      requesterEmail: "hr@university.edu",
      requestedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      priority: "high",
      status: "pending",
      fieldType: "signature",
      description: "Please review and sign the employment agreement",
    },
    {
      id: "2",
      documentTitle: "Research Collaboration Agreement",
      requesterName: "Dr. Sarah Wilson",
      requesterEmail: "sarah.wilson@university.edu",
      requestedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      priority: "medium",
      status: "viewed",
      fieldType: "signature",
      description: "Collaboration agreement for the AI research project",
    },
    {
      id: "3",
      documentTitle: "Course Evaluation Form",
      requesterName: "Academic Office",
      requesterEmail: "academic@university.edu",
      requestedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      priority: "low",
      status: "pending",
      fieldType: "date",
      description: "Please provide your evaluation date",
    },
    {
      id: "4",
      documentTitle: "Budget Approval Request",
      requesterName: "Finance Department",
      requesterEmail: "finance@university.edu",
      requestedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      priority: "urgent",
      status: "pending",
      fieldType: "signature",
      description: "Urgent: Budget approval needed for Q1 expenses",
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800 border-red-200";
      case "high": return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "signed": return "bg-green-100 text-green-800";
      case "declined": return "bg-red-100 text-red-800";
      case "viewed": return "bg-blue-100 text-blue-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "signed": return <CheckCircle className="w-4 h-4" />;
      case "declined": return <XCircle className="w-4 h-4" />;
      case "viewed": return <Eye className="w-4 h-4" />;
      case "pending": return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getFieldTypeIcon = (type: string) => {
    switch (type) {
      case "signature": return "✍️";
      case "date": return "📅";
      case "text": return "📝";
      default: return "📄";
    }
  };

  const filteredSignatures = mockSignatures.filter(sig => {
    const matchesSearch = sig.documentTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sig.requesterName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === "all" || sig.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const tabCounts = {
    all: mockSignatures.length,
    pending: mockSignatures.filter(s => s.status === "pending").length,
    viewed: mockSignatures.filter(s => s.status === "viewed").length,
    signed: mockSignatures.filter(s => s.status === "signed").length,
    declined: mockSignatures.filter(s => s.status === "declined").length,
  };

  const handleSignDocument = (id: string) => {
    // Navigate to signing interface
    console.log(`Signing document ${id}`);
  };

  const handleDeclineDocument = (id: string) => {
    // Handle document decline
    console.log(`Declining document ${id}`);
  };

  return (
    <div className="container mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Pending Signatures</h1>
      </div>

      {/* Search and Filter */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by document title or requester..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">
            All ({tabCounts.all})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({tabCounts.pending})
          </TabsTrigger>
          <TabsTrigger value="viewed">
            Viewed ({tabCounts.viewed})
          </TabsTrigger>
          <TabsTrigger value="signed">
            Signed ({tabCounts.signed})
          </TabsTrigger>
          <TabsTrigger value="declined">
            Declined ({tabCounts.declined})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredSignatures.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No signatures found</h3>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredSignatures.map(signature => (
                <Card key={signature.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <span className="text-2xl">{getFieldTypeIcon(signature.fieldType)}</span>
                          {signature.documentTitle}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            From: {signature.requesterName}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {formatDistanceToNow(signature.requestedAt, { addSuffix: true })}
                          </div>
                          {signature.dueDate && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              Due: {formatDistanceToNow(signature.dueDate, { addSuffix: true })}
                            </div>
                          )}
                        </CardDescription>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(signature.priority)}>
                          {signature.priority === "urgent" && <AlertTriangle className="w-3 h-3 mr-1" />}
                          {signature.priority.toUpperCase()}
                        </Badge>
                        <Badge className={getStatusColor(signature.status)}>
                          {getStatusIcon(signature.status)}
                          {signature.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  {signature.description && (
                    <CardContent className="pt-0 pb-3">
                      <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
                        {signature.description}
                      </p>
                    </CardContent>
                  )}

                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {signature.requesterName.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{signature.requesterName}</p>
                          <p className="text-xs text-muted-foreground">{signature.requesterEmail}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </Button>
                        
                        {signature.status === "pending" || signature.status === "viewed" ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeclineDocument(signature.id)}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Decline
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSignDocument(signature.id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Sign
                            </Button>
                          </>
                        ) : signature.status === "signed" ? (
                          <Button variant="outline" size="sm">
                            <FileText className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        ) : (
                          <Badge variant="outline">Declined</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PendingSignatures;
