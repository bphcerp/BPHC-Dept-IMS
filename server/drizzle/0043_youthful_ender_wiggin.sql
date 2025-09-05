ALTER TABLE "users" ADD COLUMN "id" serial NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "profile_image" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "designation" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "department" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "education" text[] DEFAULT '{}'::text[];--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "research_interests" text[] DEFAULT '{}'::text[];--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "linkedin" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "orchid_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "scopus_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "google_scholar" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "additional_links" text[] DEFAULT '{}'::text[];--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_id_unique" UNIQUE("id");