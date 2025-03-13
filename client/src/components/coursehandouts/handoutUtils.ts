import React from "react";
import { CircleCheckBig, CircleAlert, RefreshCw } from "lucide-react";

export function getStatusIcon(status: string) {
  switch (status) {
    case "Approved":
      return React.createElement(CircleCheckBig, { size: 35, fill: "green", color: "white" });
    case "Rejected":
      return React.createElement(CircleAlert, { size: 35, fill: "red", color: "white" });
    case "Pending":
      return React.createElement(RefreshCw, { size: 35, fill: "orange", color: "white" });
    default:
      return null;
  }
}

export function getStatusColor(status: string) {
  switch (status) {
    case "Approved":
      return "text-green-600";
    case "Rejected":
      return "text-red-600";
    case "Pending":
      return "text-yellow-600";
    default:
      return "text-gray-600";
  }
}
