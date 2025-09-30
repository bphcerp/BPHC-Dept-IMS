CREATE TYPE "public"."phd_exam_application_status_enum" AS ENUM('draft', 'applied', 'verified', 'resubmit');--> statement-breakpoint
ALTER TABLE "phd_exam_applications" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "phd_exam_applications" ADD COLUMN "status" "public"."phd_exam_application_status_enum" NOT NULL DEFAULT 'draft';--> statement-breakpoint
DROP TYPE "public"."phd_exam_application_status";