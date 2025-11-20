import { z } from "zod";

export const submitContributionSchema = z.object({
    body: z.object({
        designation: z.string(),
        startDate: z.string(),
        endDate: z.string(),
        facultyEmail: z.string().email(),
    }),
});

export const approveContributionSchema = z.object({
    body: z.object({
        contributionId: z.string().uuid(),
    }),
});

export const rejectContributionSchema = z.object({
    body: z.object({
        contributionId: z.string().uuid(),
    }),
});
