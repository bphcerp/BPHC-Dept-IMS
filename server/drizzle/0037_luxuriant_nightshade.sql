CREATE TYPE "public"."patent_status" AS ENUM('Pending', 'Filed', 'Granted', 'Abandoned', 'Rejected');--> statement-breakpoint
ALTER TABLE "patent_inventors" DROP CONSTRAINT "patent_inventors_user_email_users_email_fk";
--> statement-breakpoint
ALTER TABLE "patent_inventors" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "patent_inventors" ALTER COLUMN "patent_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "patent_inventors" ALTER COLUMN "patent_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "patents" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "patents" ALTER COLUMN "department" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "patents" ALTER COLUMN "title" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "patents" ALTER COLUMN "campus" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "patents" ALTER COLUMN "filing_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "patents" ALTER COLUMN "filing_date" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "patents" ALTER COLUMN "application_publication_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "patents" ALTER COLUMN "granted_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "patents" ALTER COLUMN "filing_fy" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "patents" ALTER COLUMN "filing_ay" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "patents" ALTER COLUMN "status" SET DATA TYPE patent_status;--> statement-breakpoint
ALTER TABLE "patents" ALTER COLUMN "status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "patent_inventors" ADD COLUMN "name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "patent_inventors" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "patent_inventors" ADD COLUMN "department" text;--> statement-breakpoint
ALTER TABLE "patent_inventors" ADD COLUMN "campus" text;--> statement-breakpoint
ALTER TABLE "patent_inventors" ADD COLUMN "affiliation" text;--> statement-breakpoint
ALTER TABLE "patent_inventors" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "patent_inventors" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "patents" ADD COLUMN "inventors" jsonb;--> statement-breakpoint
ALTER TABLE "patents" ADD COLUMN "granted_patent_certificate_link" text;--> statement-breakpoint
ALTER TABLE "patents" ADD COLUMN "application_publication_link" text;--> statement-breakpoint
ALTER TABLE "patents" ADD COLUMN "form_01_link" text;--> statement-breakpoint
ALTER TABLE "patents" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "patents" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "patent_inventors" DROP COLUMN "user_email";