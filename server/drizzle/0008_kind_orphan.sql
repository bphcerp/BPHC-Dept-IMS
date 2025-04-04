CREATE TYPE "public"."conference_state_enum" AS ENUM('DRC Member', 'DRC Convener', 'HoD', 'Completed');--> statement-breakpoint
ALTER TABLE "conference_approval_applications" RENAME COLUMN "accomodation_reimbursement" TO "accommodation_reimbursement";--> statement-breakpoint
ALTER TABLE "conference_approval_applications" DROP CONSTRAINT "conference_approval_applications_accomodation_reimbursement_number_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "application_status" ALTER COLUMN "comments" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "date_field_status" ALTER COLUMN "comments" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "file_field_status" ALTER COLUMN "comments" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "number_field_status" ALTER COLUMN "comments" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "text_field_status" ALTER COLUMN "comments" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "conference_approval_applications" ADD COLUMN "state" "conference_state_enum" DEFAULT 'DRC Member' NOT NULL;--> statement-breakpoint
ALTER TABLE "application_status" ADD COLUMN "timestamp" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "date_field_status" ADD COLUMN "timestamp" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "file_field_status" ADD COLUMN "timestamp" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "number_field_status" ADD COLUMN "timestamp" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "text_field_status" ADD COLUMN "timestamp" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "conference_approval_applications" ADD CONSTRAINT "conference_approval_applications_accommodation_reimbursement_number_fields_id_fk" FOREIGN KEY ("accommodation_reimbursement") REFERENCES "public"."number_fields"("id") ON DELETE set null ON UPDATE no action;