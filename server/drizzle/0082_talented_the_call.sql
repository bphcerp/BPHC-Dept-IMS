CREATE TYPE "public"."qp_status_enum_" AS ENUM('not initiated', 'review pending', 'reviewed', 'approved', 'rejected', 'notsubmitted');--> statement-breakpoint
ALTER TABLE "qp_review_requests" DROP COLUMN "status";--> statement-breakpoint
DROP TYPE "public"."qp_status_enum";