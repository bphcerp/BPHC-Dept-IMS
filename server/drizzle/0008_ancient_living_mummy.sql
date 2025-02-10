ALTER TYPE "user_type" ADD VALUE 'staff';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "staff" (
	"email" text PRIMARY KEY NOT NULL,
	"name" text,
	"department" text,
	"phone" text,
	"designation" text[] DEFAULT '{}'::text[]
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_email" text NOT NULL,
	"course_names" text[],
	"course_grades" text[],
	"course_units" integer[]
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "deadline" (
	"drc_member" text NOT NULL,
	"deadline" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "phd_applications" (
	"application_id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"file_id_1" text[] DEFAULT '{}'::text[] NOT NULL,
	"file_id_2" text[] DEFAULT '{}'::text[] NOT NULL,
	"file_id_3" text[] DEFAULT '{}'::text[] NOT NULL,
	"file_id_4" text[] DEFAULT '{}'::text[] NOT NULL,
	"file_id_5" text[] DEFAULT '{}'::text[] NOT NULL
);
--> statement-breakpoint
ALTER TABLE "phd" RENAME COLUMN "qualifying_exam_date_2" TO "qualifying_exam_2";--> statement-breakpoint
ALTER TABLE "phd" ADD COLUMN "qualifying_area_1" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "staff" ADD CONSTRAINT "staff_email_users_email_fk" FOREIGN KEY ("email") REFERENCES "public"."users"("email") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "courses" ADD CONSTRAINT "courses_student_email_phd_email_fk" FOREIGN KEY ("student_email") REFERENCES "public"."phd"("email") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "deadline" ADD CONSTRAINT "deadline_drc_member_faculty_email_fk" FOREIGN KEY ("drc_member") REFERENCES "public"."faculty"("email") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "phd_applications" ADD CONSTRAINT "phd_applications_email_phd_email_fk" FOREIGN KEY ("email") REFERENCES "public"."phd"("email") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
