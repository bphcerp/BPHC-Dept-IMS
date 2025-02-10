ALTER TYPE "user_type" ADD VALUE 'staff';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "staff" (
	"email" text PRIMARY KEY NOT NULL,
	"name" text,
	"department" text,
	"phone" text,
	"designation" text[] DEFAULT '{}'::text[]
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "phd_applications" (
	"application_id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"file_id_1" text[] DEFAULT '{}'::text[] NOT NULL,
	"file_id_2" text[] DEFAULT '{}'::text[] NOT NULL,
	"file_id_3" text[] DEFAULT '{}'::text[] NOT NULL,
	"file_id_4" text[] DEFAULT '{}'::text[] NOT NULL,
	"file_id_5" text[] DEFAULT '{}'::text[] NOT NULL
);
--> statement-breakpoint
ALTER TABLE "roles" RENAME COLUMN "role" TO "role_name";--> statement-breakpoint
ALTER TABLE "roles" DROP CONSTRAINT "roles_pkey";--> statement-breakpoint

ALTER TABLE "users" DROP COLUMN "roles";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "roles" integer[] NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "roles" SET DEFAULT '{}'::integer[];--> statement-breakpoint

ALTER TABLE "roles" ADD COLUMN "id" serial PRIMARY KEY NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "staff" ADD CONSTRAINT "staff_email_users_email_fk" FOREIGN KEY ("email") REFERENCES "public"."users"("email") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "phd_applications" ADD CONSTRAINT "phd_applications_email_phd_email_fk" FOREIGN KEY ("email") REFERENCES "public"."phd"("email") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_role_name_unique" UNIQUE("role_name");