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

export const renameRoleBodySchema = z.object({
    oldName: z
        .string()
        .trim()
        .nonempty()
        .regex(/^[a-z0-9-]+$/)
        .max(128),
    newName: z
        .string()
        .trim()
        .nonempty()
        .regex(/^[a-z0-9-]+$/)
        .max(128),
});

export type RenameRoleBody = z.infer<typeof renameRoleBodySchema>;
