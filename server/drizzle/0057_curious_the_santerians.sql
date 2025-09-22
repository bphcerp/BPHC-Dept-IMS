ALTER TABLE "phd_proposals" DROP column "active";--> statement-breakpoint
ALTER TABLE "public"."phd_proposals" DROP COLUMN "status";--> statement-breakpoint
DROP TYPE "public"."phd_proposal_status";--> statement-breakpoint
CREATE TYPE "public"."phd_proposal_status" AS ENUM('deleted', 'supervisor_review', 'supervisor_revert', 'drc_review', 'drc_revert', 'dac_review', 'dac_revert', 'dac_accepted', 'seminar_pending', 'finalising_documents', 'completed');--> statement-breakpoint
ALTER TABLE "public"."phd_proposals" ADD COLUMN "status" "public"."phd_proposal_status" NOT NULL DEFAULT 'supervisor_review';--> statement-breakpoint
ALTER TABLE "phd_proposals" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "phd_proposals" ADD COLUMN "active" boolean GENERATED ALWAYS AS (CASE WHEN status IN('completed', 'deleted')THEN NULL ELSE true END) STORED;
