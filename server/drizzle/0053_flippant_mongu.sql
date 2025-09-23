ALTER TABLE "phd_proposal_dac_members" DROP CONSTRAINT "phd_proposal_dac_members_dac_member_email_faculty_email_fk";
--> statement-breakpoint
ALTER TABLE "phd_proposal_dac_members" ADD COLUMN "dac_member_name" text;--> statement-breakpoint
ALTER TABLE "phd_proposals" DROP column "active";--> statement-breakpoint
ALTER TABLE "public"."phd_proposals" DROP COLUMN "status";--> statement-breakpoint
DROP TYPE "public"."phd_proposal_status";--> statement-breakpoint
CREATE TYPE "public"."phd_proposal_status" AS ENUM('deleted', 'supervisor_review', 'supervisor_revert', 'drc_review', 'drc_revert', 'dac_review', 'dac_revert', 'dac_accepted', 'finalising', 'formalising', 'completed');--> statement-breakpoint
ALTER TABLE "public"."phd_proposals" ADD COLUMN "status" "public"."phd_proposal_status" NOT NULL DEFAULT 'supervisor_review';
ALTER TABLE "phd_proposals" ADD COLUMN "active" boolean GENERATED ALWAYS AS (CASE WHEN status IN('completed', 'deleted')THEN NULL ELSE true END) STORED;--> statement-breakpoint