import { relations } from "drizzle-orm";
import {
    phdRequests,
    phdRequestDocuments,
    phdRequestReviews,
    phdRequestDrcAssignments,
} from "./phdRequest.ts";
import { phd, faculty, users } from "./admin.ts";
import { phdSemesters } from "./phd.ts";
import { files } from "./form.ts";

export const phdRequestsRelations = relations(phdRequests, ({ one, many }) => ({
    student: one(phd, {
        fields: [phdRequests.studentEmail],
        references: [phd.email],
        relationName: "studentRequests",
    }),
    supervisor: one(faculty, {
        fields: [phdRequests.supervisorEmail],
        references: [faculty.email],
    }),
    semester: one(phdSemesters, {
        fields: [phdRequests.semesterId],
        references: [phdSemesters.id],
    }),
    documents: many(phdRequestDocuments),
    reviews: many(phdRequestReviews),
    drcAssignments: many(phdRequestDrcAssignments),
}));

export const phdRequestDocumentsRelations = relations(
    phdRequestDocuments,
    ({ one }) => ({
        request: one(phdRequests, {
            fields: [phdRequestDocuments.requestId],
            references: [phdRequests.id],
        }),
        file: one(files, {
            fields: [phdRequestDocuments.fileId],
            references: [files.id],
        }),
        uploader: one(users, {
            fields: [phdRequestDocuments.uploadedByEmail],
            references: [users.email],
        }),
    })
);

export const phdRequestReviewsRelations = relations(
    phdRequestReviews,
    ({ one }) => ({
        request: one(phdRequests, {
            fields: [phdRequestReviews.requestId],
            references: [phdRequests.id],
        }),
        reviewer: one(users, {
            fields: [phdRequestReviews.reviewerEmail],
            references: [users.email],
        }),
    })
);

export const phdRequestDrcAssignmentsRelations = relations(
    phdRequestDrcAssignments,
    ({ one }) => ({
        request: one(phdRequests, {
            fields: [phdRequestDrcAssignments.requestId],
            references: [phdRequests.id],
        }),
        drcMember: one(faculty, {
            fields: [phdRequestDrcAssignments.drcMemberEmail],
            references: [faculty.email],
        }),
    })
);
