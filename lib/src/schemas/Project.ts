import { z } from "zod";

export const projectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  pi: z.object({
    name: z.string().min(1, "PI Name is required"),
    email: z.string().email("Invalid email"),
    department: z.string().optional(),
    campus: z.string().optional(),
    affiliation: z.string().optional(),
  }),
  coPIs: z
    .array(
      z.object({
        name: z.string().optional(),
        email: z.string().email("Invalid email"),
        department: z.string().optional(),
        campus: z.string().optional(),
        affiliation: z.string().optional(),
      })
    )
    .optional(),
  fundingAgency: z.string().min(1, "Funding Agency is required"),
  fundingAgencyNature: z.enum(["public_sector", "private_industry"]),
  sanctionedAmount: z.string().min(1, "Sanctioned Amount is required"),
  capexAmount: z.string().optional(),
  opexAmount: z.string().optional(),
  manpowerAmount: z.string().optional(),
  approvalDate: z.string().min(1, "Approval Date is required"),
  startDate: z.string().min(1, "Start Date is required"),
  endDate: z.string().min(1, "End Date is required"),
  hasExtension: z.boolean().optional(),
  extensionDetails: z.string().optional(),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;

export type Project = {
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

export type CoPI = {
  id: string;
  name: string;
  email: string;
  department?: string;
  campus?: string;
  affiliation?: string;
}

export type UploadResults = {
  successful: number;
  failed: number;
  total: number;
  errors: string[];
}

