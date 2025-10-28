import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Plus, Mail, Trash2, CheckCircle, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Signer, SignatureField } from "@/views/Signing/Dashboard";

interface SignerManagementProps {
  signers: Signer[];
  onSignersUpdate: (signers: Signer[]) => void;
  fields: SignatureField[];
  onFieldUpdate: (fieldId: string, updates: Partial<SignatureField>) => void;
  disabled?: boolean;
}

export const SignerManagement: React.FC<SignerManagementProps> = ({
  signers,
  onSignersUpdate,
  fields,
  onFieldUpdate,
  disabled = false,
}) => {
  const [newSignerEmail, setNewSignerEmail] = useState("");
  const [searchResults, setSearchResults] = useState<Signer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Mock user search function
  const searchUsers = async (email: string): Promise<Signer[]> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock search results
    const mockUsers: Omit<Signer, "id" | "status" | "signedAt">[] = [
      { email: "john.doe@university.edu", name: "John Doe", role: "Professor", department: "Computer Science" },
      { email: "jane.smith@university.edu", name: "Jane Smith", role: "Associate Professor", department: "Mathematics" },
      { email: "bob.wilson@university.edu", name: "Bob Wilson", role: "Assistant Professor", department: "Physics" },
    ];

    return mockUsers
      .filter(user => user.email.toLowerCase().includes(email.toLowerCase()) || 
                      user.name.toLowerCase().includes(email.toLowerCase()))
      .map(user => ({
        ...user,
        id: user.email,
        status: "pending" as const,
      }));
  };

  // Debounced search effect
  useEffect(() => {
    if (newSignerEmail.length < 3) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchUsers(newSignerEmail);
        setSearchResults(results.filter(user => !signers.some(s => s.email === user.email)));
      } catch (error) {
        console.error("Search error:", error);
        toast.error("Failed to search users");
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [newSignerEmail, signers]);

  const handleAddSigner = (user: Signer) => {
    const newSigner: Signer = {
      ...user,
      id: Date.now().toString(),
      status: "pending",
    };

    onSignersUpdate([...signers, newSigner]);
    setNewSignerEmail("");
    setSearchResults([]);
    setShowAddForm(false);
    toast.success(`${user.name} added as signer`);
  };

  const handleRemoveSigner = (signerId: string) => {
    const signer = signers.find(s => s.id === signerId);
    if (!signer) return;

    // Unassign fields from this signer
    fields.forEach(field => {
      if (field.assignedUserId === signerId) {
        onFieldUpdate(field.id, { assignedUserId: undefined });
      }
    });

    onSignersUpdate(signers.filter(s => s.id !== signerId));
    toast.success(`${signer.name} removed from signers`);
  };

  const handleFieldAssignment = (fieldId: string, signerId: string | undefined) => {
    onFieldUpdate(fieldId, { assignedUserId: signerId });
    
    if (signerId) {
      const signer = signers.find(s => s.id === signerId);
      const field = fields.find(f => f.id === fieldId);
      if (signer && field) {
        toast.success(`${field.type} field assigned to ${signer.name}`);
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "signed": return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "pending": return <Clock className="w-4 h-4 text-yellow-600" />;
      case "declined": return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "signed": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "declined": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Signers ({signers.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Signer */}
        {!showAddForm ? (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowAddForm(true)}
            disabled={disabled}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Signer
          </Button>
        ) : (
          <div className="space-y-3">
            <div>
              <Label htmlFor="signer-email">Search by email or name</Label>
              <Input
                id="signer-email"
                placeholder="Type to search users..."
                value={newSignerEmail}
                onChange={(e) => setNewSignerEmail(e.target.value)}
                disabled={disabled}
              />
            </div>

            {/* Search Results */}
            {isSearching && (
              <div className="text-center py-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto"></div>
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {searchResults.map(user => (
                  <div
                    key={user.email}
                    className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-accent"
                    onClick={() => handleAddSigner(user)}
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {user.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">{user.name}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {user.role}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowAddForm(false);
                  setNewSignerEmail("");
                  setSearchResults([]);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Current Signers */}
        {signers.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="font-medium">Current Signers</h4>
              {signers.map(signer => (
                <div key={signer.id} className="space-y-2 p-3 border rounded">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {signer.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">{signer.name}</div>
                        <div className="text-xs text-muted-foreground">{signer.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(signer.status)}>
                        {getStatusIcon(signer.status)}
                        {signer.status}
                      </Badge>
                      {!disabled && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSigner(signer.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {signer.role} • {signer.department}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Field Assignment */}
        {signers.length > 0 && fields.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="font-medium">Field Assignments</h4>
              <div className="space-y-2">
                {fields.map(field => (
                  <div key={field.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded ${
                        field.type === "signature" ? "bg-blue-500" :
                        field.type === "date" ? "bg-green-500" : "bg-orange-500"
                      }`}></div>
                      <span className="text-sm capitalize">{field.type} Field</span>
                    </div>
                    <Select
                      value={field.assignedUserId || "unassigned"}
                      onValueChange={(value) => 
                        handleFieldAssignment(field.id, value === "unassigned" ? undefined : value)
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {signers.map(signer => (
                          <SelectItem key={signer.id} value={signer.id}>
                            {signer.name.split(" ")[0]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

      </CardContent>
    </Card>
  );
};
