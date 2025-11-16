ALTER TYPE "public"."phd_request_status" ADD VALUE 'pending_edit_approval';--> statement-breakpoint
ALTER TABLE "phd_requests" ADD COLUMN "status_before_edit_request" "phd_request_status";