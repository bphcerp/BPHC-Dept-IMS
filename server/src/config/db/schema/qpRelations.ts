import { relations } from "drizzle-orm";
import { qpReviewRequests } from "./qp.ts";
import { users } from "./admin.ts";
import { fileFields, files } from "./form.ts";

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
        midSemSolFilePath: one(files, {
            fields: [qpReviewRequests.midSemSolFilePath],
            references: [files.id],
            relationName: "qpMidSemSolFile",
        }),
        compreQpFilePath: one(files, {
            fields: [qpReviewRequests.compreQpFilePath],
            references: [files.id],
            relationName: "qpCompreFilePath",
        }),
        compreSolFilePath: one(files, {
            fields: [qpReviewRequests.compreSolFilePath],
            references: [files.id],
            relationName: "qpCompreSolFile",
        }),
    })
);
