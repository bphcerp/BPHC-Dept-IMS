ALTER TABLE "allocation_semester" ADD COLUMN IF NOT EXISTS "summary_hidden" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "allocation_form" DROP COLUMN IF EXISTS "is_active";