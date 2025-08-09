// server/src/config/db/schema/phdRelations.ts
import { relations } from 'drizzle-orm';
import {
  phdSemesters,
  phdExamEvents,
  phdStudentApplications,
  phdStudentExamResults,
  phdExaminerSuggestions,
  phdExamSchedule,
  phdWorkflowStates,
  phdSubAreas,
  phdCourses
} from './phd.ts';
import { phd } from './admin.ts';
import { users } from './admin.ts';

export const phdRelations = relations(phd, ({ one }) => ({
  supervisor: one(users, {
    fields: [phd.supervisorEmail],
    references: [users.email],
  }),
}));
export const phdSemestersRelations = relations(phdSemesters, ({ many }) => ({
  examEvents: many(phdExamEvents),
}));

export const phdExamEventsRelations = relations(phdExamEvents, ({ one, many }) => ({
  semester: one(phdSemesters, {
    fields: [phdExamEvents.semesterId],
    references: [phdSemesters.id],
  }),
  applications: many(phdStudentApplications),
  schedules: many(phdExamSchedule),
  workflowStates: many(phdWorkflowStates),
}));

export const phdStudentApplicationsRelations = relations(phdStudentApplications, ({ one, many }) => ({
  student: one(phd, {
    fields: [phdStudentApplications.studentEmail],
    references: [phd.email],
  }),
  examEvent: one(phdExamEvents, {
    fields: [phdStudentApplications.examEventId],
    references: [phdExamEvents.id],
  }),
  results: many(phdStudentExamResults),
  examinerSuggestions: many(phdExaminerSuggestions),
  schedules: many(phdExamSchedule),
}));

export const phdStudentExamResultsRelations = relations(phdStudentExamResults, ({ one }) => ({
  application: one(phdStudentApplications, {
    fields: [phdStudentExamResults.applicationId],
    references: [phdStudentApplications.id],
  }),
  subArea: one(phdSubAreas, {
    fields: [phdStudentExamResults.subAreaId],
    references: [phdSubAreas.id],
  }),
}));

export const phdExaminerSuggestionsRelations = relations(phdExaminerSuggestions, ({ one }) => ({
  application: one(phdStudentApplications, {
    fields: [phdExaminerSuggestions.applicationId],
    references: [phdStudentApplications.id],
  }),
  supervisor: one(users, {
    fields: [phdExaminerSuggestions.supervisorEmail],
    references: [users.email],
  }),
}));

export const phdExamScheduleRelations = relations(phdExamSchedule, ({ one }) => ({
  examEvent: one(phdExamEvents, {
    fields: [phdExamSchedule.examEventId],
    references: [phdExamEvents.id],
  }),
  application: one(phdStudentApplications, {
    fields: [phdExamSchedule.applicationId],
    references: [phdStudentApplications.id],
  }),
  subArea: one(phdSubAreas, {
    fields: [phdExamSchedule.subAreaId],
    references: [phdSubAreas.id],
  }),
  examiner: one(users, {
    fields: [phdExamSchedule.examinerEmail],
    references: [users.email],
  }),
}));
