import { handoutSchemas } from "lib";

export interface Handout {
  id: string;
  courseCode: string;
  courseName: string;
  category: "FD" | "HD"; // New property
  reviewerName: string;
  submittedOn: string;
  status: handoutSchemas.HandoutStatus;
}

export const handoutStatuses = [
  "review pending",
  "approved",
  "revision requested",
  "reviewed",
  "notsubmitted",
];

export const STATUS_COLORS: Record<string, string> = {
  "review pending": "text-yellow-600 bg-yellow-100 p-3",
  reviewed: "text-green-600 bg-green-100 p-3",
  notsubmitted: "text-red-600 bg-red-100 p-3 ",
};

export interface DCAHandout {
  id: string;
  courseName: string;
  courseCode: string;
  category: string;
  instructor: string;
  submittedOn: string;
  status: string;
}

export interface HandoutsDCAcon {
  id: string;
  courseName: string;
  courseCode: string;
  category: string;
  instructor: string;
  reviewer: string;
  submittedOn: string;
  status: string;
}
