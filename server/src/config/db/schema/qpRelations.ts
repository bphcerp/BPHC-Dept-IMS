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
        qpFilePath: one(fileFields, {
            fields: [qpReviewRequests.qpFilePath],
            references: [fileFields.id],
            relationName: "qpMidSemFilePath",
        }),
        solFilePath: one(fileFields, {
            fields: [qpReviewRequests.solFilePath],
            references: [fileFields.id],
            relationName: "qpMidSemSolFile",
        }),
    })
);
