// DO NOT change the order of the modules
export const modules = [
    "Conference Approval",
    "Course Handout",
    "PhD Progress",
    "PhD Proposal",
    "PhD Qe Application",
    "Question Paper",
    "SFC Meeting",
    "Project Info",
    "Profile",
    "Patent Info",
    "Publications",
    "Meeting"
] as const;

export const applicationStatuses = ["pending", "approved", "rejected"] as const;

export type baseFieldResponse = {
    id: number;
    statuses: {
        status: boolean;
        comments?: string;
        timestamp: string;
    }[];
};

export type textFieldResponse = (baseFieldResponse & { value: string }) | null;
export type numberFieldResponse =
    | (baseFieldResponse & { value: number })
    | null;
export type dateFieldResponse = textFieldResponse;
export type fileFieldResponse =
    | (baseFieldResponse & {
          file: {
              originalName: string;
              mimetype: string;
              size: number;
              filePath: string;
          };
      })
    | null;
