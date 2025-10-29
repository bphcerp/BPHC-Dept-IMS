import {
    pgTable,
    integer,
    text,
    timestamp,
    pgEnum,
    uuid,
    primaryKey,
} from "drizzle-orm/pg-core";
import { users } from "./admin.ts";
import { v4 as uuidv4 } from "uuid";

export const signFieldType = pgEnum("sign_field_type", [
    "sign",
    "text"
]);

export const signDocuments = pgTable("sign_documents", {
    id: uuid("id")
        .default(uuidv4())
        .primaryKey(),
    title: text("title").notNull(),
    docPath: text("doctype").notNull(),
    status: text("status").notNull(),
    createdAt: timestamp("created_at")
        .notNull()
        .defaultNow(),
    createdBy: text("created_by_email")
        .references(() => users.email, { onDelete: "set default" })
        .notNull(),
    
});

export const signerDocuments = pgTable(
    "signer_documents",
    {
        userId: text("user_id")
            .references(() => users.email, { onDelete: "set default" })
            .notNull(),
        documentId: uuid("document_id")
            .references(() => signDocuments.id, { onDelete: "cascade" })
            .notNull(),
        

    },
    (t) => [
            primaryKey({
                columns: [t.userId, t.documentId],
            }),
        ]
);

export const signField = pgTable("sign_field", {
    id: uuid("id")
        .default(uuidv4())
        .primaryKey(),
    position: integer("position").notNull(),
    doc_id: uuid("doc_id")
        .references(() => signDocuments.id, { onDelete: "cascade" })
        .notNull(),

});

export const signatureEntity = pgTable("signatures", {
    id: uuid("id")
        .default(uuidv4())
        .primaryKey(),
    userEmail: text("user_email")
        .references(() => users.email, { onDelete: "set default" })
        .notNull(),
    createdAt: timestamp("created_at")
        .notNull()
        .defaultNow(),
    signaturePath: text("signature_path").notNull(),
});

export const signerResponse = pgTable("signer_response", {
    signFieldId: uuid("sign_field_id")
        .references(() => signField.id, { onDelete: "cascade" })
        .notNull(),
    signedBy: text("signed_by")
        .references(() => users.email, { onDelete: "set default" })
        .notNull(),
    type: signFieldType("type").notNull(),
    signatureId: uuid("signature_id")
        .references(() => signatureEntity.id, { onDelete: "set null" }),
});




