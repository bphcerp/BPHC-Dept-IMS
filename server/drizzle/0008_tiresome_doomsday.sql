CREATE TYPE "public"."conference_state_enum" AS ENUM('DRC Member', 'DRC Convener', 'HoD', 'Completed');--> statement-breakpoint
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
ALTER TABLE "text_field_status" ADD COLUMN "timestamp" timestamp with time zone DEFAULT now();