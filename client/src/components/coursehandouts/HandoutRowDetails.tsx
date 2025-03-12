import React from "react";
import HandoutRow from "./HandoutRow";
import { Button } from "@/components/ui/button";

interface HandoutRowWithDetailsProps {
  handoutName: string;
  professorName: string;
  status: string;
  onViewDetails: () => void;
}

const HandoutRowWithDetails = ({
  handoutName,
  professorName,
  status,
  onViewDetails,
}: HandoutRowWithDetailsProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-grow ">
        <HandoutRow
          handoutName={handoutName}
          professorName={professorName}
          status={status}
        />
      </div>
      <div>
        <Button variant="outline" size="sm" onClick={onViewDetails}>
          View Details
        </Button>
      </div>
    </div>
  );
};

export default HandoutRowWithDetails;
