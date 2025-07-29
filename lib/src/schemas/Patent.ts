import { z } from "zod";

const inventorSchema = z.object({
  name: z.string().min(1, "Inventor name is required"),
  email: z.string().email("Invalid email format").optional(),
});

export const patentSchema = z.object({
  applicationNumber: z.string().min(1, "Application Number is required"),
  inventorsName: z.string().min(1, "Inventors Name is required"),
  inventors: z.array(inventorSchema).optional(),
  department: z.string().min(1, "Department is required"),
  title: z.string().min(1, "Title is required"),
  campus: z.string().min(1, "Campus is required"),
  filingDate: z.string().min(1, "Filing Date is required"),
  applicationPublicationDate: z.string().optional(),
  grantedDate: z.string().optional(),
  filingFY: z.string().min(1, "Filing FY is required"),
  filingAY: z.string().min(1, "Filing AY is required"),
  publishedAY: z.string().optional(),
  publishedFY: z.string().optional(),
  grantedFY: z.string().optional(),
  grantedAY: z.string().optional(),
  grantedCY: z.string().optional(),
  status: z.enum(["Pending", "Filed", "Granted", "Abandoned", "Rejected"]),
  grantedPatentCertificateLink: z.string().optional(),
  applicationPublicationLink: z.string().optional(),
  form01Link: z.string().optional(),
});

export type Inventor = {
  name: string;
  email?: string;
};

export type Patent = {
  id: string;
  applicationNumber: string; 
  inventorsName: string;
  inventors: Inventor[];
  department: string;
  title: string;
  campus: string;
  filingDate: string;
  applicationPublicationDate?: string;
  grantedDate?: string;
  filingFY: string;
  filingAY: string;
  publishedAY?: string;
  publishedFY?: string;
  grantedFY?: string;
  grantedAY?: string;
  grantedCY?: string;
  status: "Pending" | "Filed" | "Granted" | "Abandoned" | "Rejected";
  grantedPatentCertificateLink?: string;
  applicationPublicationLink?: string;
  form01Link?: string;
  createdAt: string;
  updatedAt: string;
}; 