ALTER TABLE "public"."course_handout_requests" DROP COLUMN "status";--> statement-breakpoint
DROP TYPE "public"."handout_status_enum";--> statement-breakpoint
CREATE TYPE "public"."handout_status_enum" AS ENUM('review pending', 'reviewed', 'approved', 'revision requested', 'notsubmitted');--> statement-breakpoint
ALTER TABLE "public"."course_handout_requests" ADD COLUMN "status" "public"."handout_status_enum" NOT NULL DEFAULT 'notsubmitted';