export interface FacultyContribution {
  id: string;
  facultyEmail: string;
  designation: string;
  startDate: string;
  endDate: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}
