import { Field } from "multer";
import z from "zod";

export const qpRequestBodySchema = z.object({
    dcaMember: z.string().nonempty(),
    courseNo: z.string().nonempty(),
    courseName: z.string().nonempty(),
    fic: z.string().nonempty(),
    ficDeadline: z.coerce.date(),
    faculty1: z.string().optional(),
    faculty2: z.string().optional(),
    reviewDeadline: z.coerce.date(),
});


export const reviewFieldBodySchema = z.object({
    comments: z.string().nonempty(),
    status: z.boolean(),
});

export const editFieldBodySchema = z.object({
    value: z.union([
        z.string().nonempty(),
        z.coerce.number().positive().finite(),
        z.coerce.date(),
    ]),
});

export const finalizeApproveQpSchema = z.object({
    approve: z.boolean(),
});

export const fileFieldNames = [
    "midSem",
    "midSemSol",
    "compre",
    "compreSol",
] as const;

export const multerFileFields: Readonly<Field[]> = (
    fileFieldNames as Readonly<string[]>
).map((x) => {
    return { name: x, maxCount: 1 };
});

export const fieldTypes = z.enum(["text", "number", "date", "file"]);
