import z from "zod";
import { phdTypes } from "./Phd.ts";

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

export const editProfileImageBodySchema = z.object({
    email: z.string().email(),
});

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
    sendEmail: z.boolean().default(false),
    emailBody: z.string().trim().min(1).max(3000),
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

const optionalString = z
    .string()
    .trim()
    .nullish()
    .transform((val) => (val?.length ? val : null));
const optionalEmail = z
    .string()
    .trim()
    .nullish()
    .transform((val) => (val?.length ? val : null)).refine(
        (val) => !val || z.string().email().safeParse(val).success,
        {
            message: "Invalid email",
        }
    );
export const editDetailsBodySchema = z.intersection(
    z.object({
        email: z.string().email(),
        name: optionalString,
        phone: optionalString,
        department: optionalString,
    }),
    z.discriminatedUnion("type", [
        z.object({
            type: z.literal(userTypes[0]), // Faculty
            designation: optionalString,
            room: optionalString,
            psrn: optionalString,
            authorId: optionalString,
        }),
        z.object({
            type: z.literal(userTypes[1]), // PhD
            idNumber: optionalString,
            erpId: optionalString,
            instituteEmail: optionalEmail,
            mobile: optionalString,
            personalEmail: optionalEmail,
            notionalSupervisorEmail: optionalEmail,
            supervisorEmail: optionalEmail,
            emergencyPhoneNumber: optionalString,
            phdType: z.enum(phdTypes).nullish(),
        }),
        z.object({
            type: z.literal(userTypes[2]), // Staff
            designation: optionalString,
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
    authorId?: string | null;
    psrn?: string | null;
    department?: string | null;
    designation?: string | null;
    room?: string | null;
    phone?: string | null;
    idNumber?: string | null;
    erpId?: string | null;
    instituteEmail?: string | null;
    mobile?: string | null;
    personalEmail?: string | null;
    notionalSupervisorEmail?: string | null;
    supervisorEmail?: string | null;
    emergencyPhoneNumber?: string | null;
    phdType?: (typeof phdTypes)[number] | null;
}

// testing schemas
export const startTestingBodySchema = z.object({
    testerRoles: z
        .array(z.string().trim().nonempty())
        .min(1, "At least one role must be specified"),
});
export type StartTestingBody = z.infer<typeof startTestingBodySchema>;
