CREATE TYPE "public"."meeting_status" AS ENUM('pending_responses', 'awaiting_finalization', 'scheduled', 'cancelled', 'completed');--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "status" "meeting_status" DEFAULT 'pending_responses' NOT NULL;--> statement-breakpoint
ALTER TABLE "public"."meeting_availability" DROP COLUMN "availability";--> statement-breakpoint
DROP TYPE "public"."meeting_availability_status";--> statement-breakpoint
CREATE TYPE "public"."meeting_availability_status" AS ENUM('available', 'unavailable');--> statement-breakpoint
ALTER TABLE "public"."meeting_availability" ADD COLUMN "availability" "public"."meeting_availability_status" NOT NULL;