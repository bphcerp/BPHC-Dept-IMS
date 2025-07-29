import { useEffect, useState } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/Auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, ArrowLeft } from "lucide-react";
import api from "@/lib/axios-instance";
import { Patent } from "../../components/patent/PatentTable";

export default function PatentDetails() {
  const { id } = useParams<{ id: string }>();
  const [patent, setPatent] = useState<Patent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { authState, checkAccess } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/patent/${id}`)
      .then(res => setPatent(res.data as Patent))
      .catch(() => setError("Failed to load patent details"))
      .finally(() => setLoading(false));
  }, [id]);

  if (!authState) return <Navigate to="/" replace />;
  if (!checkAccess("patent:view-details")) return <Navigate to="/404" replace />;

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading patent details...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => navigate("/patent/view-your")} variant="outline">
          Back to Patents
        </Button>
      </div>
    </div>
  );
  
  if (!patent) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground mb-4">Patent not found</p>
        <Button onClick={() => navigate("/patent/view-your")} variant="outline">
          Back to Patents
        </Button>
      </div>
    </div>
  );

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Not specified";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Granted":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Filed":
        return "bg-blue-100 text-blue-800";
      case "Abandoned":
        return "bg-red-100 text-red-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="w-full h-screen overflow-y-auto bg-background-faded">
      <div className="flex flex-col items-center gap-6 p-8">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/patent/view-your")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h2 className="text-3xl font-normal">Patent Details</h2>
          </div>
        </div>

        <div className="w-full max-w-4xl space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{patent.title}</span>
                <Badge className={getStatusColor(patent.status)}>
                  {patent.status}
                </Badge>
              </CardTitle>
              <CardDescription>
                Application Number: {patent.applicationNumber}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Inventors</h4>
                  <p className="text-sm">{patent.inventorsName}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Department</h4>
                  <p className="text-sm">{patent.department}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Campus</h4>
                  <p className="text-sm">{patent.campus}</p>
                </div>
                <div>
                  
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dates Information */}
          <Card>
            <CardHeader>
              <CardTitle>Important Dates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Filing Date</h4>
                  <p className="text-sm">{formatDate(patent.filingDate)}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Application Publication Date</h4>
                  <p className="text-sm">{formatDate(patent.applicationPublicationDate)}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Granted Date</h4>
                  <p className="text-sm">{formatDate(patent.grantedDate)}</p>
                </div>
                <div>
                  
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Years */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Years</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Filing FY</h4>
                  <p className="text-sm">{patent.filingFY}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Filing AY</h4>
                  <p className="text-sm">{patent.filingAY}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Published AY</h4>
                  <p className="text-sm">{patent.publishedAY || "Not specified"}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Published FY</h4>
                  <p className="text-sm">{patent.publishedFY || "Not specified"}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Granted FY</h4>
                  <p className="text-sm">{patent.grantedFY || "Not specified"}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Granted AY</h4>
                  <p className="text-sm">{patent.grantedAY || "Not specified"}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Granted CY</h4>
                  <p className="text-sm">{patent.grantedCY || "Not specified"}</p>
                </div>
              </div>
            </CardContent>
          </Card>



          {/* Links */}
          {(patent.grantedPatentCertificateLink || patent.applicationPublicationLink || patent.form01Link) && (
            <Card>
              <CardHeader>
                <CardTitle>Links</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {patent.grantedPatentCertificateLink && (
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground">Granted Patent Certificate</h4>
                      <a
                        href={patent.grantedPatentCertificateLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        View Link <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                  {patent.applicationPublicationLink && (
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground">Application Publication</h4>
                      <a
                        href={patent.applicationPublicationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        View Link <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                  {patent.form01Link && (
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground">Form 01</h4>
                      <a
                        href={patent.form01Link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        View Link <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">

                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Created</h4>
                  <p className="text-sm">{formatDate(patent.createdAt)}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Last Updated</h4>
                  <p className="text-sm">{formatDate(patent.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 