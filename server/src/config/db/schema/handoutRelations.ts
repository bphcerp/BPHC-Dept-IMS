import { relations } from "drizzle-orm";
import { files } from "./form.ts";
import { courseHandoutRequests } from "./handout.ts";
import { users } from "./admin.ts";

export const fileFieldsHandoutsRelations = relations(files, ({ one }) => ({
    filePath: one(courseHandoutRequests, {
        fields: [files.id],
        references: [courseHandoutRequests.handoutFilePath],
        relationName: "handoutFilePath",
    }),
}));

export const courseHandoutRequestsRelations = relations(
    courseHandoutRequests,
    ({ one }) => ({
        ic: one(users, {
            fields: [courseHandoutRequests.icEmail],
            references: [users.email],
            relationName: "ic",
        }),
        reviewer: one(users, {
            fields: [courseHandoutRequests.reviewerEmail],
            references: [users.email],
            relationName: "reviewer",
        }),
        handoutFilePath: one(files, {
            fields: [courseHandoutRequests.handoutFilePath],
            references: [files.id],
            relationName: "handoutFilePath",
        }),
        previousSubmission: one(courseHandoutRequests, {
            fields: [courseHandoutRequests.previousSubmissionId],
            references: [courseHandoutRequests.id],
            relationName: "previousSubmission",
        }),
    })
);
