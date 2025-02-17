import z from "zod";

export const userTypes = ["faculty", "phd", "staff"] as const;

export const deactivateMemberBodySchema = z.object({
    email: z.string().email(),
});
export type DeactivateMemberBody = z.infer<typeof deactivateMemberBodySchema>;

export const memberDetailsQuerySchema = z.object({
    email: z.string().email(),
});
export type MemberDetailsQuery = z.infer<typeof memberDetailsQuerySchema>;

export const roleNameSchema = z
    .string()
    .trim()
    .nonempty()
    .regex(/^[a-zA-Z0-9 _-]+$/)
    .max(64);
export const permissionNameSchema = z
    .string()
    .trim()
    .nonempty()
    .regex(/^[a-z0-9-:\*]+$/);

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

export const inviteMemberBodySchema = z.object({
    email: z.string().email(),
    type: z.enum(userTypes),
});
export type InviteMemberBody = z.infer<typeof inviteMemberBodySchema>;

export const memberSearchQuerySchema = z.object({
    q: z.string().trim().optional(),
});
export type MemberSearchQuery = z.infer<typeof memberSearchQuerySchema>;

export const permissionSearchQuerySchema = memberSearchQuerySchema;
export type PermissionSearchQuery = z.infer<typeof permissionSearchQuerySchema>;

export const roleSearchQuerySchema = memberSearchQuerySchema;
export type RoleSearchQuery = z.infer<typeof roleSearchQuerySchema>;

export const roleCreateBodySchema = z.object({
    name: roleNameSchema,
});
export type RoleCreateBody = z.infer<typeof roleCreateBodySchema>;

export const roleDeleteBodySchema = z.object({
    role: roleNameSchema,
});
export type RoleDeleteBody = z.infer<typeof roleDeleteBodySchema>;

export const roleEditPathSchema = z.object({
    role: roleNameSchema,
});
export type RoleEditPath = z.infer<typeof roleEditPathSchema>;

export const roleEditBodySchema = z.object({
    permission: permissionNameSchema,
    action: z.enum(["allow", "disallow", "none"]),
});
export type RoleEditBody = z.infer<typeof roleEditBodySchema>;

export const roleGetPathSchema = z.object({
    role: roleNameSchema,
});
export type RoleGetPath = z.infer<typeof roleGetPathSchema>;

export const renameRoleBodySchema = z.object({
    oldName: roleNameSchema,
    newName: roleNameSchema,
});
export type RenameRoleBody = z.infer<typeof renameRoleBodySchema>;

export const editDetailsBodySchema = z.intersection(
    z.object({
        email: z.string().email(),
        name: z.string().trim().nonempty().nullish(),
        phone: z.string().trim().nonempty().nullish(),
        department: z.string().trim().nonempty().nullish(),
    }),
    z.discriminatedUnion("type", [
        z.object({
            type: z.literal(userTypes[0]), // Faculty
            designation: z.string().trim().array().nullish(),
            room: z.string().trim().nullish(),
            psrn: z.string().trim().nonempty().nullish(),
        }),
        z.object({
            type: z.literal(userTypes[1]), // PhD
            idNumber: z.string().trim().nonempty().nullish(),
            erpId: z.string().trim().nonempty().nullish(),
            instituteEmail: z.string().email().nullish(),
            mobile: z.string().trim().nonempty().nullish(),
            personalEmail: z.string().email().nullish(),
            notionalSupervisorEmail: z.string().email().nullish(),
            supervisorEmail: z.string().email().nullish(),
            coSupervisorEmail: z.string().email().nullish(),
            coSupervisorEmail2: z.string().email().nullish(),
            dac1Email: z.string().email().nullish(),
            dac2Email: z.string().email().nullish(),
            natureOfPhD: z.string().trim().nonempty().nullish(),
            qualifyingExam1: z.boolean().nullish(),
            qualifyingExam2: z.boolean().nullish(),
            qualifyingExam1Date: z.string().date().nullish(),
            qualifyingExam2Date: z.string().date().nullish(),
        }),
        z.object({
            type: z.literal(userTypes[2]), // Staff
            designation: z.string().trim().array().nullish(),
        }),
    ])
);
export type EditDetailsBody = z.infer<typeof editDetailsBodySchema>;
