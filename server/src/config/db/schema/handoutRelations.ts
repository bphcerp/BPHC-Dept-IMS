import { relations } from "drizzle-orm";
import { textFields, fileFields } from "./form.ts";
import { users } from "./admin.ts";
import { courseHandoutRequests } from "./handout.ts";

export const usersHandoutsRelations = relations(users, ({ many }) => ({
    courseHandoutRequests: many(courseHandoutRequests, {
        relationName: "handoutUserEmail",
    }),
}));

export const textFieldsHandoutsRelations = relations(textFields, ({ one }) => ({
    courseCode: one(courseHandoutRequests, {
        fields: [textFields.id],
        references: [courseHandoutRequests.courseCode],
        relationName: "handoutCourseCode",
    }),
    courseName: one(courseHandoutRequests, {
        fields: [textFields.id],
        references: [courseHandoutRequests.courseName],
        relationName: "handoutCourseName",
    }),
    courseStrength: one(courseHandoutRequests, {
        fields: [textFields.id],
        references: [courseHandoutRequests.courseStrength],
        relationName: "handoutCourseStrength",
    }),
    openBook: one(courseHandoutRequests, {
        fields: [textFields.id],
        references: [courseHandoutRequests.openBook],
        relationName: "handoutOpenBook",
    }),
    closedBook: one(courseHandoutRequests, {
        fields: [textFields.id],
        references: [courseHandoutRequests.closedBook],
        relationName: "handoutClosedBook",
    }),
    midSem: one(courseHandoutRequests, {
        fields: [textFields.id],
        references: [courseHandoutRequests.midSem],
        relationName: "handoutMidSem",
    }),
    compre: one(courseHandoutRequests, {
        fields: [textFields.id],
        references: [courseHandoutRequests.compre],
        relationName: "handoutCompre",
    }),
    numComponents: one(courseHandoutRequests, {
        fields: [textFields.id],
        references: [courseHandoutRequests.numComponents],
        relationName: "HandoutNumComponents",
    }),
    frequency: one(courseHandoutRequests, {
        fields: [textFields.id],
        references: [courseHandoutRequests.frequency],
        relationName: "handoutFrequency",
    }),
}));

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
        courseHandoutRequests: one(users, {
            fields: [courseHandoutRequests.userEmail],
            references: [users.email],
            relationName: "handoutUserEmail",
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
