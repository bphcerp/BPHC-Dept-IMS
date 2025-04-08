CREATE TYPE "public"."category_enum" AS ENUM('HD', 'FD');--> statement-breakpoint
ALTER TABLE "course_handout_requests" ADD COLUMN "previous_submission_id" integer;--> statement-breakpoint
ALTER TABLE "course_handout_requests" ADD COLUMN "submitted_on" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "course_handout_requests" ADD COLUMN "category" "category_enum" NOT NULL;--> statement-breakpoint
ALTER TABLE "course_handout_requests" ADD CONSTRAINT "course_handout_requests_previous_submission_id_course_handout_requests_id_fk" FOREIGN KEY ("previous_submission_id") REFERENCES "public"."course_handout_requests"("id") ON DELETE set null ON UPDATE no action;