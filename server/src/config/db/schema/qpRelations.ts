import { relations } from "drizzle-orm";
import { qpReviewRequests } from "./qp.ts";
import { users } from "./admin.ts";
import { fileFields } from "./form.ts";

export const qpReviewRequestsRelations = relations(qpReviewRequests, ({ one }) => ({
    dcaMember: one(users, {
        fields: [qpReviewRequests.dcaMemberEmail],
        references: [users.email],
        relationName: "qpDcaMember",
    }),
    fic: one(users, {
        fields: [qpReviewRequests.ficEmail],
        references: [users.email],
        relationName: "qpFic",
    }),
    faculty1: one(users, {
        fields: [qpReviewRequests.faculty1Email],
        references: [users.email],
        relationName: "qpFaculty1",
    }),
    faculty2: one(users, {
        fields: [qpReviewRequests.faculty2Email],
        references: [users.email],
        relationName: "qpFaculty2",
    }),
    midSemFile: one(fileFields, {
        fields: [qpReviewRequests.midSemFileId],
        references: [fileFields.id],
        relationName: "qpMidSemFile",
    }),
    midSemSolFile: one(fileFields, {
        fields: [qpReviewRequests.midSemSolFileId],
        references: [fileFields.id],
        relationName: "qpMidSemSolFile",
    }),
    compreFile: one(fileFields, {
        fields: [qpReviewRequests.compreFileId],
        references: [fileFields.id],
        relationName: "qpCompreFile",
    }),
    compreSolFile: one(fileFields, {
        fields: [qpReviewRequests.compreSolFileId],
        references: [fileFields.id],
        relationName: "qpCompreSolFile",
    }),
}));
