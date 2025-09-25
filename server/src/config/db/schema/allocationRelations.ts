import { relations } from "drizzle-orm";
import { allocationSectionInstructors } from "./allocation.ts";
import { course } from "./allocation.ts";
import { semester } from "./allocation.ts";
import { users } from "./admin.ts";
import { masterAllocation, allocationSection } from "./allocation.ts";
import { allocationForm } from "./allocationFormBuilder.ts";

export const semesterRelations = relations(semester, ({ one }) => ({
    dcaConvenerAtStartOfSem: one(users, {
        fields: [semester.dcaConvenerAtStartOfSemEmail],
        references: [users.email],
    }),
    hodAtStartOfSem: one(users, {
        fields: [semester.hodAtStartOfSemEmail],
        references: [users.email],
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
            fields: [masterAllocation.ic],
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
        sections: one(masterAllocation, {
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
