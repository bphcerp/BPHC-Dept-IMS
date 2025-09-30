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
        midSemQpFilePath: one(fileFields, {
            fields: [qpReviewRequests.midSemQpFilePath],
            references: [fileFields.id],
            relationName: "qpMidSemFilePath",
        }),
        midSemSolFilePath: one(fileFields, {
            fields: [qpReviewRequests.midSemSolFilePath],
            references: [fileFields.id],
            relationName: "qpMidSemSolFile",
        }),
        compreQpFilePath: one(fileFields, {
            fields: [qpReviewRequests.compreQpFilePath],
            references: [fileFields.id],
            relationName: "qpCompreFilePath",
        }),
        compreSolFilePath: one(fileFields, {
            fields: [qpReviewRequests.compreSolFilePath],
            references: [fileFields.id],
            relationName: "qpCompreSolFile",
        }),
    })
);
