import { z } from "zod";

export const addNewPatentBodySchema = z
    .object({
        title: z.string(),
        nationality: z.string(),
        status: z.enum(["filed", "granted"], {
            message: "Status must be 'filed' or 'granted'",
        }),
        application_number: z.string(),
        filing_id: z.string(),
        filing_date: z.string(),
        grant_date: z.string().optional(),
        inventors: z.array(z.string()),
    })
    .refine((data) => (data.status === "granted" ? !!data.grant_date : true), {
        message: "Grant date is required if status is 'granted'",
        path: ["grant_date"],
    });

export type AddNewPatentBody = z.infer<typeof addNewPatentBodySchema>;
