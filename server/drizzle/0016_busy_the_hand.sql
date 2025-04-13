ALTER TABLE "course_handout_requests" ALTER COLUMN "ic_email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "public"."course_handout_requests" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."handout_status_enum";--> statement-breakpoint
CREATE TYPE "public"."handout_status_enum" AS ENUM('review pending', 'reviewed', 'approved', 'rejected', 'notsubmitted');--> statement-breakpoint
ALTER TABLE "public"."course_handout_requests" ALTER COLUMN "status" SET DATA TYPE "public"."handout_status_enum" USING "status"::"public"."handout_status_enum";