export interface Handout {
    id: string;
    courseCode: string;
    courseName: string;
    category: "FD" | "HD";  // New property
    reviewerName: string;
    submittedOn: string;
    status: "revision" | "pending" | "approved" | "not submitted";
  }
  
export const handoutStatuses = ["pending", "approved", "revision", "not submitted"];

export const STATUS_COLORS: Record<string, string> = {
    pending: "text-yellow-600",
    approved: "text-green-600",
    revision: "text-red-600",
    "not submitted": "text-gray-600",
};