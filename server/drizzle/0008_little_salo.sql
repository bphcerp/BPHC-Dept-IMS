CREATE TYPE "public"."category_enum" AS ENUM('HD', 'FD');--> statement-breakpoint
ALTER TABLE "course_handout_requests" ADD COLUMN "submitted_on" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "course_handout_requests" ADD COLUMN "category" "category_enum" NOT NULL;