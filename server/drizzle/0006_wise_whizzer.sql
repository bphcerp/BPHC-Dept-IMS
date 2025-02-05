CREATE TABLE IF NOT EXISTS "applications" (
	"application_id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"file_id_1" text[] DEFAULT '{}'::text[] NOT NULL,
	"file_id_2" text[] DEFAULT '{}'::text[] NOT NULL,
	"file_id_3" text[] DEFAULT '{}'::text[] NOT NULL,
	"file_id_4" text[] DEFAULT '{}'::text[] NOT NULL,
	"file_id_5" text[] DEFAULT '{}'::text[] NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "applications" ADD CONSTRAINT "applications_email_phd_email_fk" FOREIGN KEY ("email") REFERENCES "public"."phd"("email") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
