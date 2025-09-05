ALTER TABLE "users" ADD COLUMN "courses" text[] DEFAULT '{}'::text[];--> statement-breakpoint
ALTER TABLE "wilp_project" DROP COLUMN "reminder";--> statement-breakpoint
ALTER TABLE "wilp_project" DROP COLUMN "deadline";