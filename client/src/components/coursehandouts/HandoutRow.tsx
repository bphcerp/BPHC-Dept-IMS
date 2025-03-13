import React from "react";
import { getStatusIcon, getStatusColor } from "./handoutUtils";

interface HandoutRowProps {
  handoutName: string;
  professorName: string;
  status: string;
}

function HandoutRow({ handoutName, professorName, status }: HandoutRowProps) {

  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        {getStatusIcon(status)}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">{handoutName}</h2>
            <p className="text-sm text-gray-500">| {professorName}</p>
          </div>
          <p className={`text-sm font-semibold ${getStatusColor(status)}`}>
            {status}
          </p>
        </div>
      </div>
    </div>
  );
}

export default HandoutRow;
