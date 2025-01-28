DO $$ BEGIN
 CREATE TYPE "public"."user_type" AS ENUM('faculty', 'phd');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "faculty" ADD COLUMN "psrn" text;--> statement-breakpoint
ALTER TABLE "faculty" ADD COLUMN "department" text;--> statement-breakpoint
ALTER TABLE "faculty" ADD COLUMN "desgination" text;--> statement-breakpoint
ALTER TABLE "faculty" ADD COLUMN "room" text;--> statement-breakpoint
ALTER TABLE "faculty" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "phd" ADD COLUMN "psrn" text;--> statement-breakpoint
ALTER TABLE "phd" ADD COLUMN "department" text;--> statement-breakpoint
ALTER TABLE "phd" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "deactivated" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "type" "user_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "faculty" ADD CONSTRAINT "faculty_psrn_unique" UNIQUE("psrn");--> statement-breakpoint
ALTER TABLE "phd" ADD CONSTRAINT "phd_psrn_unique" UNIQUE("psrn");