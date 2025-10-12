ALTER TABLE "public"."allocation_semester" ALTER COLUMN "allocation_status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."allocation_status";--> statement-breakpoint
CREATE TYPE "public"."allocation_status" AS ENUM('notStarted', 'formCollection', 'inAllocation', 'completed');--> statement-breakpoint
ALTER TABLE "public"."allocation_semester" ALTER COLUMN "allocation_status" SET DATA TYPE "public"."allocation_status" USING "allocation_status"::"public"."allocation_status";--> statement-breakpoint
ALTER TABLE "public"."phd_requests" ALTER COLUMN "request_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."phd_request_type";--> statement-breakpoint
CREATE TYPE "public"."phd_request_type" AS ENUM('pre_submission', 'draft_notice', 'change_of_title', 'pre_thesis_submission', 'final_thesis_submission', 'jrf_recruitment', 'jrf_to_phd_conversion', 'project_fellow_conversion', 'manage_co_supervisor', 'stipend_payment', 'international_travel_grant', 'rp_grades', 'change_of_workplace', 'semester_drop', 'thesis_submission_extension', 'endorsements', 'phd_aspire_application', 'not_registered_student');--> statement-breakpoint
ALTER TABLE "public"."phd_requests" ALTER COLUMN "request_type" SET DATA TYPE "public"."phd_request_type" USING "request_type"::"public"."phd_request_type";