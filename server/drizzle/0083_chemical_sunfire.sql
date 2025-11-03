CREATE TYPE "public"."qp_status_enum" AS ENUM('not initiated', 'review pending', 'reviewed', 'approved', 'rejected', 'notsubmitted');--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD COLUMN "status" "qp_status_enum" DEFAULT 'not initiated' NOT NULL;--> statement-breakpoint
DROP TYPE "public"."qp_status_enum_";