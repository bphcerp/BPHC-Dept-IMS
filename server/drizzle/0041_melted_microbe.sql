CREATE TYPE "public"."phd_exam_application_status" AS ENUM('applied', 'accepted', 'rejected', 'withdrawn');--> statement-breakpoint
CREATE TABLE "phd_courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_email" text NOT NULL,
	"course_names" text[] DEFAULT '{}'::text[],
	"course_grades" text[] DEFAULT '{}'::text[],
	"course_units" integer[] DEFAULT '{}'::integer[],
	"course_ids" text[] DEFAULT '{}'::text[]
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
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "phd_examiner_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer NOT NULL,
	"sub_area" text NOT NULL,
	"examiner_email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "phd_examiner_suggestions" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer NOT NULL,
	"sub_area" text NOT NULL,
	"suggested_examiners" text[] DEFAULT '{}'::text[] NOT NULL,
	"comments" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
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
ALTER TABLE "phd_examiner_assignments" ADD CONSTRAINT "phd_examiner_assignments_sub_area_phd_sub_areas_sub_area_fk" FOREIGN KEY ("sub_area") REFERENCES "public"."phd_sub_areas"("sub_area") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_examiner_suggestions" ADD CONSTRAINT "phd_examiner_suggestions_application_id_phd_exam_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."phd_exam_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_examiner_suggestions" ADD CONSTRAINT "phd_examiner_suggestions_sub_area_phd_sub_areas_sub_area_fk" FOREIGN KEY ("sub_area") REFERENCES "public"."phd_sub_areas"("sub_area") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phd_qualifying_exams" ADD CONSTRAINT "phd_qualifying_exams_semester_id_phd_semesters_id_fk" FOREIGN KEY ("semester_id") REFERENCES "public"."phd_semesters"("id") ON DELETE cascade ON UPDATE no action;