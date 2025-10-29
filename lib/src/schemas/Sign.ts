import { z } from "zod";

export const signFieldTypeValues = ["sign", "text"] as const;
export const signFieldTypeEnum = z.enum(signFieldTypeValues);

export const signDocumentsSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  docPath: z.string().min(1), // renamed from doctype
  status: z.string().min(1),
  requestedSignees: z.string().email(),
  createdAt: z.coerce.date(),
  createdBy: z.string().email(),
});

export const signerDocumentsSchema = z.object({
  userId: z.string().email(),
  documentId: z.string().uuid(),
});

export const signFieldSchema = z.object({
  id: z.string().uuid(),
  position: z.number().int(),
  doc_id: z.string().uuid(),
});

export const signatureEntitySchema = z.object({
  id: z.string().uuid(),
  userEmail: z.string().email(),
  createdAt: z.coerce.date(),
  signaturePath: z.string().min(1),
});

export const signerResponseSchema = z.object({
  signFieldId: z.string().uuid(),
  signedBy: z.string().email(),
  type: signFieldTypeEnum,
  signatureId: z.string().uuid().nullable().optional(),
});

export const signRequestSchema = z.object({
  signFieldId: z.string().uuid(),
  signatureId: z.string().uuid(),
  type: signFieldTypeEnum,
});

