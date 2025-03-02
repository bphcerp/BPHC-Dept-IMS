import { relations } from "drizzle-orm";
import { textFields, fileFields, applications } from "./form.ts";
import { courseHandoutRequests } from "./handout.ts";

export const fileFieldsHandoutsRelations = relations(fileFields, ({ one }) => ({
    filePath: one(courseHandoutRequests, {
        fields: [fileFields.id],
        references: [courseHandoutRequests.handoutFilePath],
        relationName: "handoutFilePath",
    }),
}));

export const courseHandoutRequestsRelations = relations(
    courseHandoutRequests,
    ({ one }) => ({
        application: one(applications, {
            fields: [courseHandoutRequests.applicationId],
            references: [applications.id],
            relationName: "courseHandoutRequests",
        }),
        courseCode: one(textFields, {
            fields: [courseHandoutRequests.courseCode],
            references: [textFields.id],
            relationName: "handoutCourseCode",
        }),
        courseName: one(textFields, {
            fields: [courseHandoutRequests.courseName],
            references: [textFields.id],
            relationName: "handoutCourseName",
        }),
        courseStrength: one(textFields, {
            fields: [courseHandoutRequests.courseStrength],
            references: [textFields.id],
            relationName: "handoutCourseStrength",
        }),
        openBook: one(textFields, {
            fields: [courseHandoutRequests.openBook],
            references: [textFields.id],
            relationName: "handoutOpenBook",
        }),
        closedBook: one(textFields, {
            fields: [courseHandoutRequests.closedBook],
            references: [textFields.id],
            relationName: "handoutClosedBook",
        }),
        midSem: one(textFields, {
            fields: [courseHandoutRequests.midSem],
            references: [textFields.id],
            relationName: "handoutMidSem",
        }),
        compre: one(textFields, {
            fields: [courseHandoutRequests.compre],
            references: [textFields.id],
            relationName: "handoutCompre",
        }),
        numComponents: one(textFields, {
            fields: [courseHandoutRequests.numComponents],
            references: [textFields.id],
            relationName: "handoutNumComponents",
        }),
        frequency: one(textFields, {
            fields: [courseHandoutRequests.frequency],
            references: [textFields.id],
            relationName: "handoutFrequency",
        }),
        handoutFilePath: one(fileFields, {
            fields: [courseHandoutRequests.handoutFilePath],
            references: [fileFields.id],
            relationName: "handoutFilePath",
        }),
    })
);
