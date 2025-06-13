ALTER TABLE "conference_approval_applications" ADD COLUMN "reimbursements" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "conference_approval_applications" DROP COLUMN "travel_reimbursement";--> statement-breakpoint
ALTER TABLE "conference_approval_applications" DROP COLUMN "registration_fee_reimbursement";--> statement-breakpoint
ALTER TABLE "conference_approval_applications" DROP COLUMN "daily_allowance_reimbursement";--> statement-breakpoint
ALTER TABLE "conference_approval_applications" DROP COLUMN "accommodation_reimbursement";--> statement-breakpoint
ALTER TABLE "conference_approval_applications" DROP COLUMN "other_reimbursement";