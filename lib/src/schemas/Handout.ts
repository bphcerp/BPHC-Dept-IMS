import { z } from "zod";

export const getFacultyApplicationQuerySchema = z.object({
    applicationId: z.coerce.number(),
});

export type GetFacultyApplicationQuery = z.infer<typeof getFacultyApplicationQuerySchema>;

export const getAllFacultyApplicationsQuerySchema = z.object({
    email: z.string().email(),
});

export type GetAllFacultyApplicationsQuery = z.infer<typeof getAllFacultyApplicationsQuerySchema>