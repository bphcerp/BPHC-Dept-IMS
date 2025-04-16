import { relations } from "drizzle-orm";
import { qpReviewRequests } from "./qp.ts";
import { users } from "./admin.ts";
import { fileFields } from "./form.ts";

export const qpReviewRequestsRelations = relations(
    qpReviewRequests,
    ({ one }) => ({
        ic: one(users, {
            fields: [qpReviewRequests.icEmail],
            references: [users.email],
            relationName: "ic",
        }),
        reviewer: one(users, {
            fields: [qpReviewRequests.reviewerEmail],
            references: [users.email],
            relationName: "qpFaculty1",
        }),
        midSemFilePath: one(fileFields, {
            fields: [qpReviewRequests.midSemFilePath],
            references: [fileFields.id],
            relationName: "qpMidSemFilePath",
        }),
        midSemSolFile: one(fileFields, {
            fields: [qpReviewRequests.midSemSolFilePath],
            references: [fileFields.id],
            relationName: "qpMidSemSolFile",
        }),
        compreFile: one(fileFields, {
            fields: [qpReviewRequests.compreFilePath],
            references: [fileFields.id],
            relationName: "qpCompreFile",
        }),
        compreSolFile: one(fileFields, {
            fields: [qpReviewRequests.compreSolFilePath],
            references: [fileFields.id],
            relationName: "qpCompreSolFile",
        }),
    })
);
