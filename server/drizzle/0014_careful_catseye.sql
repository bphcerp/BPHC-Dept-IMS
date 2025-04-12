ALTER TABLE "course_handout_requests" ALTER COLUMN "ic_email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "course_handout_requests" DROP COLUMN "status";
DROP TYPE "public"."handout_status_enum";--> statement-breakpoint
CREATE TYPE "public"."handout_status_enum" AS ENUM('review pending', 'reviewed', 'approved', 'rejected', 'notsubmitted');--> statement-breakpoint
ALTER TABLE "course_handout_requests" ADD COLUMN "status" "handout_status_enum" DEFAULT 'notsubmitted' NOT NULL;