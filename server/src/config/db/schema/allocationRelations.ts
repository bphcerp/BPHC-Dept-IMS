import { relations } from "drizzle-orm";
import { faculty, users } from "./admin.ts";
import { allocationForm } from "./allocationFormBuilder.ts";
import {
    semester,
    masterAllocation,
    course,
    allocationSection,
    allocationSectionInstructors,
    allocationCourseGroup,
    allocationCourseGroupMapping,
} from "./allocation.ts";

export const semesterRelations = relations(semester, ({ one }) => ({
    dcaConvenerAtStartOfSem: one(faculty, {
        fields: [semester.dcaConvenerAtStartOfSemEmail],
        references: [faculty.email],
    }),
    hodAtStartOfSem: one(faculty, {
        fields: [semester.hodAtStartOfSemEmail],
        references: [faculty.email],
    }),
    form: one(allocationForm, {
        fields: [semester.formId],
        references: [allocationForm.id],
    }),
}));

export const masterAllocationRelations = relations(
    masterAllocation,
    ({ one, many }) => ({
        ic: one(users, {
            fields: [masterAllocation.icEmail],
            references: [users.email],
        }),
        course: one(course, {
            fields: [masterAllocation.courseCode],
            references: [course.code],
        }),
        sections: many(allocationSection),
    })
);

export const sectionRelations = relations(
    allocationSection,
    ({ many, one }) => ({
        instructors: many(allocationSectionInstructors),
        master: one(masterAllocation, {
            fields: [allocationSection.masterId],
            references: [masterAllocation.id],
        }),
    })
);

export const allocationSectionInstructorsRelations = relations(
    allocationSectionInstructors,
    ({ one }) => ({
        section: one(allocationSection, {
            fields: [allocationSectionInstructors.sectionId],
            references: [allocationSection.id],
        }),
        instructor: one(users, {
            fields: [allocationSectionInstructors.instructorEmail],
            references: [users.email],
        }),
    })
);

export const courseGroupRelations = relations(
    allocationCourseGroup,
    ({ many }) => ({
        courses: many(allocationCourseGroupMapping),
    })
);

export const coursesRelations = relations(course, ({ many }) => ({
    groups: many(allocationCourseGroupMapping),
}));

export const coursesToGroupsRelations = relations(allocationCourseGroupMapping, ({ one }) => ({
  group: one(allocationCourseGroup, {
    fields: [allocationCourseGroupMapping.groupId],
    references: [allocationCourseGroup.id],
  }),
  course: one(course, {
    fields: [allocationCourseGroupMapping.courseCode],
    references: [course.code],
  }),
}));
