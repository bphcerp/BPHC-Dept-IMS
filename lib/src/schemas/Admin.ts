import z from "zod";

export const userTypes = ["faculty", "phd", "staff"] as const;

export const deactivateMemberBodySchema = z.object({
    email: z.string().email(),
});
export type DeactivateMemberBody = z.infer<typeof deactivateMemberBodySchema>;

export const deleteMemberBodySchema = deactivateMemberBodySchema;
export type DeleteMemberBody = z.infer<typeof deleteMemberBodySchema>;

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
        name: z.string().trim().nonempty().optional(),
        phone: z.string().trim().nonempty().optional(),
        department: z.string().trim().nonempty().optional(),
    }),
    z.discriminatedUnion("type", [
        z.object({
            type: z.literal(userTypes[0]), // Faculty
            designation: z.string().trim().array().optional(),
            room: z.string().trim().optional(),
            psrn: z.string().trim().nonempty().optional(),
            authorId: z.string().trim().nonempty().optional(),
        }),
        z.object({
            type: z.literal(userTypes[1]), // PhD
            idNumber: z.string().trim().nonempty().optional(),
            erpId: z.string().trim().nonempty().optional(),
            instituteEmail: z.string().email().optional(),
            mobile: z.string().trim().nonempty().optional(),
            personalEmail: z.string().email().optional(),
            notionalSupervisorEmail: z.string().email().optional(),
            supervisorEmail: z.string().email().optional(),
        }),
        z.object({
            type: z.literal(userTypes[2]), // Staff
            designation: z.string().trim().array().optional(),
        }),
    ])
);
export type EditDetailsBody = z.infer<typeof editDetailsBodySchema>;

export interface MemberDetailsResponse {
    email: string;
    type: (typeof userTypes)[number];
    name: string | null;
    roles: string[];
    deactivated: boolean;
    psrn?: string | null;
    department?: string | null;
    designation?: string[] | null;
    room?: string | null;
    phone?: string | null;
    idNumber?: string | null;
    erpId?: string | null;
    instituteEmail?: string | null;
    mobile?: string | null;
    personalEmail?: string | null;
}
