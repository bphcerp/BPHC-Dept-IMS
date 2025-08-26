import z from "zod";

export const editProfileBody = z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    description: z.string().optional(),
    profileImage: z.string().optional(),
    designation: z.string().optional(),
    department: z.string().optional(),
    education: z.string().array().optional(),
    researchInterests: z.string().array().optional(),
    linkedin: z.string().optional(),
    orchidID: z.string().optional(),
    scopusID: z.string().optional(),
    googleScholar: z.string().optional(),
    additionalLinks: z.string().array().optional(),
});

export type EditProfileBody = z.infer<typeof editProfileBody>;
