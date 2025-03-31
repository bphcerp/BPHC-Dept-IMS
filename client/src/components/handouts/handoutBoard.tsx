import React, { useState, useMemo } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Link } from "react-router-dom";
import { Clock, CheckCircle, XCircle, AlertCircle, FileText } from "lucide-react";
import { handoutSchemas } from "lib";

export interface Handout {
  id: string;
  courseName: string;
  courseCode: string;
  professorName?: string;
  submittedOn: string;
  status: handoutSchemas.HandoutStatus;
}

const STATUS_CONFIG: Record<string, { 
  color: string; 
  bg: string; 
  icon: React.ReactNode 
}> = {
  pending: { 
    color: "text-amber-700", 
    bg: "bg-amber-100",
    icon: <Clock className="h-4 w-4" />
  },
  approved: { 
    color: "text-green-700", 
    bg: "bg-green-100",
    icon: <CheckCircle className="h-4 w-4" />
  },
  rejected: { 
    color: "text-red-700", 
    bg: "bg-red-100", 
    icon: <XCircle className="h-4 w-4" />
  },
  notsubmitted: { 
    color: "text-blue-700", 
    bg: "bg-blue-50", 
    icon: <AlertCircle className="h-4 w-4" />
  },
};

interface HandoutsBoardProps {
  handouts: Handout[];
}

const HandoutsBoard: React.FC<HandoutsBoardProps> = ({ handouts }) => {
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  
  const filteredHandouts = useMemo(() => {
    if (selectedStatuses.length === 0) {
      return handouts; 
    }
    return handouts.filter(handout => selectedStatuses.includes(handout.status));
  }, [handouts, selectedStatuses]);

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <ToggleGroup
          type="multiple"
          value={selectedStatuses}
          onValueChange={setSelectedStatuses}
          className="flex flex-wrap gap-2 bg-transparent"
        >
          {handoutSchemas.handoutStatuses.map((status) => {
            const statusConfig = STATUS_CONFIG[status];
            return (
              <ToggleGroupItem
                key={status}
                value={status}
                className={`border capitalize ${
                  selectedStatuses.includes(status)
                    ? "bg-blue-100 text-blue-700 border-current"
                    : ""
                }`}
              >
                <span className="flex items-center gap-1">
                  {statusConfig.icon}
                  {status}
                </span>
              </ToggleGroupItem>
            );
          })}
        </ToggleGroup>
      </div>

      {filteredHandouts.length > 0 ? (
        <div className="space-y-4">
          {filteredHandouts.map((handout) => (
            <Card key={handout.id} className="w-full shadow-sm hover:shadow-md transition-shadow mb-4">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-base">{handout.courseCode}</h3>
                    <p className="text-sm text-gray-600">{handout.courseName}</p>
                  </div>
                  <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium uppercase ${STATUS_CONFIG[handout.status].color} ${STATUS_CONFIG[handout.status].bg}`}>
                    {STATUS_CONFIG[handout.status].icon}
                    <span>{handout.status}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="py-2">
                <div className="flex justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-500">Reviewer</p>
                    <p className="text-sm">{handout.professorName || "Unassigned"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-500">Submitted On</p>
                    <p className="text-sm">{new Date(handout.submittedOn).toLocaleDateString()}</p>
                  </div>
                  <div>
                    {handout.status === "pending" || handout.status === "notsubmitted" ? (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="hover:bg-primary hover:text-white"
                      >
                        <Link to={`/handout/dca/review/${handout.id}`}>Review</Link>
                      </Button>
                    ) : (
                      <div className="text-xs text-blue-600">No actions available</div>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter />
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-10 text-center bg-blue-50 rounded-lg border border-dashed border-blue-200 h-64">
          <FileText className="h-12 w-12 text-blue-300 mb-4" />
          <h3 className="text-lg font-medium text-blue-900 mb-1">No handouts found</h3>
          <p className="text-sm text-blue-700 max-w-sm">
            No handouts match your current filter criteria. Try selecting different status filters or check back later.
          </p>
        </div>
      )}
    </div>
  );
};

export default HandoutsBoard;
