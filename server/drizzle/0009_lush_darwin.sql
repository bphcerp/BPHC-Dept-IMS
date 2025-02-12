CREATE TABLE IF NOT EXISTS "phd_config" (
	"key" text NOT NULL,
	"value" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "phd_courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_email" text NOT NULL,
	"course_names" text[],
	"course_grades" text[],
	"course_units" integer[]
);
--> statement-breakpoint
ALTER TABLE "phd" RENAME COLUMN "qualifying_exam_date_2" TO "qualifying_exam_2";--> statement-breakpoint
ALTER TABLE "phd" ADD COLUMN "qualifying_area_1" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "phd_courses" ADD CONSTRAINT "phd_courses_student_email_phd_email_fk" FOREIGN KEY ("student_email") REFERENCES "public"."phd"("email") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
