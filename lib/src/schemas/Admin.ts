import z from "zod";

export const userTypes = ["faculty", "phd", "staff"] as const;

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
