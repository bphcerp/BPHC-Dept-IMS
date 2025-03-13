import { relations } from "drizzle-orm";
import { textFields, dateFields } from "./form.ts";
import { qpRequests } from "./qp.ts";

export const qpRequestsRelations = relations(qpRequests, ({ one }) => ({
    request: one(textFields, {
        fields: [qpRequests.requestId],
        references: [textFields.id],
        relationName: "qpRequest",
    }),
    dca: one(textFields, {
        fields: [qpRequests.dca],
        references: [textFields.id],
        relationName: "qpDca",
    }),
    courseNo: one(textFields, {
        fields: [qpRequests.courseNo],
        references: [textFields.id],
        relationName: "qpCourseNo",
    }),
    course: one(textFields, {
        fields: [qpRequests.course],
        references: [textFields.id],
        relationName: "qpCourse",
    }),
    fic: one(textFields, {
        fields: [qpRequests.fic],
        references: [textFields.id],
        relationName: "qpFic",
    }),
    ficDeadline: one(dateFields, {
        fields: [qpRequests.ficDeadline],
        references: [dateFields.id],
        relationName: "qpFicDeadline",
    }),
    faculty1: one(textFields, {
        fields: [qpRequests.faculty1],
        references: [textFields.id],
        relationName: "qpFaculty1",
    }),
    faculty2: one(textFields, {
        fields: [qpRequests.faculty2],
        references: [textFields.id],
        relationName: "qpFaculty2",
    }),
    reviewDeadline: one(dateFields, {
        fields: [qpRequests.reviewDeadline],
        references: [dateFields.id],
        relationName: "qpReviewDeadline",
    }),
}));
