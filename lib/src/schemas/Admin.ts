import z from "zod";

export const editRolesBodySchema = z
    .object({
        email: z.string().email(),
        add: z.string().trim().nonempty().optional(),
        remove: z.string().trim().nonempty().optional(),
    })
    .refine(
        (data) => !!data.add !== !!data.remove,
        "Specify either add or remove"
    );

export type EditRolesBody = z.infer<typeof editRolesBodySchema>;
