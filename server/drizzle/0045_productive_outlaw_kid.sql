ALTER TABLE "phd_courses" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "phd_examiner" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "phd_qualifying_exams" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "phd_semesters" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "phd_sub_areas" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "phd_courses" CASCADE;--> statement-breakpoint
DROP TABLE "phd_examiner" CASCADE;--> statement-breakpoint
DROP TABLE "phd_qualifying_exams" CASCADE;--> statement-breakpoint
DROP TABLE "phd_semesters" CASCADE;--> statement-breakpoint
DROP TABLE "phd_sub_areas" CASCADE;--> statement-breakpoint
ALTER TABLE "phd" DROP CONSTRAINT "phd_co_supervisor_email_users_email_fk";
--> statement-breakpoint
ALTER TABLE "phd" DROP CONSTRAINT "phd_co_supervisor_email_2_users_email_fk";
--> statement-breakpoint
ALTER TABLE "phd" DROP CONSTRAINT "phd_dac_1_email_users_email_fk";
--> statement-breakpoint
ALTER TABLE "phd" DROP CONSTRAINT "phd_dac_2_email_users_email_fk";
--> statement-breakpoint
ALTER TABLE "phd" DROP CONSTRAINT "phd_notional_supervisor_email_users_email_fk";
--> statement-breakpoint
ALTER TABLE "phd" DROP CONSTRAINT "phd_supervisor_email_users_email_fk";
--> statement-breakpoint
ALTER TABLE "phd" ALTER COLUMN "qualification_date" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "phd" ADD COLUMN "qe_attempt_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "phd" ADD COLUMN "has_passed_qe" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "phd" ADD CONSTRAINT "phd_notional_supervisor_email_users_email_fk" FOREIGN KEY ("notional_supervisor_email") REFERENCES "public"."users"("email") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd" ADD CONSTRAINT "phd_supervisor_email_users_email_fk" FOREIGN KEY ("supervisor_email") REFERENCES "public"."users"("email") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd" DROP COLUMN "co_supervisor_email";--> statement-breakpoint
ALTER TABLE "phd" DROP COLUMN "co_supervisor_email_2";--> statement-breakpoint
ALTER TABLE "phd" DROP COLUMN "dac_1_email";--> statement-breakpoint
ALTER TABLE "phd" DROP COLUMN "dac_2_email";--> statement-breakpoint
ALTER TABLE "phd" DROP COLUMN "nature_of_phd";--> statement-breakpoint
ALTER TABLE "phd" DROP COLUMN "qualifying_exam_1";--> statement-breakpoint
ALTER TABLE "phd" DROP COLUMN "qualifying_exam_2";--> statement-breakpoint
ALTER TABLE "phd" DROP COLUMN "qualifying_exam_1_start_date";--> statement-breakpoint
ALTER TABLE "phd" DROP COLUMN "qualifying_exam_1_end_date";--> statement-breakpoint
ALTER TABLE "phd" DROP COLUMN "qualifying_exam_2_start_date";--> statement-breakpoint
ALTER TABLE "phd" DROP COLUMN "qualifying_exam_2_end_date";--> statement-breakpoint
ALTER TABLE "phd" DROP COLUMN "qualifying_area_1";--> statement-breakpoint
ALTER TABLE "phd" DROP COLUMN "qualifying_area_2";--> statement-breakpoint
ALTER TABLE "phd" DROP COLUMN "number_of_qe_application";--> statement-breakpoint
ALTER TABLE "phd" DROP COLUMN "suggested_dac_members";--> statement-breakpoint
ALTER TABLE "phd" DROP COLUMN "qualifying_areas_updated_at";--> statement-breakpoint
CREATE TYPE "public"."phd_exam_application_status" AS ENUM('applied', 'verified', 'resubmit');--> statement-breakpoint
CREATE TYPE "public"."phd_exam_result_status" AS ENUM('pass', 'fail');--> statement-breakpoint
CREATE TYPE "public"."phd_proposal_status" AS ENUM('deleted', 'supervisor_review', 'cosupervisor_review', 'drc_send_to_dac', 'dac_review', 'completed');--> statement-breakpoint
CREATE TABLE "phd_courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_email" text NOT NULL,
	"course_names" text[] DEFAULT '{}'::text[],
	"course_grades" text[] DEFAULT '{}'::text[],
	"course_units" integer[] DEFAULT '{}'::integer[],
	"course_ids" text[] DEFAULT '{}'::text[]
);
--> statement-breakpoint
CREATE TABLE "phd_email_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"description" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "phd_email_templates_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "phd_exam_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"exam_id" integer NOT NULL,
	"student_email" text NOT NULL,
	"status" "phd_exam_application_status" DEFAULT 'applied' NOT NULL,
	"comments" text,
	"qualifying_area_1" text NOT NULL,
	"qualifying_area_2" text NOT NULL,
	"qualifying_area_1_syllabus_file_id" integer,
	"qualifying_area_2_syllabus_file_id" integer,
	"tenth_report_file_id" integer,
	"twelfth_report_file_id" integer,
	"undergrad_report_file_id" integer,
	"masters_report_file_id" integer,
	"result" "phd_exam_result_status",
	"attempt_number" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "phd_examiner_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer NOT NULL,
	"qualifying_area" text NOT NULL,
	"examiner_email" text NOT NULL,
	"notified_at" timestamp with time zone,
	"qp_submitted" boolean DEFAULT false NOT NULL,
	CONSTRAINT "phd_examiner_assignments_application_id_qualifying_area_unique" UNIQUE("application_id","qualifying_area")
);
--> statement-breakpoint
CREATE TABLE "phd_examiner_suggestions" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer NOT NULL,
	"qualifying_area" text NOT NULL,
	"suggested_examiners" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "phd_examiner_suggestions_application_id_qualifying_area_unique" UNIQUE("application_id","qualifying_area")
);
--> statement-breakpoint
CREATE TABLE "phd_proposal_co_supervisors" (
	"id" serial PRIMARY KEY NOT NULL,
	"proposal_id" integer NOT NULL,
	"co_supervisor_email" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"approval_status" boolean,
	CONSTRAINT "phd_proposal_co_supervisors_proposal_id_co_supervisor_email_unique" UNIQUE("proposal_id","co_supervisor_email")
);
--> statement-breakpoint
CREATE TABLE "phd_proposal_dac_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"proposal_id" integer NOT NULL,
	"dac_member_email" text NOT NULL,
	CONSTRAINT "phd_proposal_dac_members_proposal_id_dac_member_email_unique" UNIQUE("proposal_id","dac_member_email")
);
--> statement-breakpoint
CREATE TABLE "phd_proposals" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_email" text NOT NULL,
	"supervisor_email" text NOT NULL,
	"title" text NOT NULL,
	"abstract_file_id" integer NOT NULL,
	"proposal_file_id" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" "phd_proposal_status" DEFAULT 'supervisor_review' NOT NULL,
	"comments" text,
	"active" boolean GENERATED ALWAYS AS (CASE WHEN status IN ('completed', 'deleted') THEN NULL ELSE true END) STORED,
	CONSTRAINT "phd_proposals_student_email_active_unique" UNIQUE("student_email","active")
);
--> statement-breakpoint
CREATE TABLE "phd_qualifying_exams" (
	"id" serial PRIMARY KEY NOT NULL,
	"semester_id" integer NOT NULL,
	"exam_name" text NOT NULL,
	"exam_start_date" timestamp with time zone NOT NULL,
	"exam_end_date" timestamp with time zone NOT NULL,
	"submission_deadline" timestamp with time zone NOT NULL,
	"viva_date" timestamp with time zone,
	"examiner_count" integer DEFAULT 2 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "phd_qualifying_exams_semester_id_exam_name_unique" UNIQUE("semester_id","exam_name")
);
--> statement-breakpoint
CREATE TABLE "phd_semesters" (
	"id" serial PRIMARY KEY NOT NULL,
	"year" text NOT NULL,
	"semester_number" integer NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "phd_semesters_year_semester_number_unique" UNIQUE("year","semester_number")
);
--> statement-breakpoint
CREATE TABLE "phd_sub_areas" (
	"sub_area" text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
ALTER TABLE "phd_courses" ADD CONSTRAINT "phd_courses_student_email_phd_email_fk" FOREIGN KEY ("student_email") REFERENCES "public"."phd"("email") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_exam_applications" ADD CONSTRAINT "phd_exam_applications_exam_id_phd_qualifying_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."phd_qualifying_exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_exam_applications" ADD CONSTRAINT "phd_exam_applications_student_email_phd_email_fk" FOREIGN KEY ("student_email") REFERENCES "public"."phd"("email") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_exam_applications" ADD CONSTRAINT "phd_exam_applications_qualifying_area_1_phd_sub_areas_sub_area_fk" FOREIGN KEY ("qualifying_area_1") REFERENCES "public"."phd_sub_areas"("sub_area") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_exam_applications" ADD CONSTRAINT "phd_exam_applications_qualifying_area_2_phd_sub_areas_sub_area_fk" FOREIGN KEY ("qualifying_area_2") REFERENCES "public"."phd_sub_areas"("sub_area") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_exam_applications" ADD CONSTRAINT "phd_exam_applications_qualifying_area_1_syllabus_file_id_files_id_fk" FOREIGN KEY ("qualifying_area_1_syllabus_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_exam_applications" ADD CONSTRAINT "phd_exam_applications_qualifying_area_2_syllabus_file_id_files_id_fk" FOREIGN KEY ("qualifying_area_2_syllabus_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_exam_applications" ADD CONSTRAINT "phd_exam_applications_tenth_report_file_id_files_id_fk" FOREIGN KEY ("tenth_report_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_exam_applications" ADD CONSTRAINT "phd_exam_applications_twelfth_report_file_id_files_id_fk" FOREIGN KEY ("twelfth_report_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_exam_applications" ADD CONSTRAINT "phd_exam_applications_undergrad_report_file_id_files_id_fk" FOREIGN KEY ("undergrad_report_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_exam_applications" ADD CONSTRAINT "phd_exam_applications_masters_report_file_id_files_id_fk" FOREIGN KEY ("masters_report_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_examiner_assignments" ADD CONSTRAINT "phd_examiner_assignments_application_id_phd_exam_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."phd_exam_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_examiner_assignments" ADD CONSTRAINT "phd_examiner_assignments_qualifying_area_phd_sub_areas_sub_area_fk" FOREIGN KEY ("qualifying_area") REFERENCES "public"."phd_sub_areas"("sub_area") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_examiner_suggestions" ADD CONSTRAINT "phd_examiner_suggestions_application_id_phd_exam_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."phd_exam_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_examiner_suggestions" ADD CONSTRAINT "phd_examiner_suggestions_qualifying_area_phd_sub_areas_sub_area_fk" FOREIGN KEY ("qualifying_area") REFERENCES "public"."phd_sub_areas"("sub_area") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_proposal_co_supervisors" ADD CONSTRAINT "phd_proposal_co_supervisors_proposal_id_phd_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."phd_proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_proposal_co_supervisors" ADD CONSTRAINT "phd_proposal_co_supervisors_co_supervisor_email_faculty_email_fk" FOREIGN KEY ("co_supervisor_email") REFERENCES "public"."faculty"("email") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_proposal_dac_members" ADD CONSTRAINT "phd_proposal_dac_members_proposal_id_phd_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."phd_proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_proposal_dac_members" ADD CONSTRAINT "phd_proposal_dac_members_dac_member_email_faculty_email_fk" FOREIGN KEY ("dac_member_email") REFERENCES "public"."faculty"("email") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_proposals" ADD CONSTRAINT "phd_proposals_student_email_phd_email_fk" FOREIGN KEY ("student_email") REFERENCES "public"."phd"("email") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_proposals" ADD CONSTRAINT "phd_proposals_supervisor_email_faculty_email_fk" FOREIGN KEY ("supervisor_email") REFERENCES "public"."faculty"("email") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_proposals" ADD CONSTRAINT "phd_proposals_abstract_file_id_files_id_fk" FOREIGN KEY ("abstract_file_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_proposals" ADD CONSTRAINT "phd_proposals_proposal_file_id_files_id_fk" FOREIGN KEY ("proposal_file_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_qualifying_exams" ADD CONSTRAINT "phd_qualifying_exams_semester_id_phd_semesters_id_fk" FOREIGN KEY ("semester_id") REFERENCES "public"."phd_semesters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "phd_proposal_co_supervisors_proposal_id_index" ON "phd_proposal_co_supervisors" USING btree ("proposal_id");--> statement-breakpoint
CREATE INDEX "phd_proposal_dac_members_proposal_id_index" ON "phd_proposal_dac_members" USING btree ("proposal_id");--> statement-breakpoint
CREATE INDEX "phd_proposals_student_email_index" ON "phd_proposals" USING btree ("student_email");--> statement-breakpoint
CREATE INDEX "phd_proposals_supervisor_email_index" ON "phd_proposals" USING btree ("supervisor_email");
