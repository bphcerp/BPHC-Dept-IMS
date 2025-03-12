import { z } from "zod";
export const getApplicationFacultyBodySchema = z.object({
    applicationId: z.coerce.number(),
});

export type GetApplicationFacultyBody = z.infer<typeof getApplicationFacultyBodySchema>;