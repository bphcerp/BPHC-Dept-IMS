import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(
  bytes: number,
  opts: {
    decimals?: number;
    sizeType?: "accurate" | "normal";
  } = {}
) {
  const { decimals = 0, sizeType = "normal" } = opts;

  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const accurateSizes = ["Bytes", "KiB", "MiB", "GiB", "TiB"];
  if (bytes === 0) return "0 Byte";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(decimals)} ${
    sizeType === "accurate"
      ? (accurateSizes[i] ?? "Bytes")
      : (sizes[i] ?? "Bytes")
  }`;
}
export const formatDateForInputLocal = (date?: Date | null): string => {
  if (!date) return "";

  // Pad numbers to ensure two digits (e.g., 9 becomes "09")
  const pad = (num: number) => num.toString().padStart(2, "0");

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1); 
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Added Color Mapping for Proposal Statuses
export const proposalStatusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800 border-gray-300",
  supervisor_review: "bg-blue-100 text-blue-800 border-blue-300",
  drc_review: "bg-purple-100 text-purple-800 border-purple-300",
  dac_review: "bg-indigo-100 text-indigo-800 border-indigo-300",
  dac_accepted: "bg-teal-100 text-teal-800 border-teal-300",
  seminar_pending: "bg-cyan-100 text-cyan-800 border-cyan-300",
  finalising_documents: "bg-lime-100 text-lime-800 border-lime-300",
  completed: "bg-green-100 text-green-800 border-green-300",
  supervisor_revert: "bg-yellow-100 text-yellow-800 border-yellow-300",
  drc_revert: "bg-orange-100 text-orange-800 border-orange-300",
  dac_revert: "bg-red-100 text-red-800 border-red-300",
  deleted: "bg-red-200 text-red-900 border-red-400 line-through",
};

export function getProposalStatusVariant(status: string): string {
  // Adding `border` class for consistency
  return cn(
    "border",
    proposalStatusColors[status] || "bg-gray-100 text-gray-800 border-gray-300"
  );
}

// Helper to format status text
export const formatStatus = (status: string) => {
  return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};
