ALTER TABLE "faculty" ALTER COLUMN "designation" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "faculty" ADD COLUMN IF NOT EXISTS "name" text;--> statement-breakpoint
ALTER TABLE "phd" ADD COLUMN IF NOT EXISTS "id_number" text;--> statement-breakpoint
ALTER TABLE "phd" ADD COLUMN IF NOT EXISTS "erp_id" text;--> statement-breakpoint
ALTER TABLE "phd" ADD COLUMN IF NOT EXISTS "name" text;--> statement-breakpoint
ALTER TABLE "phd" ADD COLUMN IF NOT EXISTS "institute_email" text;--> statement-breakpoint
ALTER TABLE "phd" ADD COLUMN IF NOT EXISTS "mobile" text;--> statement-breakpoint
ALTER TABLE "phd" ADD COLUMN IF NOT EXISTS "personal_email" text;--> statement-breakpoint
ALTER TABLE "phd" ADD COLUMN IF NOT EXISTS "notional_supervisor_email" text;--> statement-breakpoint
ALTER TABLE "phd" ADD COLUMN IF NOT EXISTS "supervisor_email" text;--> statement-breakpoint
ALTER TABLE "phd" ADD COLUMN IF NOT EXISTS "co_supervisor_email" text;--> statement-breakpoint
ALTER TABLE "phd" ADD COLUMN IF NOT EXISTS "co_supervisor_email_2" text;--> statement-breakpoint
ALTER TABLE "phd" ADD COLUMN IF NOT EXISTS "dac_1_email" text;--> statement-breakpoint
ALTER TABLE "phd" ADD COLUMN IF NOT EXISTS "dac_2_email" text;--> statement-breakpoint
ALTER TABLE "phd" ADD COLUMN IF NOT EXISTS "nature_of_phd" text;--> statement-breakpoint
ALTER TABLE "phd" ADD COLUMN IF NOT EXISTS "qualifying_exam_1" text;--> statement-breakpoint
ALTER TABLE "phd" ADD COLUMN IF NOT EXISTS "qualifying_exam_date_2" boolean;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD COLUMN IF NOT EXISTS "type" "user_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "phd" DROP COLUMN IF EXISTS "psrn";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "name";