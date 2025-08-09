// server/src/config/db/schema/phd.ts
import {
  pgTable, text, serial, timestamp, integer, boolean, pgEnum
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users, phd as phdStudentProfile } from './admin.ts';
import { files } from './form.ts';

// --- ENUMS ---
export const phdExamTypeEnum = pgEnum('phd_exam_type', ['QualifyingExam', 'ThesisProposal']);
export const phdApplicationStatusEnum = pgEnum('phd_application_status', ['Applied', 'Approved', 'Rejected', 'Withdrawn']);
export const suggestionStatusEnum = pgEnum('examiner_suggestion_status', ['Pending', 'Submitted']);
export const workflowStageEnum = pgEnum('workflow_stage', [
  'applications_open', 'applications_closed', 'supervisor_suggestions', 
  'examiner_assignment', 'timetable_created', 'exams_completed'
]);

// --- CORE TABLES ---

/**
 * Academic semesters for organizing exam events
 */
export const phdSemesters = pgTable('phd_semesters', {
  id: serial('id').primaryKey(),
  academicYear: text('academic_year').notNull(), // e.g., "2024-2025"
  semesterNumber: integer('semester_number').notNull(), // 1 or 2
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  isActive: boolean('is_active').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Exam events (qualifying exams, proposal defenses)
 */
export const phdExamEvents = pgTable('phd_exam_events', {
  id: serial('id').primaryKey(),
  semesterId: integer('semester_id').notNull().references(() => phdSemesters.id, { onDelete: 'cascade' }),
  type: phdExamTypeEnum('type').notNull(),
  name: text('name').notNull(),
  registrationDeadline: timestamp('registration_deadline').notNull(),
  examStartDate: timestamp('exam_start_date'),
  examEndDate: timestamp('exam_end_date'),
  vivaDate: timestamp('viva_date'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Student applications for exam events
 */
export const phdStudentApplications = pgTable('phd_student_applications', {
  id: serial('id').primaryKey(),
  studentEmail: text('student_email').notNull().references(() => phdStudentProfile.email, { onDelete: 'cascade' }),
  examEventId: integer('exam_event_id').notNull().references(() => phdExamEvents.id, { onDelete: 'cascade' }),
  attemptNumber: integer('attempt_number').notNull(),
  status: phdApplicationStatusEnum('status').notNull().default('Applied'),
  applicationFormFileId: integer('application_form_file_id').references(() => files.id),
  qualifyingArea1: text('qualifying_area_1'),
  qualifyingArea2: text('qualifying_area_2'),
  rejectionReason: text('rejection_reason'),
  appliedAt: timestamp('applied_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Exam results for each sub-area
 */
export const phdStudentExamResults = pgTable('phd_student_exam_results', {
  id: serial('id').primaryKey(),
  applicationId: integer('application_id').notNull().references(() => phdStudentApplications.id, { onDelete: 'cascade' }),
  subAreaId: integer('sub_area_id').notNull().references(() => phdSubAreas.id),
  passed: boolean('passed'),
  comments: text('comments'),
  evaluatedBy: text('evaluated_by').references(() => users.email),
  evaluatedAt: timestamp('evaluated_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Examiner suggestions from supervisors
 */
export const phdExaminerSuggestions = pgTable('phd_examiner_suggestions', {
  id: serial('id').primaryKey(),
  applicationId: integer('application_id').notNull().references(() => phdStudentApplications.id, { onDelete: 'cascade' }),
  supervisorEmail: text('supervisor_email').notNull().references(() => users.email),
  status: suggestionStatusEnum('status').notNull().default('Pending'),
  subArea1Examiners: text('sub_area_1_examiners').array().default(sql`'{}'::text[]`),
  subArea2Examiners: text('sub_area_2_examiners').array().default(sql`'{}'::text[]`),
  submittedAt: timestamp('submitted_at'),
  reminderCount: integer('reminder_count').default(0),
  lastReminderAt: timestamp('last_reminder_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Final exam schedule
 */
export const phdExamSchedule = pgTable('phd_exam_schedule', {
  id: serial('id').primaryKey(),
  examEventId: integer('exam_event_id').notNull().references(() => phdExamEvents.id, { onDelete: 'cascade' }),
  applicationId: integer('application_id').notNull().references(() => phdStudentApplications.id, { onDelete: 'cascade' }),
  subAreaId: integer('sub_area_id').notNull().references(() => phdSubAreas.id),
  examinerEmail: text('examiner_email').notNull().references(() => users.email),
  sessionNumber: integer('session_number').notNull(),
  scheduledAt: timestamp('scheduled_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Workflow state tracking
 */
export const phdWorkflowStates = pgTable('phd_workflow_states', {
  id: serial('id').primaryKey(),
  examEventId: integer('exam_event_id').notNull().references(() => phdExamEvents.id, { onDelete: 'cascade' }),
  stage: workflowStageEnum('stage').notNull(),
  status: text('status').notNull(), // 'pending', 'in_progress', 'completed'
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  metadata: text('metadata'), // JSON string for additional data
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// --- EXISTING TABLES (Updated) ---
export const phdSubAreas = pgTable('phd_sub_areas', {
  id: serial('id').primaryKey(),
  subarea: text('sub_area').notNull().unique(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const phdCourses = pgTable('phd_courses', {
  id: serial('id').primaryKey(),
  studentEmail: text('student_email').notNull().references(() => phdStudentProfile.email, { onDelete: 'cascade' }),
  courseNames: text('course_names').array().default(sql`'{}'::text[]`),
  courseGrades: text('course_grades').array().default(sql`'{}'::text[]`),
  courseUnits: integer('course_units').array().default(sql`'{}'::integer[]`),
  courseIds: text('course_ids').array().default(sql`'{}'::text[]`),
});
