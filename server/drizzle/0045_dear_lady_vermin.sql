ALTER TABLE "phd_examiner_assignments" ADD COLUMN "qp_submitted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "phd_examiner_assignments" DROP COLUMN "created_at";