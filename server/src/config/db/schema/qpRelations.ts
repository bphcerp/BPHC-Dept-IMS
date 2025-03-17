import { relations } from "drizzle-orm";
import { textFields, dateFields, fileFields, applications } from "./form.ts";
import { qpReviewRequests } from "./qp.ts";

export const qpReviewRequestsRelations = relations(
    qpReviewRequests,
    ({ one }) => ({
        application: one(applications, {
            fields: [qpReviewRequests.applicationId],
            references: [applications.id],
            relationName: "qpReviewRequests",
        }),
        dcaMember: one(textFields, {
            fields: [qpReviewRequests.dcaMember],
            references: [textFields.id],
            relationName: "qpDcaMember",
        }),
        courseNo: one(textFields, {
            fields: [qpReviewRequests.courseNo],
            references: [textFields.id],
            relationName: "qpCourseNo",
        }),
        courseName: one(textFields, {
            fields: [qpReviewRequests.courseName],
            references: [textFields.id],
            relationName: "qpCourseName",
        }),
        fic: one(textFields, {
            fields: [qpReviewRequests.fic],
            references: [textFields.id],
            relationName: "qpFic",
        }),
        ficDeadline: one(dateFields, {
            fields: [qpReviewRequests.ficDeadline],
            references: [dateFields.id],
            relationName: "qpFicDeadline",
        }),
        midSem: one(fileFields, {
            fields: [qpReviewRequests.midSem],
            references: [fileFields.id],
            relationName: "qpMidSem",
        }),
        midSemSol: one(fileFields, {
            fields: [qpReviewRequests.midSemSol],
            references: [fileFields.id],
            relationName: "qpMidSemSol",
        }),
        compre: one(fileFields, {
            fields: [qpReviewRequests.compre],
            references: [fileFields.id],
            relationName: "qpCompre",
        }),
        compreSol: one(fileFields, {
            fields: [qpReviewRequests.compreSol],
            references: [fileFields.id],
            relationName: "qpCompreSol",
        }),
        faculty1: one(textFields, {
            fields: [qpReviewRequests.faculty1],
            references: [textFields.id],
            relationName: "qpFaculty1",
        }),
        faculty2: one(textFields, {
            fields: [qpReviewRequests.faculty2],
            references: [textFields.id],
            relationName: "qpFaculty2",
        }),
        reviewDeadline: one(dateFields, {
            fields: [qpReviewRequests.reviewDeadline],
            references: [dateFields.id],
            relationName: "qpReviewDeadline",
        }),
    })
);