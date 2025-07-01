import { useEffect, useState } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import api from "@/lib/axios-instance";
import { useAuth } from "@/hooks/Auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, DollarSign, Users, Building, FileText } from "lucide-react";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";

interface FieldDisplayProps {
  label: string;
  value?: string | number | null;
  icon?: React.ReactNode;
  isAmount?: boolean;
  isDate?: boolean;
}

interface CoPI {
  id: string;
  name: string;
  email: string;
  department?: string;
  campus?: string;
  affiliation?: string;
}

interface Project {
  id: string;
  title: string;
  piName: string;
  piEmail: string;
  fundingAgencyName: string;
  fundingAgencyNature: string;
  sanctionedAmount: number;
  capexAmount?: number;
  opexAmount?: number;
  manpowerAmount?: number;
  approvalDate: string;
  startDate: string;
  endDate: string;
  hasExtension: boolean;
  extensionDetails?: string;
  coPIs?: CoPI[];
}

const FieldDisplay = ({ label, value, icon, isAmount, isDate }: FieldDisplayProps) => {
  const formatValue = () => {
    if (value === null || value === undefined) return "Not specified";
    if (isAmount && typeof value === 'number') {
      return `₹${value.toLocaleString("en-IN")}`;
    }
    if (isDate && typeof value === 'string') {
      return format(new Date(value), "MMMM dd, yyyy");
    }
    if (label === "Nature of Funding Agency") {
      if (value === "public_sector") return "Public Sector";
      if (value === "private_sector") return "Private Sector";
    }
    return value.toString();
  };

  return (
    <div className="flex justify-evenly rounded-lg border p-4 shadow-sm">
      <div className="flex min-w-28 flex-1 flex-col gap-2">
        <div className="flex items-center gap-2">
          {icon}
          <strong className="text-base font-semibold text-muted-foreground">
            {label}
          </strong>
        </div>
        <div className="relative flex gap-2 overflow-clip overflow-ellipsis rounded-md border bg-gray-100 p-2">
          {formatValue()}
        </div>
      </div>
    </div>
  );
};

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { authState, checkAccess } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/project/${id}`)
      .then(res => setProject(res.data as Project))
      .catch(() => setError("Failed to load project details"))
      .finally(() => setLoading(false));
  }, [id]);

  if (!authState) return <Navigate to="/" replace />;
  if (!checkAccess("project:view-details")) return <Navigate to="/404" replace />;

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading project details...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => navigate("/project")} variant="outline">
          Back to Projects
        </Button>
      </div>
    </div>
  );
  
  if (!project) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground mb-4">Project not found</p>
        <Button onClick={() => navigate("/project")} variant="outline">
          Back to Projects
        </Button>
      </div>
    </div>
  );

  return (
    <div className="relative flex min-h-screen w-full max-w-4xl flex-col gap-6 p-8">
      <div className="flex items-center gap-4 self-start w-full">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/project/view")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="space-y-2">
        <h2 className="self-start text-3xl font-normal">
          {project.title}
        </h2>
        {project.hasExtension && (
          <Badge variant="outline" className="text-orange-600 border-orange-600">
            Extended
          </Badge>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <FieldDisplay 
          label="Project Title" 
          value={project.title} 
          icon={<FileText className="h-4 w-4 text-muted-foreground" />}
        />

        <FieldDisplay 
          label="Principal Investigator" 
          value={project.piName} 
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />

        <FieldDisplay 
          label="PI Email" 
          value={project.piEmail} 
        />

        {project.coPIs && project.coPIs.length > 0 && (
          <>
            <div className="text-lg font-semibold text-muted-foreground">Co-Principal Investigators</div>
            {project.coPIs.map((coPI: CoPI, index: number) => (
              <div key={index} className="space-y-2">
                <FieldDisplay 
                  label={`Co-PI ${index + 1} Name`} 
                  value={coPI.name} 
                  icon={<Users className="h-4 w-4 text-muted-foreground" />}
                />
                <FieldDisplay 
                  label={`Co-PI ${index + 1} Email`} 
                  value={coPI.email} 
                />
              </div>
            ))}
          </>
        )}

        <Separator />

        <div className="text-lg font-semibold text-muted-foreground">Funding Information</div>
        
        <FieldDisplay 
          label="Funding Agency" 
          value={project.fundingAgencyName} 
          icon={<Building className="h-4 w-4 text-muted-foreground" />}
        />

        <FieldDisplay 
          label="Nature of Funding Agency" 
          value={project.fundingAgencyNature} 
        />

        <FieldDisplay 
          label="Total Sanctioned Amount" 
          value={project.sanctionedAmount} 
          isAmount={true}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        />

        <Separator />

        <div className="text-lg font-semibold text-muted-foreground">Budget Breakdown</div>
        
        <FieldDisplay 
          label="CAPEX Amount" 
          value={project.capexAmount} 
          isAmount={true}
        />

        <FieldDisplay 
          label="OPEX Amount" 
          value={project.opexAmount} 
          isAmount={true}
        />

        <FieldDisplay 
          label="Manpower Amount" 
          value={project.manpowerAmount} 
          isAmount={true}
        />

        <Separator />

        <div className="text-lg font-semibold text-muted-foreground">Project Timeline</div>
        
        <FieldDisplay 
          label="Approval Date" 
          value={project.approvalDate} 
          isDate={true}
          icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
        />

        <FieldDisplay 
          label="Start Date" 
          value={project.startDate} 
          isDate={true}
          icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
        />

        <FieldDisplay 
          label="End Date" 
          value={project.endDate} 
          isDate={true}
          icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
        />

        {project.hasExtension && project.extensionDetails && (
          <FieldDisplay 
            label="Extension Details" 
            value={project.extensionDetails} 
          />
        )}
      </div>
    </div>
  );
} 