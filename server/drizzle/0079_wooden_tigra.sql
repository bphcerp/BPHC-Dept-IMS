ALTER TYPE "public"."phd_proposal_status" ADD VALUE 'rejected' BEFORE 'supervisor_review';--> statement-breakpoint
ALTER TABLE "phd_proposals" drop column "active";--> statement-breakpoint
ALTER TABLE "phd_proposals" ADD COLUMN "active" boolean GENERATED ALWAYS AS (CASE WHEN status IN('deleted', 'completed', 'rejected')THEN NULL ELSE true END) STORED;

-- ALTER TYPE "public"."phd_proposal_status" ADD VALUE 'draft_expired';--> statement-breakpoint
-- ALTER TABLE "phd_proposals" drop column "active";--> statement-breakpoint
-- ALTER TABLE "phd_proposals" ADD COLUMN "active" boolean GENERATED ALWAYS AS (CASE WHEN status IN('deleted', 'completed', 'draft_expired', 'rejected')THEN NULL ELSE true END) STORED;