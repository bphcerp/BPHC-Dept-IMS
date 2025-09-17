ALTER TYPE "public"."type_enum" ADD VALUE 'Both';--> statement-breakpoint
ALTER TABLE "qp_review_requests" ADD COLUMN "submitted_on" timestamp with time zone;