import { relations } from "drizzle-orm";
import { users } from "./admin.ts";
import {
  signDocuments,
  signerDocuments,
  signField,
  signatureEntity,
  signerResponse,
} from "./sign.ts";

export const usersRelations = relations(users, ({ many }) => ({
  signerDocuments: many(signerDocuments),
  signatures: many(signatureEntity),
  signerResponses: many(signerResponse),
}));

export const signDocumentsRelations = relations(signDocuments, ({ many, one }) => ({
  signerDocuments: many(signerDocuments),
  signFields: many(signField),
  requestedBy: one(users, {
    fields: [signDocuments.createdBy],
    references: [users.email],
  }),
}));

export const signerDocumentsRelations = relations(signerDocuments, ({ one }) => ({
  user: one(users, {
    fields: [signerDocuments.userId],
    references: [users.email],
  }),
  document: one(signDocuments, {
    fields: [signerDocuments.documentId],
    references: [signDocuments.id],
  }),
}));

export const signFieldRelations = relations(signField, ({ one, many }) => ({
  document: one(signDocuments, {
    fields: [signField.doc_id],
    references: [signDocuments.id],
  }),
  signerResponses: many(signerResponse),
}));

export const signatureEntityRelations = relations(signatureEntity, ({ one, many }) => ({
  user: one(users, {
    fields: [signatureEntity.userEmail],
    references: [users.email],
  }),
  signerResponses: many(signerResponse),
}));


export const signerResponseRelations = relations(signerResponse, ({ one }) => ({
  signField: one(signField, {
    fields: [signerResponse.signFieldId],
    references: [signField.id],
  }),
  signedByUser: one(users, {
    fields: [signerResponse.signedBy],
    references: [users.email],
  }),
  signature: one(signatureEntity, {
    fields: [signerResponse.signatureId],
    references: [signatureEntity.id],
  }),
}));
