import { z } from "zod";
export const getApplicationFacultyQuerySchema = z.object({
    applicationId: z.coerce.number(),
});

export type GetApplicationFacultyQuery = z.infer<typeof getApplicationFacultyQuerySchema>;