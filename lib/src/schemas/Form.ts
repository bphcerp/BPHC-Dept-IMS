export const modules = [
    "Conference Approval",
    "Course Handout",
    "PhD Progress",
    "PhD Proposal",
    "PhD Qe Application",
    "Question Paper",
    "SFC Meeting",
    "Project Info",
    "Patent Info",
] as const;

type baseFieldResponse = {
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
