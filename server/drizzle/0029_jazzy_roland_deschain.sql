ALTER TYPE "public"."modules_enum" ADD VALUE 'Publications';--> statement-breakpoint
ALTER TABLE "conference_approval_applications" ALTER COLUMN "purpose" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "conference_approval_applications" ALTER COLUMN "content_title" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "conference_approval_applications" ALTER COLUMN "event_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "conference_approval_applications" ALTER COLUMN "venue" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "conference_approval_applications" ALTER COLUMN "date_from" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "conference_approval_applications" ALTER COLUMN "date_to" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "conference_approval_applications" ALTER COLUMN "organized_by" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "conference_approval_applications" ALTER COLUMN "mode_of_event" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "conference_approval_applications" ALTER COLUMN "description" SET NOT NULL;